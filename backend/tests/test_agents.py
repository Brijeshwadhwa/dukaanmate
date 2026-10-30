"""
DukaanMate Backend — Unit Tests
Run with: cd backend && pytest tests/ -v

Tests cover:
- Pricing math (the core business logic)
- GST calculations (CGST+SGST vs IGST)
- Stock update validation
- Orchestrator routing (intent detection)
- Validation agent
- Input sanitization
"""
import pytest
import sys
import os

# Add backend to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.pricing_agent      import calculate_price
from agents.gst_invoice_agent  import calculate_invoice, get_next_invoice_number
from agents.inventory_advisor  import analyze_inventory
from agents.orchestrator       import detect_intent
from agents.validation_agent   import (
    validate_pricing_result, validate_gst_result,
    validate_chat_input, validate_stock_update
)


# =============================================================================
# PRICING AGENT TESTS
# =============================================================================

class TestPricingAgent:
    def test_basic_calculation(self):
        """Cost ₹18, 30% margin → price ₹23.40, profit ₹5.40"""
        result = calculate_price(cost=18.0, margin_percent=30.0)
        assert result["cost"] == 18.0
        assert result["profit_amount"] == 5.40
        assert result["suggested_price"] == 23.40
        assert result["warning"] is None  # 30% is fine

    def test_chips_example_from_demo(self):
        """
        Demo test: cost ₹18, expected selling price ~₹25 at ~38% margin.
        The demo says 'profit ₹7, warn below ₹22'.
        """
        # Test with 38.9% margin to get ₹25
        result = calculate_price(cost=18.0, margin_percent=38.89)
        assert result["suggested_price"] == pytest.approx(25.0, abs=0.5)
        assert result["profit_amount"] > 0

    def test_zero_margin(self):
        """0% margin → selling price equals cost, no profit"""
        result = calculate_price(cost=100.0, margin_percent=0.0)
        assert result["suggested_price"] == 100.0
        assert result["profit_amount"] == 0.0
        assert result["warning"] is not None  # Should warn about 0% margin

    def test_low_margin_warning(self):
        """5% margin should trigger a warning."""
        result = calculate_price(cost=100.0, margin_percent=5.0)
        assert result["warning"] is not None
        assert "₹" in result["warning"]

    def test_safe_margin_no_warning(self):
        """20% margin should NOT trigger a warning."""
        result = calculate_price(cost=100.0, margin_percent=20.0)
        assert result["warning"] is None

    def test_hindi_explanation(self):
        result = calculate_price(cost=50.0, margin_percent=20.0, language="hi")
        assert "₹" in result["explanation"]
        # Hindi text contains Devanagari
        assert "मुनाफ़ा" in result["explanation"]

    def test_punjabi_explanation(self):
        result = calculate_price(cost=50.0, margin_percent=20.0, language="pa")
        assert "₹" in result["explanation"]
        # Punjabi text contains Gurmukhi
        assert "ਮੁਨਾਫ਼ਾ" in result["explanation"]

    def test_negative_cost_raises(self):
        with pytest.raises(ValueError):
            calculate_price(cost=-10.0, margin_percent=30.0)

    def test_large_margin(self):
        """200% margin is unusual but valid (e.g., luxury goods)."""
        result = calculate_price(cost=10.0, margin_percent=200.0)
        assert result["suggested_price"] == 30.0
        assert result["profit_amount"] == 20.0


# =============================================================================
# GST AGENT TESTS
# =============================================================================

class TestGSTAgent:
    def _make_items(self, qty, rate, gst_rate):
        return [{"description": "Test Item", "quantity": qty, "rate": rate, "gst_rate": gst_rate}]

    def test_intrastate_5_percent(self):
        """
        Punjab → Punjab, 5% GST:
        Taxable = 100, CGST = 2.5, SGST = 2.5, IGST = 0, Total = 105
        """
        result = calculate_invoice(
            items             = self._make_items(10, 10.0, 5.0),
            supplier_state    = "Punjab",
            customer_state    = "Punjab",
            invoice_number    = "DM-0001-2026",
        )
        assert result.is_intrastate == True
        assert result.subtotal_taxable == pytest.approx(100.0)
        assert result.total_cgst  == pytest.approx(2.5)
        assert result.total_sgst  == pytest.approx(2.5)
        assert result.total_igst  == pytest.approx(0.0)
        assert result.grand_total == pytest.approx(105.0)

    def test_interstate_18_percent(self):
        """
        Punjab → Delhi, 18% GST:
        Taxable = 200, CGST = 0, SGST = 0, IGST = 36, Total = 236
        """
        result = calculate_invoice(
            items             = self._make_items(2, 100.0, 18.0),
            supplier_state    = "Punjab",
            customer_state    = "Delhi",
            invoice_number    = "DM-0002-2026",
        )
        assert result.is_intrastate == False
        assert result.subtotal_taxable == pytest.approx(200.0)
        assert result.total_cgst  == pytest.approx(0.0)
        assert result.total_sgst  == pytest.approx(0.0)
        assert result.total_igst  == pytest.approx(36.0)
        assert result.grand_total == pytest.approx(236.0)

    def test_zero_gst(self):
        """0% GST: no tax added, grand total equals taxable value."""
        result = calculate_invoice(
            items             = self._make_items(1, 500.0, 0.0),
            supplier_state    = "Punjab",
            customer_state    = "Punjab",
            invoice_number    = "DM-0003-2026",
        )
        assert result.total_cgst  == 0.0
        assert result.total_sgst  == 0.0
        assert result.grand_total == 500.0

    def test_multiple_items_intrastate(self):
        """Multiple items with different GST rates."""
        items = [
            {"description": "Chips", "quantity": 10, "rate": 18.0, "gst_rate": 5.0},   # Taxable=180
            {"description": "Soap",  "quantity": 5,  "rate": 40.0, "gst_rate": 18.0},  # Taxable=200
        ]
        result = calculate_invoice(
            items           = items,
            supplier_state  = "Punjab",
            customer_state  = "Punjab",
            invoice_number  = "DM-0004-2026",
        )
        # CGST for chips: 180 * 2.5% = 4.5
        # CGST for soap:  200 * 9%   = 18
        # Total CGST = 22.5, Total SGST = 22.5
        assert result.subtotal_taxable == pytest.approx(380.0)
        assert result.total_cgst  == pytest.approx(22.5)
        assert result.total_sgst  == pytest.approx(22.5)
        assert result.grand_total == pytest.approx(425.0)

    def test_invalid_gst_rate(self):
        """GST rate of 15% is not valid in India."""
        with pytest.raises(ValueError, match="Invalid GST rate"):
            calculate_invoice(
                items           = self._make_items(1, 100.0, 15.0),
                supplier_state  = "Punjab",
                customer_state  = "Punjab",
                invoice_number  = "DM-0005-2026",
            )

    def test_invoice_number_generation(self):
        """Invoice numbers should be sequential."""
        num1 = get_next_invoice_number("shop-1", None)
        num2 = get_next_invoice_number("shop-1", 1)
        assert "0001" in num1
        assert "0002" in num2


# =============================================================================
# INVENTORY ADVISOR TESTS
# =============================================================================

class TestInventoryAdvisor:
    def _make_products(self):
        return [
            {"id": "p1", "name": "Bread",  "quantity": 0,  "low_stock_limit": 5,  "unit": "piece"},  # critical
            {"id": "p2", "name": "Chips",  "quantity": 3,  "low_stock_limit": 10, "unit": "packet"}, # low
            {"id": "p3", "name": "Cola",   "quantity": 50, "low_stock_limit": 10, "unit": "bottle"}, # fine
        ]

    def test_critical_and_low_detected(self):
        result = analyze_inventory(self._make_products())
        items = result["reorder_items"]
        assert result["critical_count"] == 1
        assert result["low_count"] == 1
        # Fine stock should not appear
        names = [i["name"] for i in items]
        assert "Bread" in names
        assert "Chips" in names
        assert "Cola" not in names

    def test_critical_comes_first(self):
        result = analyze_inventory(self._make_products())
        assert result["reorder_items"][0]["urgency"] == "critical"

    def test_all_fine(self):
        products = [
            {"id": "p1", "name": "Salt", "quantity": 100, "low_stock_limit": 5, "unit": "packet"},
        ]
        result = analyze_inventory(products)
        assert result["reorder_items"] == []
        assert result["critical_count"] == 0

    def test_punjabi_summary(self):
        result = analyze_inventory(self._make_products(), language="pa")
        # Summary should contain Gurmukhi script
        assert "ਉਤਪਾਦਾਂ" in result["summary"]

    def test_hindi_summary(self):
        result = analyze_inventory(self._make_products(), language="hi")
        assert "उत्पादों" in result["summary"]


# =============================================================================
# ORCHESTRATOR ROUTING TESTS
# =============================================================================

class TestOrchestratorRouting:
    def test_inventory_intent_english(self):
        assert detect_intent("What should I reorder today?") == "inventory"
        assert detect_intent("My stock is low for chips") == "inventory"

    def test_inventory_intent_hindi(self):
        assert detect_intent("मेरा स्टॉक खत्म हो रहा है") == "inventory"

    def test_pricing_intent_english(self):
        assert detect_intent("cost ₹18, what price should I set?") == "pricing"
        assert detect_intent("how much profit will I make?") == "pricing"

    def test_pricing_intent_hindi(self):
        assert detect_intent("price kitna rakhu") == "pricing"

    def test_pricing_intent_punjabi(self):
        assert detect_intent("ਭਾਅ ਕਿੰਨਾ ਰੱਖਣਾ ਚਾਹੀਦਾ") == "pricing"

    def test_gst_intent(self):
        assert detect_intent("create a GST invoice") == "gst"
        assert detect_intent("bill banana hai") == "gst"

    def test_customer_intent(self):
        assert detect_intent("customer ko reply karo") == "customer"
        assert detect_intent("WhatsApp message for customer") == "customer"

    def test_general_fallback(self):
        # Random question with no matching keywords
        assert detect_intent("hello how are you") == "general"


# =============================================================================
# VALIDATION AGENT TESTS
# =============================================================================

class TestValidationAgent:
    def test_valid_pricing(self):
        result = validate_pricing_result({"cost": 18.0, "suggested_price": 25.0, "profit_amount": 7.0})
        assert result.is_valid == True

    def test_negative_price_blocked(self):
        result = validate_pricing_result({"cost": 18.0, "suggested_price": -5.0, "profit_amount": -23.0})
        assert result.is_valid == False

    def test_absurd_price_blocked(self):
        """Price 100x cost is suspicious."""
        result = validate_pricing_result({"cost": 10.0, "suggested_price": 1500.0, "profit_amount": 1490.0})
        assert result.is_valid == False

    def test_empty_question_blocked(self):
        result = validate_chat_input("")
        assert result.is_valid == False

    def test_too_long_question_blocked(self):
        result = validate_chat_input("a" * 600)
        assert result.is_valid == False

    def test_valid_question(self):
        result = validate_chat_input("What should I reorder today?")
        assert result.is_valid == True

    def test_punjabi_question_valid(self):
        result = validate_chat_input("ਅੱਜ ਕੀ ਮੰਗਵਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?")
        assert result.is_valid == True

    def test_stock_validation_insufficient(self):
        """Cannot sell 10 when only 3 in stock."""
        product = {"quantity": 3, "unit": "packet", "name": "Chips"}
        result = validate_stock_update(product, quantity_to_sell=10)
        assert result.is_valid == False
        assert "3" in result.message

    def test_stock_validation_valid(self):
        product = {"quantity": 20, "unit": "packet", "name": "Chips"}
        result = validate_stock_update(product, quantity_to_sell=5)
        assert result.is_valid == True

    def test_stock_validation_zero_quantity(self):
        product = {"quantity": 10, "unit": "piece", "name": "Soap"}
        result = validate_stock_update(product, quantity_to_sell=0)
        assert result.is_valid == False


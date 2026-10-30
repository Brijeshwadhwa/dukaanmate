"""
DukaanMate Backend — Validation Agent
Checks every agent answer before it reaches the user.
Blocks or corrects unsafe, absurd, or incomplete responses.
Also prevents prompt injection by ensuring user text is treated as data, not instructions.
"""
from typing import Optional


class ValidationResult:
    def __init__(self, is_valid: bool, message: str, corrected_answer: Optional[str] = None):
        self.is_valid          = is_valid
        self.message           = message
        self.corrected_answer  = corrected_answer   # If we can auto-correct, provide the fixed version


def validate_pricing_result(result: dict) -> ValidationResult:
    """Validate that a pricing result is sensible."""
    price  = result.get("suggested_price", 0)
    cost   = result.get("cost", 0)
    profit = result.get("profit_amount", 0)

    # Check for negative or absurd numbers
    if price < 0:
        return ValidationResult(False, "Suggested price cannot be negative.")
    if cost < 0:
        return ValidationResult(False, "Cost cannot be negative.")
    if profit < -cost:
        return ValidationResult(False, "Loss exceeds cost price — this seems wrong.")
    if price > cost * 100:
        return ValidationResult(False, f"Suggested price ₹{price} seems unrealistically high (100x cost).")

    return ValidationResult(True, "OK")


def validate_gst_result(result) -> ValidationResult:
    """Validate that a GST calculation result is sensible."""
    if result.grand_total < 0:
        return ValidationResult(False, "Grand total cannot be negative.")
    if result.total_cgst < 0 or result.total_sgst < 0 or result.total_igst < 0:
        return ValidationResult(False, "Tax amounts cannot be negative.")
    # Sanity check: tax total should match individual taxes
    expected_tax = round(result.total_cgst + result.total_sgst + result.total_igst, 2)
    if abs(expected_tax - result.total_tax) > 0.01:
        return ValidationResult(False, "Tax calculation mismatch detected.")

    return ValidationResult(True, "OK")


def validate_chat_input(question: str, max_length: int = 500) -> ValidationResult:
    """
    Validate and sanitize user's chat input.
    Prevents prompt injection: we check length and strip control characters.
    The actual injection prevention is done by NEVER putting user text in the LLM system prompt.
    """
    if not question or not question.strip():
        return ValidationResult(False, "Question cannot be empty.")

    if len(question) > max_length:
        return ValidationResult(
            False,
            f"Question is too long. Please keep it under {max_length} characters.",
        )

    # Strip dangerous control characters (not printable Unicode — allow Punjabi/Hindi)
    sanitized = "".join(ch for ch in question if ch.isprintable() or ch in "\n\t")

    if len(sanitized) < 2:
        return ValidationResult(False, "Question is too short.")

    return ValidationResult(True, "OK", corrected_answer=sanitized)


def validate_agent_response(response: str, language: str) -> ValidationResult:
    """
    Check the final agent response before sending to the user.
    Blocks responses with:
    - Forbidden content (medical advice, tax filing promises, guaranteed returns)
    - Suspiciously short or empty responses
    - Responses that seem like raw LLM errors
    """
    if not response or not response.strip():
        return ValidationResult(False, "Empty response from agent.")

    if len(response) < 5:
        return ValidationResult(False, "Response too short to be useful.")

    # Block responses that make dangerous promises
    BLOCKED_PHRASES = [
        "guaranteed profit",
        "guaranteed return",
        "this medicine",
        "tax filing complete",
        "gst filed",
        "I am an AI language model",
        "As an AI",
        "I cannot",  # LLM refusal — use fallback template instead
    ]
    lower_response = response.lower()
    for phrase in BLOCKED_PHRASES:
        if phrase.lower() in lower_response:
            return ValidationResult(
                False,
                f"Response contained potentially problematic content: '{phrase}'",
            )

    return ValidationResult(True, "OK")


def validate_stock_update(product: dict, quantity_to_sell: int) -> ValidationResult:
    """
    Validate a stock update before applying it.
    Prevents negative stock and catches impossible quantities.
    """
    current_qty = int(product.get("quantity", 0))

    if quantity_to_sell <= 0:
        return ValidationResult(False, "Quantity to sell must be positive.")
    if quantity_to_sell > 10000:
        return ValidationResult(False, "Quantity seems unrealistically large (>10,000).")
    if quantity_to_sell > current_qty:
        return ValidationResult(
            False,
            f"Cannot sell {quantity_to_sell} {product.get('unit','units')} — only {current_qty} in stock.",
        )

    return ValidationResult(True, "OK")


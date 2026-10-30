"""
DukaanMate Backend — GST / Invoice Agent
All GST calculations are done in Python with fixed rules.
The LLM never touches the math — only writes explanations.

Indian GST rules:
- Intra-state (same state): CGST + SGST, each at rate/2
- Inter-state (different state): IGST at full rate
"""
from typing import List, Optional
from dataclasses import dataclass

# Allowed GST rates per Indian GST law
ALLOWED_GST_RATES = {0.0, 5.0, 12.0, 18.0, 28.0}


@dataclass
class InvoiceLineResult:
    description: str
    quantity: float
    rate: float
    gst_rate: float
    taxable_value: float
    cgst_amount: float    # 0 for inter-state
    sgst_amount: float    # 0 for inter-state
    igst_amount: float    # 0 for intra-state
    total_tax: float
    line_total: float


@dataclass
class InvoiceResult:
    lines: List[InvoiceLineResult]
    subtotal_taxable: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_tax: float
    grand_total: float
    is_intrastate: bool
    invoice_number: str
    explanation: str


def calculate_invoice(
    items: list,          # List of dicts: description, quantity, rate, gst_rate
    supplier_state: str,
    customer_state: str,
    invoice_number: str,
    language: str = "en",
) -> InvoiceResult:
    """
    Calculate a complete GST invoice.
    All arithmetic is done in Python — fully deterministic and auditable.

    Args:
        items: Invoice line items
        supplier_state: State where the shop is located
        customer_state: State where the customer is
        invoice_number: Sequential invoice number
        language: Language for the explanation text
    """
    is_intrastate = (supplier_state.strip().lower() == customer_state.strip().lower())

    lines = []
    total_taxable = 0.0
    total_cgst    = 0.0
    total_sgst    = 0.0
    total_igst    = 0.0

    for item in items:
        # Validate GST rate
        gst_rate = float(item.get("gst_rate", 5.0))
        if gst_rate not in ALLOWED_GST_RATES:
            raise ValueError(f"Invalid GST rate {gst_rate}%. Allowed: 0, 5, 12, 18, 28")

        qty           = float(item["quantity"])
        rate          = float(item["rate"])
        taxable_value = round(qty * rate, 2)

        if is_intrastate:
            # CGST + SGST, each half the GST rate
            half_rate   = gst_rate / 2
            cgst_amount = round(taxable_value * half_rate / 100, 2)
            sgst_amount = round(taxable_value * half_rate / 100, 2)
            igst_amount = 0.0
        else:
            # IGST at full rate
            cgst_amount = 0.0
            sgst_amount = 0.0
            igst_amount = round(taxable_value * gst_rate / 100, 2)

        total_tax  = cgst_amount + sgst_amount + igst_amount
        line_total = taxable_value + total_tax

        lines.append(InvoiceLineResult(
            description   = str(item["description"])[:200],
            quantity      = qty,
            rate          = rate,
            gst_rate      = gst_rate,
            taxable_value = taxable_value,
            cgst_amount   = cgst_amount,
            sgst_amount   = sgst_amount,
            igst_amount   = igst_amount,
            total_tax     = total_tax,
            line_total    = line_total,
        ))

        total_taxable += taxable_value
        total_cgst    += cgst_amount
        total_sgst    += sgst_amount
        total_igst    += igst_amount

    total_taxable = round(total_taxable, 2)
    total_cgst    = round(total_cgst, 2)
    total_sgst    = round(total_sgst, 2)
    total_igst    = round(total_igst, 2)
    total_tax     = round(total_cgst + total_sgst + total_igst, 2)
    grand_total   = round(total_taxable + total_tax, 2)

    explanation = _build_explanation(is_intrastate, total_cgst, total_sgst, total_igst, grand_total, language)

    return InvoiceResult(
        lines             = lines,
        subtotal_taxable  = total_taxable,
        total_cgst        = total_cgst,
        total_sgst        = total_sgst,
        total_igst        = total_igst,
        total_tax         = total_tax,
        grand_total       = grand_total,
        is_intrastate     = is_intrastate,
        invoice_number    = invoice_number,
        explanation       = explanation,
    )


def _build_explanation(
    is_intrastate: bool,
    cgst: float, sgst: float, igst: float,
    total: float, lang: str
) -> str:
    """Generate a plain-language explanation of the GST breakdown."""
    if is_intrastate:
        if lang == "pa":
            return (f"ਇਹ ਇੱਕੋ ਸੂਬੇ ਦੀ ਵਿਕਰੀ ਹੈ। "
                    f"CGST ₹{cgst:.2f} + SGST ₹{sgst:.2f} = ਕੁੱਲ GST ₹{cgst+sgst:.2f}। "
                    f"ਕੁੱਲ ਭੁਗਤਾਨ: ₹{total:.2f}")
        elif lang == "hi":
            return (f"यह एक ही राज्य की बिक्री है। "
                    f"CGST ₹{cgst:.2f} + SGST ₹{sgst:.2f} = कुल GST ₹{cgst+sgst:.2f}। "
                    f"कुल भुगतान: ₹{total:.2f}")
        else:
            return (f"This is an intra-state sale (same state). "
                    f"CGST ₹{cgst:.2f} + SGST ₹{sgst:.2f} = Total GST ₹{cgst+sgst:.2f}. "
                    f"Grand Total: ₹{total:.2f}")
    else:
        if lang == "pa":
            return (f"ਇਹ ਦੂਜੇ ਸੂਬੇ ਦੀ ਵਿਕਰੀ ਹੈ। "
                    f"IGST ₹{igst:.2f} ਲੱਗੇਗਾ। ਕੁੱਲ ਭੁਗਤਾਨ: ₹{total:.2f}")
        elif lang == "hi":
            return (f"यह दूसरे राज्य की बिक्री है। "
                    f"IGST ₹{igst:.2f} लगेगा। कुल भुगतान: ₹{total:.2f}")
        else:
            return (f"This is an inter-state sale (different states). "
                    f"IGST ₹{igst:.2f} applies. Grand Total: ₹{total:.2f}")


def get_next_invoice_number(shop_id: str, last_number: Optional[int]) -> str:
    """
    Generate a sequential, human-readable invoice number.
    Format: DM-{SHOP_SHORT}-{YEAR}-{SEQUENCE}
    Example: DM-001-2026-0042
    """
    from datetime import datetime
    year     = datetime.now().year
    sequence = (last_number or 0) + 1
    return f"DM-{sequence:04d}-{year}"


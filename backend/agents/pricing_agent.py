"""
DukaanMate Backend — Pricing Agent
Calculates suggested selling price using Python arithmetic ONLY.
Gemini (if available) only writes the explanation text — it never does math.
"""
from typing import Optional

# Minimum profit margin below which we show a warning (10%)
MINIMUM_MARGIN_PERCENT = 10.0

def calculate_price(
    cost: float,
    margin_percent: float,
    language: str = "en"
) -> dict:
    """
    Calculate suggested selling price from cost and desired margin.
    All math is done in Python — deterministic, auditable, never LLM.

    Returns a dict with:
    - suggested_price: float
    - profit_amount: float
    - margin_actual: float
    - warning: str or None
    - explanation: str (simple text)
    """
    if cost < 0:
        raise ValueError("Cost cannot be negative.")
    if margin_percent < 0 or margin_percent > 1000:
        raise ValueError("Margin percentage must be between 0 and 1000.")

    # Core formula: selling price = cost * (1 + margin/100)
    profit_amount    = round(cost * margin_percent / 100, 2)
    suggested_price  = round(cost + profit_amount, 2)
    margin_actual    = round(margin_percent, 2)

    # Warning if profit margin is very small
    warning = None
    if margin_percent < MINIMUM_MARGIN_PERCENT:
        warning = _warning_text(cost, suggested_price, language)

    explanation = _explanation_text(cost, profit_amount, suggested_price, language)

    return {
        "cost":             cost,
        "margin_percent":   margin_actual,
        "profit_amount":    profit_amount,
        "suggested_price":  suggested_price,
        "warning":          warning,
        "explanation":      explanation,
    }

def _explanation_text(cost: float, profit: float, price: float, lang: str) -> str:
    """Generate a simple human-readable explanation in the chosen language."""
    if lang == "pa":
        return f"ਖਰੀਦ ₹{cost:.0f} + ਮੁਨਾਫ਼ਾ ₹{profit:.0f} = ਭਾਅ ₹{price:.0f}"
    elif lang == "hi":
        return f"लागत ₹{cost:.0f} + मुनाफ़ा ₹{profit:.0f} = बिक्री मूल्य ₹{price:.0f}"
    else:
        return f"Cost ₹{cost:.0f} + Profit ₹{profit:.0f} = Selling Price ₹{price:.0f}"

def _warning_text(cost: float, price: float, lang: str) -> str:
    """Warn user when margin is dangerously low."""
    min_safe = round(cost * 1.22, 0)
    if lang == "pa":
        return f"⚠️ ਮੁਨਾਫ਼ਾ ਬਹੁਤ ਘੱਟ ਹੈ! ₹{min_safe:.0f} ਤੋਂ ਘੱਟ ਨਾ ਵੇਚੋ।"
    elif lang == "hi":
        return f"⚠️ मुनाफ़ा बहुत कम है! ₹{min_safe:.0f} से नीचे न बेचें।"
    else:
        return f"⚠️ Profit margin is very low! Do not sell below ₹{min_safe:.0f}."

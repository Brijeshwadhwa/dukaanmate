"""
DukaanMate Backend — Inventory Advisor Agent
Uses SQL + rule-based logic to find shortages and suggest reorder quantities.
Gemini (if available) only writes the human-readable explanation.
"""
from typing import List, Optional
from dataclasses import dataclass


@dataclass
class ReorderItem:
    product_id: str
    name: str
    current_qty: int
    low_stock_limit: int
    unit: str
    suggested_reorder: int
    urgency: str           # "critical" | "low" | "watch"
    reason: str


def analyze_inventory(products: list, language: str = "en") -> dict:
    """
    Analyze inventory to find items that need reordering.
    Uses simple business rules — no LLM needed for the core logic.

    Args:
        products: List of product dicts from the database
        language: Language for the explanation

    Returns:
        dict with reorder_items, summary, and explanation
    """
    reorder_items = []

    for p in products:
        qty   = int(p.get("quantity", 0))
        limit = int(p.get("low_stock_limit", 5))

        if qty == 0:
            urgency  = "critical"
            reorder  = max(limit * 4, 20)  # Order 4x the threshold or at least 20
        elif qty <= limit:
            urgency  = "low"
            reorder  = max(limit * 2, 10)  # Order 2x the threshold or at least 10
        elif qty <= limit * 2:
            urgency  = "watch"
            reorder  = 0  # No immediate action needed
        else:
            continue  # Stock is fine, skip

        reason = _reason_text(qty, limit, urgency, language)

        reorder_items.append(ReorderItem(
            product_id        = p["id"],
            name              = p["name"],
            current_qty       = qty,
            low_stock_limit   = limit,
            unit              = p.get("unit", "piece"),
            suggested_reorder = reorder,
            urgency           = urgency,
            reason            = reason,
        ))

    # Sort: critical first, then low
    priority_order = {"critical": 0, "low": 1, "watch": 2}
    reorder_items.sort(key=lambda x: priority_order.get(x.urgency, 3))

    critical_count = sum(1 for r in reorder_items if r.urgency == "critical")
    low_count      = sum(1 for r in reorder_items if r.urgency == "low")

    summary     = _summary_text(critical_count, low_count, language)
    explanation = _full_explanation(reorder_items, language)

    return {
        "reorder_items":  [_item_to_dict(r) for r in reorder_items],
        "critical_count": critical_count,
        "low_count":      low_count,
        "summary":        summary,
        "explanation":    explanation,
    }


def _item_to_dict(item: ReorderItem) -> dict:
    return {
        "product_id":        item.product_id,
        "name":              item.name,
        "current_qty":       item.current_qty,
        "low_stock_limit":   item.low_stock_limit,
        "unit":              item.unit,
        "suggested_reorder": item.suggested_reorder,
        "urgency":           item.urgency,
        "reason":            item.reason,
    }


def _reason_text(qty: int, limit: int, urgency: str, lang: str) -> str:
    if urgency == "critical":
        if lang == "pa": return f"ਸਟਾਕ ਖ਼ਤਮ ਹੋ ਗਿਆ! ਫ਼ੌਰਨ ਮੰਗਵਾਓ।"
        if lang == "hi": return f"स्टॉक खत्म हो गया! तुरंत मंगवाएं।"
        return f"Out of stock! Order immediately."
    elif urgency == "low":
        if lang == "pa": return f"ਸਿਰਫ਼ {qty} ਬਚੇ, ਸੀਮਾ {limit} ਹੈ।"
        if lang == "hi": return f"सिर्फ {qty} बचे, सीमा {limit} है।"
        return f"Only {qty} left, alert limit is {limit}."
    else:
        if lang == "pa": return f"ਸਟਾਕ ਘੱਟ ਹੋ ਰਿਹਾ ਹੈ ({qty} ਬਚੇ)।"
        if lang == "hi": return f"स्टॉक कम हो रहा है ({qty} बचे)।"
        return f"Stock getting low ({qty} remaining)."


def _summary_text(critical: int, low: int, lang: str) -> str:
    if critical == 0 and low == 0:
        if lang == "pa": return "✅ ਸਾਰਾ ਸਟਾਕ ਠੀਕ ਹੈ।"
        if lang == "hi": return "✅ सभी स्टॉक ठीक है।"
        return "✅ All stock levels are fine."
    total = critical + low
    if lang == "pa": return f"⚠️ {total} ਉਤਪਾਦਾਂ ਨੂੰ ਮੰਗਵਾਉਣਾ ਪਵੇਗਾ ({critical} ਤੁਰੰਤ)।"
    if lang == "hi": return f"⚠️ {total} उत्पादों को मंगवाना होगा ({critical} तुरंत)।"
    return f"⚠️ {total} product(s) need reordering ({critical} urgent)."


def _full_explanation(items: list, lang: str) -> str:
    if not items:
        if lang == "pa": return "ਅੱਜ ਕੁਝ ਮੰਗਵਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ।"
        if lang == "hi": return "आज कुछ मंगवाने की ज़रूरत नहीं।"
        return "No reorders needed today."
    lines = []
    for item in items:
        urgency = item.urgency if hasattr(item, "urgency") else item.get("urgency")
        name = item.name if hasattr(item, "name") else item.get("name")
        reason = item.reason if hasattr(item, "reason") else item.get("reason")
        suggested_reorder = item.suggested_reorder if hasattr(item, "suggested_reorder") else item.get("suggested_reorder")
        unit = item.unit if hasattr(item, "unit") else item.get("unit")
        
        if urgency == "critical":
            lines.append(f"🔴 {name}: {reason} Order {suggested_reorder} {unit}.")
        else:
            lines.append(f"🟡 {name}: {reason} Order {suggested_reorder} {unit}.")
    return "\n".join(lines)


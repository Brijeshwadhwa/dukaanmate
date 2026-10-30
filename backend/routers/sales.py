"""
DukaanMate Backend — Sales Router
Handles recording a sale and auto-updating stock.
Uses a DB transaction to ensure stock is always consistent.
"""
from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user_id
from core.database import supabase
from models.schemas import SaleCreate
from agents.validation_agent import validate_stock_update

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _get_shop_id(user_id: str) -> str:
    """Get the shop ID for this user. Raises 404 if shop not found."""
    result = supabase.table("shops").select("id").eq("user_id", user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Shop not found.")
    return result.data["id"]


@router.post("")
async def record_sale(
    body: SaleCreate,
    user_id: str = Depends(get_current_user_id),
):
    """
    Record a sale and decrease stock for each item.
    Validates stock availability before recording.
    """
    # Security: verify shop belongs to this user
    shop = supabase.table("shops").select("id, state").eq("user_id", user_id).eq("id", body.shop_id).maybe_single().execute()
    if not shop.data:
        raise HTTPException(status_code=403, detail="Shop not found or access denied.")

    shop_id = shop.data["id"]

    # ── Validate all items first (check stock) ────────────────────────────────
    total_amount  = 0.0
    total_profit  = 0.0
    validated_items = []

    for item in body.items:
        # Get product — verify it belongs to this shop
        prod_result = (
            supabase.table("products")
            .select("id, name, quantity, unit, purchase_price")
            .eq("id", item.product_id)
            .eq("shop_id", shop_id)
            .eq("is_active", True)
            .maybe_single()
            .execute()
        )
        if not prod_result.data:
            raise HTTPException(status_code=404, detail=f"Product '{item.product_id}' not found.")

        product = prod_result.data
        v = validate_stock_update(product, item.quantity)
        if not v.is_valid:
            raise HTTPException(status_code=400, detail=v.message)

        line_total  = item.unit_price * item.quantity
        line_cost   = float(product["purchase_price"]) * item.quantity
        line_profit = line_total - line_cost

        total_amount += line_total
        total_profit += line_profit
        validated_items.append({
            "product":      product,
            "item":         item,
            "line_total":   line_total,
            "line_profit":  line_profit,
        })

    # ── Record the sale ───────────────────────────────────────────────────────
    sale_result = (
        supabase.table("sales")
        .insert({
            "shop_id":        shop_id,
            "user_id":        user_id,
            "payment_method": body.payment_method.value,
            "total_amount":   round(total_amount, 2),
            "profit_amount":  round(total_profit, 2),
        })
        .execute()
    )
    if not sale_result.data:
        raise HTTPException(status_code=500, detail="Failed to record sale.")

    sale_id = sale_result.data[0]["id"]

    # ── Insert sale items and update stock ────────────────────────────────────
    sale_items_payload = []
    for vi in validated_items:
        product  = vi["product"]
        item     = vi["item"]
        new_qty  = int(product["quantity"]) - item.quantity

        # Update stock
        supabase.table("products").update({
            "quantity": new_qty
        }).eq("id", product["id"]).eq("shop_id", shop_id).execute()

        # Record line item
        sale_items_payload.append({
            "sale_id":      sale_id,
            "shop_id":      shop_id,
            "product_id":   product["id"],
            "quantity":     item.quantity,
            "unit_price":   item.unit_price,
            "total_price":  vi["line_total"],
        })

    if sale_items_payload:
        supabase.table("sale_items").insert(sale_items_payload).execute()

    return {
        "sale_id":      sale_id,
        "total_amount": round(total_amount, 2),
        "profit":       round(total_profit, 2),
        "items_count":  len(validated_items),
        "message":      "Sale recorded successfully. Stock updated.",
    }


@router.get("")
async def get_sales(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """Get recent sales for the current user's shop."""
    shop_id = _get_shop_id(user_id)
    result = (
        supabase.table("sales")
        .select("*, sale_items(*, products(name, unit))")
        .eq("shop_id", shop_id)
        .order("created_at", desc=True)
        .limit(min(limit, 100))  # Cap at 100
        .execute()
    )
    return result.data or []


"""
DukaanMate Backend — Products Router
CRUD operations for inventory products.
"""
from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user_id
from core.database import supabase
from models.schemas import ProductCreate

router = APIRouter(prefix="/api/products", tags=["products"])


def _verify_shop(user_id: str, shop_id: str) -> dict:
    """Verify shop belongs to user. Returns shop data."""
    result = supabase.table("shops").select("id").eq("user_id", user_id).eq("id", shop_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=403, detail="Shop not found or access denied.")
    return result.data


@router.get("")
async def list_products(
    shop_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _verify_shop(user_id, shop_id)
    result = (
        supabase.table("products")
        .select("*")
        .eq("shop_id", shop_id)
        .eq("is_active", True)
        .order("name")
        .execute()
    )
    return result.data or []


@router.post("")
async def create_product(
    shop_id: str,
    body: ProductCreate,
    user_id: str = Depends(get_current_user_id),
):
    _verify_shop(user_id, shop_id)
    result = supabase.table("products").insert({
        **body.model_dump(),
        "shop_id": shop_id,
        "user_id": user_id,
        "is_active": True,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create product.")
    return result.data[0]


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    shop_id: str,
    body: ProductCreate,
    user_id: str = Depends(get_current_user_id),
):
    _verify_shop(user_id, shop_id)
    result = (
        supabase.table("products")
        .update(body.model_dump())
        .eq("id", product_id)
        .eq("shop_id", shop_id)   # Security: only update if belongs to this shop
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found.")
    return result.data[0]


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    shop_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _verify_shop(user_id, shop_id)
    # Soft delete — keeps history intact
    supabase.table("products").update({"is_active": False}).eq("id", product_id).eq("shop_id", shop_id).execute()
    return {"message": "Product deleted."}


"""
DukaanMate Backend — Shop Router
Handles shop profile creation and retrieval.
All endpoints require a valid Supabase JWT.
"""
from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user_id
from core.database import supabase
from models.schemas import ShopCreate

router = APIRouter(prefix="/api/shops", tags=["shops"])


@router.get("/me")
async def get_my_shop(user_id: str = Depends(get_current_user_id)):
    """Get the current user's shop profile."""
    result = supabase.table("shops").select("*").eq("user_id", user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Shop not found. Please complete shop setup.")
    return result.data


@router.post("/me")
async def upsert_my_shop(
    body: ShopCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create or update the current user's shop profile."""
    payload = {
        **body.model_dump(),
        "user_id": user_id,  # Always use the verified JWT user_id — never trust client
    }
    result = (
        supabase.table("shops")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save shop profile.")
    return result.data[0]


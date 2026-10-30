"""
DukaanMate Backend — Agent Router
Handles the multi-agent chat endpoint.
Logs every request to agent_logs table.
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user_id
from core.config import settings
from core.database import supabase
from models.schemas import ChatRequest, AgentResponse
from agents.orchestrator import orchestrate
from core.demo_data import DEMO_SHOP, DEMO_PRODUCTS

router = APIRouter(prefix="/api/agent", tags=["agent"])

# Optional Gemini client — initialized once if key is present
_gemini_client = None

def _get_gemini_client():
    """Return Gemini client if configured, else None."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not settings.gemini_enabled:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_client = genai.GenerativeModel(settings.gemini_model)
        return _gemini_client
    except Exception as e:
        print(f"[GEMINI] Failed to initialize: {e}")
        return None


@router.post("/chat", response_model=AgentResponse)
async def agent_chat(
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Main chat endpoint — routes question through the multi-agent system.
    1. Verifies shop ownership
    2. Loads shop data and products
    3. Orchestrates agents
    4. Logs the interaction
    """
    start_time = time.time()

    # ── Handle demo shop mode ────────────────────────────────────────────────
    if body.shop_id == "demo-shop-sharma-123" or user_id == "demo-user-sharma-123":
        shop = DEMO_SHOP
        products = DEMO_PRODUCTS
    else:
        # ── Security: verify shop belongs to this user ────────────────────────────
        try:
            shop_result = (
                supabase.table("shops")
                .select("*")
                .eq("user_id", user_id)
                .eq("id", body.shop_id)
                .maybe_single()
                .execute()
            )
            if not shop_result.data:
                raise HTTPException(status_code=403, detail="Shop not found or access denied.")
            shop = shop_result.data

            # ── Load products for this shop (only minimum needed fields) ──────────────
            products_result = (
                supabase.table("products")
                .select("id, name, quantity, low_stock_limit, unit, purchase_price, selling_price, category")
                .eq("shop_id", shop["id"])
                .eq("is_active", True)
                .limit(100)  # Never send the whole database to LLM
                .execute()
            )
            products = products_result.data or []
        except Exception as e:
            # If Supabase connection fails in dev, fallback to demo data
            if not settings.is_production:
                shop = DEMO_SHOP
                products = DEMO_PRODUCTS
            else:
                raise HTTPException(status_code=500, detail="Database connection failed.")

    # ── Run orchestrator ──────────────────────────────────────────────────────
    gemini = _get_gemini_client()
    result = await orchestrate(
        question   = body.question,
        shop_data  = shop,
        products   = products,
        language   = body.language,
        gemini_client = gemini,
    )

    elapsed_ms = int((time.time() - start_time) * 1000)

    # ── Log the interaction (no sensitive data in logs) ───────────────────────
    try:
        if shop.get("id") != "demo-shop-sharma-123":
            supabase.table("agent_logs").insert({
                "shop_id":     shop["id"],
                "user_id":     user_id,
                "intent":      result.get("intent", "unknown"),
                "agents_used": result.get("agent_steps", []),
                "response_ms": elapsed_ms,
                "used_gemini": result.get("used_gemini", False),
                # NOTE: We do NOT log the actual question or answer for privacy
            }).execute()
    except Exception as e:
        # Logging failure should not break the response
        print(f"[LOG] Failed to write agent log: {e}")

    return AgentResponse(
        answer      = result["answer"],
        cards       = result.get("cards"),
        agent_steps = result.get("agent_steps", []),
        intent      = result.get("intent", "general"),
        used_gemini = result.get("used_gemini", False),
    )


@router.get("/pricing")
async def quick_pricing(
    cost: float,
    margin: float = 30.0,
    language: str = "en",
    user_id: str = Depends(get_current_user_id),
):
    """Quick pricing calculation endpoint."""
    from agents.pricing_agent import calculate_price
    if cost < 0 or cost > 1000000:
        raise HTTPException(status_code=400, detail="Invalid cost value.")
    if margin < 0 or margin > 1000:
        raise HTTPException(status_code=400, detail="Invalid margin percentage.")
    return calculate_price(cost, margin, language)


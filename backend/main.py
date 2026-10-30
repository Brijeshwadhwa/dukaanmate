"""
DukaanMate Backend — Main FastAPI Application
Sets up the app with:
- CORS (strict: only allowed origins)
- Security headers
- Rate limiting
- All routers
- Health check endpoint
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.config import settings

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="DukaanMate API",
    description="Multi-agent smart assistant for Indian shopkeepers.",
    version="1.0.0",
    # Disable docs in production for security
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

# ── Rate limiting setup ───────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS: Only allow the frontend origin ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,      # e.g. ["https://dukaanmate.vercel.app"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Prevent the browser from MIME-sniffing responses
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Basic XSS protection for older browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Only send HTTPS in production
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ── Request size limit middleware ─────────────────────────────────────────────
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    MAX_SIZE = 1 * 1024 * 1024  # 1 MB max request size
    if request.headers.get("content-length"):
        content_length = int(request.headers["content-length"])
        if content_length > MAX_SIZE:
            return JSONResponse(status_code=413, content={"detail": "Request too large."})
    return await call_next(request)

# ── Global error handler: generic message to users, details in logs ───────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log details server-side
    print(f"[ERROR] Unhandled exception: {exc.__class__.__name__}: {exc}")
    # Return generic message to user (no stack traces in production)
    return JSONResponse(
        status_code=500,
        content={"detail": "An error occurred. Please try again."},
    )

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
@limiter.limit("30/minute")
async def health_check(request: Request):
    """
    Health check endpoint. Frontend uses this to detect Render cold starts.
    Returns quickly without touching the database.
    """
    return {
        "status": "ok",
        "app": "DukaanMate",
        "version": "1.0.0",
        "gemini_enabled": settings.gemini_enabled,
    }

# ── Include all routers ───────────────────────────────────────────────────────
from routers import shops, products, sales, agent

app.include_router(shops.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(agent.router)


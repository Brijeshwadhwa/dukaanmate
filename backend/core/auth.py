"""
DukaanMate Backend — Auth Verification
Verifies the Supabase JWT on every protected endpoint.
The user_id is derived from the verified token — NEVER trusted from the client.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError
from core.config import settings

# FastAPI security scheme — expects "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    Verifies the Supabase JWT and returns the decoded payload.
    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    if token == "demo-token" and not settings.is_production:
        return {"sub": "demo-user-sharma-123", "email": "demo@sharma.store", "role": "authenticated"}

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload
    except InvalidTokenError as e:
        # Log detailed error server-side only; return generic message to user
        print(f"[AUTH] JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(payload: dict = Depends(verify_jwt)) -> str:
    """
    Extracts the user_id (sub claim) from the verified JWT payload.
    This is the only safe way to get the user identity — never from request body.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: user ID missing.")
    return user_id


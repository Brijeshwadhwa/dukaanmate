"""
DukaanMate Backend — Configuration
Loads all settings from environment variables (.env file).
Never puts secrets in code.
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_role_key: str = "placeholder-service-role-key"
    supabase_jwt_secret: str = "placeholder-jwt-secret-min-32-chars-long"

    # ── Gemini (optional) ────────────────────────────────────────────────────
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash-lite"

    # ── App config ───────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173"
    app_env: str = "development"
    max_question_length: int = 500

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def gemini_enabled(self) -> bool:
        """Returns True only if a valid Gemini key is configured."""
        return bool(self.gemini_api_key and len(self.gemini_api_key) > 10)

    @property
    def origins_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Single global settings object
settings = Settings()


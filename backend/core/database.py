"""
DukaanMate Backend — Supabase Client
Uses the service-role key (admin) for backend-only operations.
This key NEVER leaves the backend.
"""
from supabase import create_client, Client
from core.config import settings

# Create one global Supabase client (admin/service-role)
# This client bypasses RLS — so we MUST always filter by user_id/shop_id in code
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)


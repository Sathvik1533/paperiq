from contextvars import ContextVar
from supabase import create_client, Client
from .config import settings
from app.logger import get_logger

log = get_logger(__name__)

auth_token: ContextVar[str | None] = ContextVar("auth_token", default=None)
_verified_user_id: ContextVar[str | None] = ContextVar("verified_user_id", default=None)
_admin_client: Client | None = None

from supabase.lib.client_options import ClientOptions

def get_admin_db() -> Client:
    """Returns a Supabase client with SERVICE_ROLE key (bypasses RLS)."""
    global _admin_client
    if _admin_client is None:
        if not settings.supabase_url:
            raise RuntimeError("SUPABASE_URL must be set in .env")
        key = settings.supabase_service_key
        if not key or "mock" in key or not key.startswith("eyJ"):
            key = settings.supabase_anon_key
        if not key:
            raise RuntimeError("SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set in .env")
        _admin_client = create_client(
            settings.supabase_url, 
            key,
            options=ClientOptions(
                headers={'Connection': 'keep-alive'},
                schema='public'
            )
        )
        log.info("Supabase admin client initialised with connection pooling")
    return _admin_client

def get_db() -> Client:
    """
    Returns the singleton Supabase admin client for all backend operations.
    The dynamic per-request client creation was causing network socket exhaustion.
    Security: RLS is bypassed. The FastAPI routers MUST enforce authentication
    by verifying the _verified_user_id context variable before executing queries.
    """
    return get_admin_db()

async def check_db_health() -> bool:
    try:
        db = get_admin_db()
        db.table("colleges").select("id").limit(1).execute()
        return True
    except Exception as e:
        log.error(f"DB health check failed: {e}")
        return False

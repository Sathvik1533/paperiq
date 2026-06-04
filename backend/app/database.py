from supabase import create_client, Client
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
            )
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
        log.info("Supabase client initialised")
    return _client


async def check_db_health() -> bool:
    try:
        db = get_db()
        db.table("colleges").select("id").limit(1).execute()
        return True
    except Exception as e:
        log.error(f"DB health check failed: {e}")
        return False

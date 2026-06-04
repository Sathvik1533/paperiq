from fastapi import APIRouter
from app.database import check_db_health
from app.llm.provider_factory import get_llm_router
from app.logger import get_logger
import importlib.metadata

router = APIRouter()
log = get_logger(__name__)


@router.get("/health")
async def health():
    db_ok = await check_db_health()
    return {
        "success": True,
        "data": {
            "status": "ok" if db_ok else "degraded",
            "version": "0.1.0",
            "db": "ok" if db_ok else "error",
            "storage": "supabase",
        }
    }


@router.get("/llm/health")
async def llm_health():
    router_ = get_llm_router()
    statuses = await router_.health_status()
    return {
        "success": True,
        "data": {
            "providers": statuses,
            "active": router_.active_provider,
        }
    }


@router.get("/llm/active")
async def llm_active():
    router_ = get_llm_router()
    return {
        "success": True,
        "data": {"active_provider": router_.active_provider}
    }

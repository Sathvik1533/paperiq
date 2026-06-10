from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sentry_sdk
from jose import JWTError
import uuid
from .config import settings
from app.logger import get_logger, correlation_id
from app.database import auth_token, get_admin_db, _verified_user_id
from .auth.jwt_verifier import verify_supabase_jwt
from .errors import register_error_handlers
from .api import health, colleges, scrape, papers, extract, questions, analysis, planner, profile, admin, onboarding, marks_analysis, r22, cdn_cache, download, vision_vote, cross_reference, stats, feedback

log = get_logger(__name__)

# Public paths that do not require authentication
PUBLIC_PATHS = {"/api/v1/health", "/api/v1/health/detailed", "/api/v1/stats", "/api/v1/feedback", "/docs", "/redoc", "/openapi.json"}

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

sentry_sample_rate = 0.1 if settings.is_production else 1.0
sentry_sdk.init(
    dsn=getattr(settings, 'sentry_dsn', ''),
    traces_sample_rate=sentry_sample_rate,
)

app = FastAPI(
    title="PaperIQ API",
    description="AI Exam Intelligence Platform — every feature helps students score better marks with less effort.",
    version="0.3.0",
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
    openapi_url=f"/api/{settings.api_version}/openapi.json",
)

app.state.limiter = limiter

register_error_handlers(app)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    """Assign a unique correlation ID to each request for tracing."""
    cid = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:12]
    correlation_id.set(cid)
    request.state.request_id = cid
    response = await call_next(request)
    response.headers["X-Request-ID"] = cid
    return response

async def _verify_and_set_auth(request: Request) -> None:
    """Extract and verify JWT from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        auth_token.set(None)
        _verified_user_id.set(None)
        return

    token = auth_header.split(" ")[1]
    auth_token.set(token)

    try:
        payload = await verify_supabase_jwt(token)
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Token missing 'sub' claim")
        _verified_user_id.set(user_id)
    except (JWTError, RuntimeError) as e:
        log.warning(f"JWT verification failed: {e}")
        auth_token.set(None)
        _verified_user_id.set(None)


import asyncio

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    is_public = path in PUBLIC_PATHS or path.startswith("/api") is False

    if is_public:
        auth_token.set(None)
        _verified_user_id.set(None)
    else:
        await _verify_and_set_auth(request)

    return await call_next(request)


@app.middleware("http")
async def idempotent_retry_middleware(request: Request, call_next):
    """
    Catches database disconnects and Supabase timeouts.
    Automatically retries the operation 3 times with a 500ms delay.
    """
    # Cache body so it can be consumed multiple times during retries
    body = await request.body()
    async def receive():
        return {"type": "http.request", "body": body}
    request._receive = receive

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Re-inject the body for every attempt
            request._receive = receive
            response = await call_next(request)
            
            # If we get a 502/503/504 Gateway/Timeout error from upstream DB
            if response.status_code in [502, 503, 504]:
                if attempt < max_retries - 1:
                    log.warning(f"Idempotent retry {attempt + 1}/{max_retries} due to {response.status_code} on {request.url.path}")
                    await asyncio.sleep(0.5)
                    continue
            return response
            
        except Exception as e:
            error_str = str(e).lower()
            if "timeout" in error_str or "disconnect" in error_str or "connection" in error_str or "socket" in error_str:
                if attempt < max_retries - 1:
                    log.warning(f"Idempotent retry {attempt + 1}/{max_retries} due to disconnect exception: {e}")
                    await asyncio.sleep(0.5)
                    continue
            # If max retries exhausted or it's a non-retryable exception, bubble it up
            raise
            
    # Fallback return (should not hit)
    return await call_next(request)


# NOTE: slowapi's @limiter.limit decorator is for route handlers, not middleware.
# Global rate-limiting is handled via the slowapi exception handler registered above.
# Per-route limits are applied on sensitive endpoints (e.g. analysis, onboarding).

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = f"/api/{settings.api_version}"

app.include_router(health.router,     prefix=PREFIX, tags=["System"])
app.include_router(colleges.router,   prefix=PREFIX, tags=["Academic"])
app.include_router(scrape.router,     prefix=PREFIX, tags=["Scraping"])
# CRITICAL: download.router MUST come before papers.router so that
# GET /papers/{id}/download → real MLRIT DOCX extraction (not AI-generated PDF)
app.include_router(download.router,   prefix=PREFIX, tags=["Papers"])
app.include_router(papers.router,     prefix=PREFIX, tags=["Papers"])
app.include_router(cdn_cache.router,  prefix=PREFIX, tags=["CDN"])
app.include_router(extract.router,    prefix=PREFIX, tags=["Extraction"])
app.include_router(questions.router,  prefix=PREFIX, tags=["Questions"])
app.include_router(analysis.router,   prefix=PREFIX, tags=["Analysis"])
app.include_router(marks_analysis.router, prefix=PREFIX, tags=["Analysis"])
app.include_router(planner.router,    prefix=PREFIX, tags=["Planner"])
app.include_router(profile.router,    prefix=PREFIX, tags=["Profile"])
app.include_router(onboarding.router, prefix=f"{PREFIX}/onboarding", tags=["Onboarding"])
app.include_router(admin.router,      prefix=PREFIX, tags=["Admin"])
app.include_router(r22.router,        prefix=PREFIX, tags=["R22"])
app.include_router(vision_vote.router, prefix=PREFIX, tags=["Vision"])
app.include_router(cross_reference.router, prefix=PREFIX, tags=["Analysis"])
app.include_router(stats.router,    prefix=PREFIX, tags=["System"])
app.include_router(feedback.router, prefix=PREFIX, tags=["Feedback"])

@app.on_event("startup")
async def startup():
    log.info("PaperIQ API starting up")
    log.info(f"Environment: {settings.environment}")
    log.info(f"LLM provider order: {settings.llm_provider_order}")
    import os
    os.makedirs(settings.scraper_download_dir, exist_ok=True)
    
    # Auto-build knowledge base if not exists
    from app.jobs.knowledge_base_builder import auto_build_mlrit_r22_knowledge_base
    try:
        # Use admin client directly — startup runs with no user auth context
        import app.database as _db
        _db.auth_token.set(None)
        
        log.info("[Startup] Checking knowledge base status")
        result = await auto_build_mlrit_r22_knowledge_base()
        if result.get("skipped"):
            log.info("[Startup] Knowledge base already exists")
        else:
            log.info(f"[Startup] Knowledge base built: {result.get('message')}")
    except Exception as e:
        log.error(f"[Startup] Knowledge base auto-build failed: {e}")
        log.error("[Startup] Continuing without knowledge base — use /admin/knowledge-base/build to retry")


@app.on_event("shutdown")
async def shutdown():
    log.info("PaperIQ API shutting down")
    # Shut down thread pools
    from app.api.papers import pdf_executor
    from app.api.download import io_executor
    pdf_executor.shutdown(wait=False)
    io_executor.shutdown(wait=False)
    log.info("Thread pools shut down")

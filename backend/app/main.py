from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.logger import get_logger
from app.api import health, colleges, scrape, papers, extract, questions, analysis, planner, profile, admin, onboarding, marks_analysis, r22, cdn_cache, download

log = get_logger(__name__)

app = FastAPI(
    title="PaperIQ API",
    description="AI Exam Intelligence Platform — every feature helps students score better marks with less effort.",
    version="0.3.0",
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
    openapi_url=f"/api/{settings.api_version}/openapi.json",
)

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
app.include_router(download.router,   prefix=PREFIX, tags=["Download"])


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

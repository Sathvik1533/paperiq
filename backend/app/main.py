from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.logger import get_logger
from app.api import health, colleges, scrape, papers, extract, questions

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
app.include_router(extract.router,    prefix=PREFIX, tags=["Extraction"])
app.include_router(questions.router,  prefix=PREFIX, tags=["Questions"])


@app.on_event("startup")
async def startup():
    log.info("PaperIQ API starting up")
    log.info(f"Environment: {settings.environment}")
    log.info(f"LLM provider order: {settings.llm_provider_order}")
    import os
    os.makedirs(settings.scraper_download_dir, exist_ok=True)


@app.on_event("shutdown")
async def shutdown():
    log.info("PaperIQ API shutting down")

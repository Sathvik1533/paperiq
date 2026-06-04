import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from app.models.job import ScrapeRequest
from app.jobs.job_manager import create_job, get_job
from app.jobs.scrape_job import run_scrape_job
from app.database import get_db
from app.logger import get_logger
from app.middleware.rate_limit import rate_limit_scrape

router = APIRouter()
log = get_logger(__name__)

MLRIT_PORTAL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"


@router.post("/scrape/trigger")
async def trigger_scrape(
    req: ScrapeRequest,
    background_tasks: BackgroundTasks,
    _: None = Depends(rate_limit_scrape),
):
    # Resolve college details
    db = get_db()
    college = db.table("colleges").select("*").eq("id", req.college_id).single().execute()
    if not college.data:
        raise HTTPException(404, f"College {req.college_id} not found")

    c = college.data
    portal_url = c.get("portal_url") or MLRIT_PORTAL
    scraper_type = c.get("scraper_type", "mlrit")

    # Resolve source_id
    source = db.table("paper_sources").select("id").eq("college_id", req.college_id).limit(1).execute()
    source_id = source.data[0]["id"] if source.data else None

    job = create_job(
        college_id=req.college_id,
        subject_id=req.subject_id,
        source_id=source_id,
    )

    background_tasks.add_task(
        run_scrape_job,
        job_id=job.id,
        college_id=req.college_id,
        scraper_type=scraper_type,
        portal_url=portal_url,
        subject_id=req.subject_id,
        source_id=source_id,
        btech_year=req.btech_year,
        year_from=req.year_from,
        year_to=req.year_to,
        force_refresh=req.force_refresh,
    )

    log.info(f"[API] Scrape job queued: {job.id}")
    return {
        "success": True,
        "data": {
            "job_id": job.id,
            "status": job.status,
            "message": f"Scraping {c['name']} | years {req.year_from}–{req.year_to}",
        }
    }


@router.get("/scrape/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        # Try DB
        db = get_db()
        result = db.table("scraping_jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(404, f"Job {job_id} not found")
        return {"success": True, "data": result.data}

    return {
        "success": True,
        "data": {
            "id": job.id,
            "status": job.status,
            "stage": job.stage,
            "progress_pct": job.progress_pct,
            "total_files": job.total_files,
            "processed_files": job.processed_files,
            "papers_found": job.papers_found,
            "papers_new": job.papers_new,
            "papers_cached": job.papers_cached,
            "scraper_used": job.scraper_used,
            "error_log": job.error_log,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
    }


@router.get("/scrape/jobs")
async def list_jobs():
    db = get_db()
    result = db.table("scraping_jobs").select("*").order("created_at", desc=True).limit(20).execute()
    return {"success": True, "data": result.data}

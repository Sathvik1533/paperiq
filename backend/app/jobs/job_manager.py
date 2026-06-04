import asyncio
from datetime import datetime
from typing import Dict, Optional
from app.models.job import ScrapingJob, JobStatus, JobStage
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# In-memory store for active jobs (persisted to DB asynchronously)
_jobs: Dict[str, ScrapingJob] = {}


def create_job(college_id: str, subject_id: Optional[str] = None,
               source_id: Optional[str] = None, user_id: Optional[str] = None) -> ScrapingJob:
    job = ScrapingJob(
        college_id=college_id,
        subject_id=subject_id,
        source_id=source_id,
        user_id=user_id,
    )
    _jobs[job.id] = job
    _persist_job(job)
    log.info(f"[JobManager] Created job {job.id}")
    return job


def get_job(job_id: str) -> Optional[ScrapingJob]:
    return _jobs.get(job_id)


def update_job(job_id: str, **kwargs) -> Optional[ScrapingJob]:
    job = _jobs.get(job_id)
    if not job:
        return None
    for k, v in kwargs.items():
        if hasattr(job, k):
            setattr(job, k, v)
    _persist_job(job)
    return job


def advance_stage(job_id: str, stage: JobStage, progress_pct: float) -> None:
    update_job(job_id, stage=stage, progress_pct=progress_pct)
    log.info(f"[JobManager] Job {job_id} → {stage} ({progress_pct:.0f}%)")


def complete_job(job_id: str, papers_found: int, papers_new: int, papers_cached: int) -> None:
    update_job(
        job_id,
        status=JobStatus.COMPLETED,
        stage=JobStage.DONE,
        progress_pct=100.0,
        papers_found=papers_found,
        papers_new=papers_new,
        papers_cached=papers_cached,
        completed_at=datetime.utcnow(),
    )
    log.info(f"[JobManager] Job {job_id} completed. found={papers_found} new={papers_new}")


def fail_job(job_id: str, error: str) -> None:
    job = _jobs.get(job_id)
    if job:
        job.error_log.append({"error": error, "at": datetime.utcnow().isoformat()})
    update_job(job_id, status=JobStatus.FAILED, completed_at=datetime.utcnow())
    log.error(f"[JobManager] Job {job_id} failed: {error}")


def _persist_job(job: ScrapingJob) -> None:
    """Fire-and-forget DB upsert."""
    try:
        db = get_db()
        db.table("scraping_jobs").upsert({
            "id": job.id,
            "user_id": job.user_id,
            "college_id": job.college_id,
            "subject_id": job.subject_id,
            "status": job.status.value,
            "scraper_used": job.scraper_used,
            "stage": job.stage.value if job.stage else None,
            "total_files": job.total_files,
            "processed_files": job.processed_files,
            "failed_files": job.failed_files,
            "progress_pct": job.progress_pct,
            "papers_found": job.papers_found,
            "papers_new": job.papers_new,
            "papers_cached": job.papers_cached,
            "error_log": job.error_log,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }).execute()
    except Exception as e:
        log.warning(f"[JobManager] DB persist failed (non-fatal): {e}")

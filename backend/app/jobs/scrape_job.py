"""
Scrape Job — Full auto pipeline:
  Auto-discover syllabus → Discover papers → Download → Extract → Parse → Map topics

Fix A: auto-discovers/downloads syllabus before scraping papers.
Fix B: passes exam_categories + exam_attempts filters to scraper.
Fix C (in parse_job): auto-triggers topic mapping after parsing.
"""
import asyncio
import os
from datetime import datetime
from app.models.job import JobStatus, JobStage
from app.models.paper import PaperMeta
from app.jobs.job_manager import (
    create_job, update_job, advance_stage, complete_job, fail_job, get_job
)
from app.scrapers.scraper_factory import ScraperFactory
from app.utils.file_utils import download_dir
from app.utils.hash_utils import sha256_file
from app.database import get_admin_db
from app.logger import get_logger

log = get_logger(__name__)


async def run_scrape_job(
    job_id: str,
    college_id: str,
    scraper_type: str,
    portal_url: str,
    subject_id: str | None,
    source_id: str | None,
    btech_year: int,
    year_from: int,
    year_to: int,
    force_refresh: bool = False,
    exam_categories: list[str] | None = None,
    exam_attempts: list[str] | None = None,
    regulation: str | None = None,
) -> None:
    """
    Full auto pipeline:
    1. Auto-discover & download syllabus (Fix A — fallback: manual upload)
    2. Discover matching paper archives
    3. Download archives
    4. Extract text from archives
    5. Parse questions
    6. Map questions to syllabus topics (via parse_job Fix C)
    """
    update_job(job_id, status=JobStatus.RUNNING, started_at=datetime.utcnow())

    try:
        # ── Stage 0: Auto-discover syllabus (Fix A) ──────────────────────
        if subject_id and regulation:
            advance_stage(job_id, JobStage.DISCOVERING, 2)
            update_job(job_id, stage=JobStage.DISCOVERING)
            log.info(f"[ScrapeJob:{job_id}] Auto-discovering syllabus...")
            try:
                db = get_admin_db()
                college_row = db.table("colleges").select("short_name").eq("id", college_id).single().execute()
                college_short = college_row.data.get("short_name", "") if college_row.data else ""
                from app.intelligence.syllabus_discoverer import discover_and_ingest_syllabus
                syllabus_id = await discover_and_ingest_syllabus(
                    subject_id=subject_id,
                    regulation=regulation,
                    college_short_name=college_short,
                )
                if syllabus_id:
                    log.info(f"[ScrapeJob:{job_id}] Syllabus ready: {syllabus_id}")
                else:
                    log.info(f"[ScrapeJob:{job_id}] No auto-syllabus found — manual upload needed")
            except Exception as e:
                log.warning(f"[ScrapeJob:{job_id}] Syllabus discovery failed (non-fatal): {e}")

        # ── Stage 1: Discover papers ─────────────────────────────────────
        advance_stage(job_id, JobStage.DISCOVERING, 5)
        scraper, strategy = await ScraperFactory.get_scraper(scraper_type)
        update_job(job_id, scraper_used=strategy)

        papers = await scraper.list_papers(
            portal_url=portal_url,
            btech_year=btech_year,
            year_from=year_from,
            year_to=year_to,
            exam_categories=exam_categories,
            exam_attempts=exam_attempts,
        )
        update_job(job_id, total_files=len(papers))
        advance_stage(job_id, JobStage.DISCOVERING, 15)
        log.info(f"[ScrapeJob:{job_id}] Discovered {len(papers)} archives")

        if not papers:
            complete_job(job_id, 0, 0, 0)
            return

        # ── Stage 2: Download ────────────────────────────────────────────
        advance_stage(job_id, JobStage.DOWNLOADING, 20)
        dest = os.path.join(download_dir(), job_id)
        os.makedirs(dest, exist_ok=True)

        papers_new = 0
        papers_cached = 0
        new_paper_ids: list[str] = []

        for i, paper in enumerate(papers, 1):
            try:
                local_path = await scraper.download(paper, dest)
                file_hash = sha256_file(local_path)

                if not force_refresh and _paper_exists(file_hash):
                    papers_cached += 1
                    log.info(f"[ScrapeJob] Cached: {paper.file_name}")
                else:
                    papers_new += 1
                    paper_id = _store_paper_meta(
                        paper, local_path, file_hash,
                        college_id, subject_id, source_id
                    )
                    if paper_id:
                        new_paper_ids.append(paper_id)

            except Exception as e:
                job = get_job(job_id)
                if job:
                    job.failed_files += 1
                    job.error_log.append({"file": paper.file_name, "error": str(e)})
                log.warning(f"[ScrapeJob] Failed {paper.file_name}: {e}")

            pct = 20 + int((i / len(papers)) * 35)
            update_job(job_id, processed_files=i, progress_pct=pct)

        # ── Stage 3: Extract (B1 fix) ────────────────────────────────────
        if new_paper_ids:
            advance_stage(job_id, JobStage.EXTRACTING, 60)
            log.info(f"[ScrapeJob:{job_id}] Extracting {len(new_paper_ids)} new papers")
            try:
                from app.jobs.extract_job import run_extract_job
                extract_result = await run_extract_job(paper_id=None)
                log.info(f"[ScrapeJob:{job_id}] Extraction: {extract_result}")
            except Exception as e:
                log.warning(f"[ScrapeJob:{job_id}] Extraction failed (non-fatal): {e}")

        # ── Stage 4: Parse (B1 fix) ──────────────────────────────────────
        advance_stage(job_id, JobStage.PARSING, 80)
        log.info(f"[ScrapeJob:{job_id}] Parsing questions")
        try:
            from app.jobs.parse_job import run_parse_job
            parse_result = await run_parse_job(paper_id=None)
            log.info(f"[ScrapeJob:{job_id}] Parsing: {parse_result}")
        except Exception as e:
            log.warning(f"[ScrapeJob:{job_id}] Parsing failed (non-fatal): {e}")

        complete_job(
            job_id,
            papers_found=len(papers),
            papers_new=papers_new,
            papers_cached=papers_cached,
        )

    except Exception as e:
        fail_job(job_id, str(e))
        raise


def _paper_exists(file_hash: str) -> bool:
    try:
        db = get_admin_db()
        result = db.table("papers").select("id").eq("file_hash", file_hash).execute()
        return len(result.data) > 0
    except Exception:
        return False


def _store_paper_meta(
    paper: PaperMeta,
    local_path: str,
    file_hash: str,
    college_id: str,
    subject_id: str | None,
    source_id: str | None,
) -> str | None:
    """Returns the new paper_id, or None on failure."""
    try:
        file_size = os.path.getsize(local_path)
        ext = local_path.rsplit(".", 1)[-1].lower()
        db = get_admin_db()
        result = db.table("papers").insert({
            "college_id": college_id,
            "subject_id": subject_id,
            "source_id": source_id,
            "title": paper.label,
            "exam_type": paper.exam_type,
            "exam_month": paper.exam_month,
            "exam_year": paper.exam_year,
            "btech_year": paper.btech_year,
            "original_url": paper.url,
            "file_name": paper.file_name,
            "file_type": ext,
            "file_size_bytes": file_size,
            "file_hash": file_hash,
            "exam_category": paper.exam_category,
            "extraction_status": "pending",
            "max_marks": paper.max_marks or 70,  # Default to 70 marks (standard JNTUH)
            "duration_hours": 3,  # Standard exam duration
        }).execute()
        log.info(f"[ScrapeJob] Stored paper: {paper.file_name}")
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        log.error(f"[ScrapeJob] DB store failed: {e}")
        return None

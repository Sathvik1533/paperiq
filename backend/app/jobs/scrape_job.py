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
from app.database import get_db
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
) -> None:
    """
    Full scraping pipeline for one job:
    Discover → Download → Dedup → Store metadata
    Extraction and parsing happen in Milestone 2/3.
    """
    update_job(job_id, status=JobStatus.RUNNING, started_at=datetime.utcnow())

    try:
        # ── Stage 1: Discover ───────────────────────────────────────────
        advance_stage(job_id, JobStage.DISCOVERING, 5)
        scraper, strategy = await ScraperFactory.get_scraper(scraper_type)
        update_job(job_id, scraper_used=strategy)

        papers = await scraper.list_papers(
            portal_url=portal_url,
            btech_year=btech_year,
            year_from=year_from,
            year_to=year_to,
        )
        update_job(job_id, total_files=len(papers))
        advance_stage(job_id, JobStage.DISCOVERING, 15)
        log.info(f"[ScrapeJob:{job_id}] Discovered {len(papers)} archives")

        if not papers:
            complete_job(job_id, 0, 0, 0)
            return

        # ── Stage 2: Download ──────────────────────────────────────────
        advance_stage(job_id, JobStage.DOWNLOADING, 20)
        dest = os.path.join(download_dir(), job_id)
        os.makedirs(dest, exist_ok=True)

        papers_new = 0
        papers_cached = 0
        downloaded_paths: list[tuple[PaperMeta, str]] = []

        for i, paper in enumerate(papers, 1):
            try:
                local_path = await scraper.download(paper, dest)
                file_hash = sha256_file(local_path)

                # Dedup check
                if not force_refresh and _paper_exists(file_hash):
                    papers_cached += 1
                    log.info(f"[ScrapeJob] Cached: {paper.file_name}")
                else:
                    papers_new += 1
                    _store_paper_meta(paper, local_path, file_hash,
                                      college_id, subject_id, source_id)
                    downloaded_paths.append((paper, local_path))

            except Exception as e:
                job = get_job(job_id)
                if job:
                    job.failed_files += 1
                    job.error_log.append({"file": paper.file_name, "error": str(e)})
                log.warning(f"[ScrapeJob] Failed {paper.file_name}: {e}")

            pct = 20 + int((i / len(papers)) * 60)
            update_job(job_id, processed_files=i, progress_pct=pct)

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
        db = get_db()
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
) -> None:
    try:
        file_size = os.path.getsize(local_path)
        ext = local_path.rsplit(".", 1)[-1].lower()
        db = get_db()
        db.table("papers").insert({
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
            "extraction_status": "pending",
        }).execute()
        log.info(f"[ScrapeJob] Stored paper: {paper.file_name}")
    except Exception as e:
        log.error(f"[ScrapeJob] DB store failed: {e}")

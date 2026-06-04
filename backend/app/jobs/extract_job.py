"""
Extraction Job — Milestone 2.
Picks up papers with extraction_status='pending', extracts text, updates DB.
Syllabus-First pipeline: Archive -> Files -> raw_text -> DB (M3 parses questions).
"""
import os
import tempfile
from datetime import datetime

from app.database import get_db
from app.extractors.extractor_factory import extract_archive_and_process, extract, is_archive
from app.logger import get_logger

log = get_logger(__name__)


async def run_extract_job(paper_id: str | None = None) -> dict:
    db = get_db()
    q = db.table("papers").select("id, file_name, file_type, original_url, storage_path, file_hash")
    if paper_id:
        q = q.eq("id", paper_id)
    else:
        q = q.eq("extraction_status", "pending")
    papers = q.execute().data
    log.info(f"[ExtractJob] {len(papers)} papers to extract")

    success, failed = 0, 0
    for paper in papers:
        pid = paper["id"]
        try:
            raw_text = _extract_paper(paper)
            db.table("papers").update({
                "raw_text": raw_text,
                "extraction_status": "success",
                "extraction_error": None,
                "extracted_at": datetime.utcnow().isoformat(),
            }).eq("id", pid).execute()
            success += 1
            log.info(f"[ExtractJob] OK: {paper['file_name']} ({len(raw_text)} chars)")
        except Exception as e:
            db.table("papers").update({
                "extraction_status": "failed",
                "extraction_error": str(e)[:500],
            }).eq("id", pid).execute()
            failed += 1
            log.error(f"[ExtractJob] FAIL: {paper['file_name']} — {e}")

    return {"processed": len(papers), "success": success, "failed": failed}


def _extract_paper(paper: dict) -> str:
    from app.config import settings
    file_name = paper.get("file_name", "")
    local_path = os.path.join(settings.scraper_download_dir, file_name)
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Local file not found: {local_path}. Run scrape job first.")
    if is_archive(local_path):
        with tempfile.TemporaryDirectory() as tmpdir:
            docs = extract_archive_and_process(local_path, tmpdir)
            if not docs:
                raise ValueError(f"No extractable documents in archive: {file_name}")
            return "\n\n".join(f"=== {d.file_name} ===\n{d.raw_text}" for d in docs)
    return extract(local_path).raw_text

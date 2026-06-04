"""
Extraction Job — Milestone 2.

Picks up all papers with extraction_status='pending',
runs the extraction pipeline, updates DB.

The Syllabus-First pipeline:
  Archive → Files → Extract Text → Store raw_text → (M3: parse questions)
"""
import os
import tempfile
from datetime import datetime

from app.database import get_db
from app.extractors.extractor_factory import extract_archive_and_process, extract, is_archive
from app.utils.hash_utils import sha256_file
from app.logger import get_logger

log = get_logger(__name__)


async def run_extract_job(paper_id: str | None = None) -> dict:
    """
    Extract text for pending papers.
    If paper_id is given, process only that paper.
    Otherwise process all pending papers (batch mode).
    Returns summary dict.
    """
    db = get_db()

    # Fetch papers to process
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
    """
    Given a paper record, find the local file and extract text.
    Handles both direct files and archives.
    """
    # Determine local path — use storage_path if set, else download dir
    from app.config import settings

    file_name = paper.get("file_name", "")
    local_path = os.path.join(settings.scraper_download_dir, file_name)

    # If local file doesn't exist, can't extract — M2 works on already-downloaded files
    if not os.path.exists(local_path):
        raise FileNotFoundError(
            f"Local file not found: {local_path}. Run scrape job first."
        )

    # If it's an archive (RAR/ZIP), extract and concatenate all document texts
    if is_archive(local_path):
        with tempfile.TemporaryDirectory() as tmpdir:
            docs = extract_archive_and_process(local_path, tmpdir)
            if not docs:
                raise ValueError(f"No extractable documents found in archive: {file_name}")
            # Concatenate all extracted texts with separator
            parts = []
            for doc in docs:
                parts.append(f"=== {doc.file_name} ===\n{doc.raw_text}")
            return "\n\n".join(parts)

    # Direct file extraction
    doc = extract(local_path)
    return doc.raw_text

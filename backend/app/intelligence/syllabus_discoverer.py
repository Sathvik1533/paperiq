"""
Syllabus Discoverer — Fix A.

Automatically discovers and downloads the official syllabus for a
subject+regulation without requiring manual upload.

Discovery strategy (in priority order):
  1. Check DB — syllabus already uploaded/discovered for this subject+regulation
  2. Check paper_sources.scraper_config for a syllabus_url pattern
  3. Try college-specific discovery (MLRIT R-scheme syllabus URLs)
  4. Return None — caller falls back to manual upload prompt

If a syllabus is found and downloaded, it is auto-ingested via
syllabus_ingester.ingest_syllabus() so the pipeline continues without
user intervention.
"""
import os
import re
import httpx
import tempfile
from typing import Optional
from app.database import get_db
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)

# Known syllabus URL patterns per college+regulation
# Format: {(college_short_name, regulation): url_template}
# Supports {subject_code} placeholder
_SYLLABUS_URL_PATTERNS: dict[tuple[str, str], str] = {
    # MLRIT R22 syllabus PDFs (JNTUH autonomous scheme)
    ("MLRIT", "R22"): (
        "https://mlrinstitutions.ac.in/wp-content/uploads/2022/08/"
        "R22-II-B.Tech-I-Sem-Syllabus.pdf"
    ),
    ("MLRIT", "R18"): (
        "https://mlrinstitutions.ac.in/wp-content/uploads/2019/01/"
        "R18-Syllabus-II-B.Tech.pdf"
    ),
}

# File name to save the discovered syllabus under
_SYLLABUS_DIR = os.path.join(settings.scraper_download_dir, "syllabi")


async def discover_and_ingest_syllabus(
    subject_id: str,
    regulation: str,
    college_short_name: str,
    branch_id: Optional[str] = None,
    semester: Optional[int] = None,
) -> Optional[str]:
    """
    Main entry point. Returns syllabus_id if discovery+ingestion succeeded,
    None if no syllabus could be found automatically.

    Callers should fall back to prompting the user for manual upload on None.
    """
    db = get_db()

    # 1. Already have a syllabus for this subject+regulation?
    existing = (
        db.table("syllabi")
        .select("id")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
        .limit(1)
        .execute()
    )
    if existing.data:
        syllabus_id = existing.data[0]["id"]
        log.info(
            f"[SyllabusDiscoverer] Found existing syllabus {syllabus_id} "
            f"for subject={subject_id} reg={regulation}"
        )
        return syllabus_id

    # 2. Try college-specific URL pattern
    url = _SYLLABUS_URL_PATTERNS.get((college_short_name, regulation))

    # 3. Try scraper_config.syllabus_url from paper_sources
    if not url:
        try:
            src = (
                db.table("paper_sources")
                .select("scraper_config")
                .eq("college_id",
                    db.table("colleges")
                    .select("id")
                    .eq("short_name", college_short_name)
                    .single()
                    .execute()
                    .data["id"]
                )
                .limit(1)
                .execute()
            )
            if src.data:
                cfg = src.data[0].get("scraper_config") or {}
                url = cfg.get("syllabus_url") or cfg.get(f"syllabus_url_{regulation.lower()}")
        except Exception as e:
            log.debug(f"[SyllabusDiscoverer] Could not read scraper_config: {e}")

    if not url:
        log.info(
            f"[SyllabusDiscoverer] No auto-discovery URL for "
            f"college={college_short_name} regulation={regulation} — manual upload required"
        )
        return None

    # 4. Download the syllabus
    log.info(f"[SyllabusDiscoverer] Downloading syllabus from: {url}")
    os.makedirs(_SYLLABUS_DIR, exist_ok=True)

    filename = f"syllabus_{college_short_name}_{regulation}.pdf"
    dest_path = os.path.join(_SYLLABUS_DIR, filename)

    try:
        async with httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
            headers={"User-Agent": "PaperIQ/1.0 (syllabus fetcher)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            # Determine file extension from content-type
            if "pdf" in content_type:
                ext = ".pdf"
            elif "docx" in content_type or "openxml" in content_type:
                ext = ".docx"
            else:
                ext = os.path.splitext(url)[1] or ".pdf"

            dest_path = dest_path.replace(".pdf", ext)
            with open(dest_path, "wb") as f:
                f.write(resp.content)

        log.info(f"[SyllabusDiscoverer] Downloaded {len(resp.content)} bytes to {dest_path}")

    except Exception as e:
        log.warning(f"[SyllabusDiscoverer] Download failed: {e}")
        return None

    # 5. Ingest via existing syllabus_ingester
    try:
        from app.extractors.syllabus_ingester import ingest_syllabus

        # Resolve college_id
        college_row = (
            db.table("colleges")
            .select("id")
            .eq("short_name", college_short_name)
            .single()
            .execute()
        )
        college_id = college_row.data["id"] if college_row.data else None

        syllabus_id = ingest_syllabus(
            file_path=dest_path,
            subject_id=subject_id,
            regulation=regulation,
            college_id=college_id,
            branch_id=branch_id,
            semester=semester,
        )
        log.info(
            f"[SyllabusDiscoverer] Ingested syllabus {syllabus_id} "
            f"for subject={subject_id} reg={regulation}"
        )
        return syllabus_id

    except Exception as e:
        log.warning(f"[SyllabusDiscoverer] Ingestion failed: {e}")
        return None


async def get_or_discover_syllabus(
    subject_id: str,
    regulation: str,
    college_short_name: str,
    branch_id: Optional[str] = None,
    semester: Optional[int] = None,
) -> tuple[Optional[str], bool]:
    """
    Returns (syllabus_id, was_auto_discovered).
    Convenience wrapper used by the pipeline trigger.
    """
    syllabus_id = await discover_and_ingest_syllabus(
        subject_id=subject_id,
        regulation=regulation,
        college_short_name=college_short_name,
        branch_id=branch_id,
        semester=semester,
    )
    if syllabus_id:
        db = get_db()
        existing = (
            db.table("syllabi")
            .select("id")
            .eq("subject_id", subject_id)
            .eq("regulation", regulation)
            .limit(1)
            .execute()
        )
        # Was it pre-existing or just discovered?
        was_discovered = len(existing.data or []) <= 1
        return syllabus_id, was_discovered
    return None, False

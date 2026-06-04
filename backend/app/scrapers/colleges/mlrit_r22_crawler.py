"""
MLRIT R22 2-2 Targeted Crawler.

Unlike the generic scraper, this crawler:
1. Knows exactly which archives to download (no portal scraping needed)
2. Knows where 2-2 papers live inside each archive
3. Maps each docx to its R22 subject code automatically
4. Stores papers with full metadata: subject_code, subject_name, semester=2, regulation=R22

Entry point: crawl_r22_22(subject_code, year_from, year_to)
"""
import os
import re
import asyncio
import tempfile
from typing import Optional

import httpx

from app.scrapers.colleges.mlrit_r22 import (
    R22_ARCHIVES, BASE_URL, identify_subject_from_filename, R22_SUBJECTS,
)
from app.extractors.archive_extractor import ArchiveExtractor
from app.extractors.extractor_factory import extract, is_academic_file
from app.parsers.question_parser import QuestionParser
from app.parsers.question_store import store_parse_result
from app.utils.hash_utils import sha256_file
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)
_parser = QuestionParser()
_archive_ext = ArchiveExtractor()


async def crawl_r22_22(
    subject_code: str,
    college_id: str,
    year_from: int = 2021,
    year_to: int = 2025,
    force_refresh: bool = False,
) -> dict:
    """
    Full automatic pipeline for one R22 2-2 subject:
      1. Select relevant archives from catalogue
      2. Download each archive
      3. Extract the archive
      4. Find files matching subject_code
      5. Extract text from each file
      6. Parse questions
      7. Store in DB with full metadata
      8. Return summary

    Returns: {subject_code, papers_found, papers_new, papers_cached, questions_stored}
    """
    subject_code = subject_code.upper()
    subject_info = R22_SUBJECTS.get(subject_code)
    if not subject_info:
        raise ValueError(f"Unknown R22 subject code: {subject_code}")

    log.info(f"[R22Crawler] Crawling {subject_code} ({subject_info['name']}) years {year_from}-{year_to}")

    db = get_db()
    dest_dir = os.path.join("/tmp/paperiq_r22", subject_code)
    os.makedirs(dest_dir, exist_ok=True)

    papers_found = 0
    papers_new   = 0
    papers_cached = 0
    questions_stored = 0

    # Select archives in year range
    archives = [a for a in R22_ARCHIVES if year_from <= a["year"] <= year_to]
    log.info(f"[R22Crawler] {len(archives)} archives in range {year_from}-{year_to}")

    async with httpx.AsyncClient(
        timeout=60, follow_redirects=True,
        headers={"User-Agent": "PaperIQ/1.0"},
    ) as client:

        for archive_meta in archives:
            archive_url  = f"{BASE_URL}/{archive_meta['file']}"
            archive_path = os.path.join(dest_dir, archive_meta["file"])

            # Download archive if not cached
            if not os.path.exists(archive_path) or force_refresh:
                log.info(f"[R22Crawler] Downloading {archive_meta['file']}")
                try:
                    resp = await client.get(archive_url)
                    resp.raise_for_status()
                    with open(archive_path, "wb") as f:
                        f.write(resp.content)
                except Exception as e:
                    log.warning(f"[R22Crawler] Download failed {archive_meta['file']}: {e}")
                    continue

            # Extract archive
            extract_dir = os.path.join(dest_dir, f"extracted_{archive_meta['year']}_{archive_meta['month']}")
            try:
                if not os.path.exists(extract_dir):
                    files = _archive_ext.extract_to_dir(archive_path, extract_dir)
                else:
                    files = _archive_ext._list_files(extract_dir)
            except Exception as e:
                log.warning(f"[R22Crawler] Extraction failed {archive_meta['file']}: {e}")
                continue

            # Find files matching subject_code
            matching_files = []
            for fpath in files:
                if not is_academic_file(fpath):
                    continue
                fname = os.path.basename(fpath)
                if fname.startswith("~$"):
                    continue
                detected = identify_subject_from_filename(fname)
                if detected == subject_code:
                    matching_files.append(fpath)
                    continue
                # Also match by approximate name patterns for files without code
                subject_short = subject_info.get("short", "").lower()
                if subject_short and _fuzzy_match_filename(fname, subject_code, subject_info):
                    matching_files.append(fpath)

            log.info(f"[R22Crawler] {archive_meta['file']}: {len(matching_files)} matching files for {subject_code}")

            for fpath in matching_files:
                papers_found += 1
                file_hash = sha256_file(fpath)

                # Check dedup
                existing = db.table("papers").select("id").eq("file_hash", file_hash).execute()
                if existing.data and not force_refresh:
                    papers_cached += 1
                    log.info(f"[R22Crawler] Cached: {os.path.basename(fpath)}")
                    continue

                # Extract text
                try:
                    doc = extract(fpath)
                    raw_text = doc.raw_text
                except Exception as e:
                    log.warning(f"[R22Crawler] Extraction failed {fpath}: {e}")
                    continue

                # Resolve subject_id from DB
                subject_id = _get_or_create_subject(db, subject_code, subject_info, college_id)

                # Store paper
                try:
                    file_size = os.path.getsize(fpath)
                    result = db.table("papers").insert({
                        "college_id"       : college_id,
                        "subject_id"       : subject_id,
                        "title"            : f"{subject_info['name']} — {archive_meta['month']} {archive_meta['year']}",
                        "exam_type"        : archive_meta["type"],
                        "exam_month"       : archive_meta["month"],
                        "exam_year"        : archive_meta["year"],
                        "btech_year"       : 2,
                        "semester"         : 2,
                        "regulation"       : "R22",
                        "original_url"     : archive_url,
                        "file_name"        : os.path.basename(fpath),
                        "file_type"        : os.path.splitext(fpath)[1].lower().lstrip("."),
                        "file_size_bytes"  : file_size,
                        "file_hash"        : file_hash,
                        "raw_text"         : raw_text,
                        "extraction_status": "success",
                    }).execute()
                    paper_id = result.data[0]["id"] if result.data else None
                    papers_new += 1
                    log.info(f"[R22Crawler] Stored paper: {os.path.basename(fpath)}")
                except Exception as e:
                    log.error(f"[R22Crawler] DB store failed: {e}")
                    continue

                # Parse questions immediately
                if paper_id and raw_text:
                    try:
                        parse_result = _parser.parse(
                            raw_text=raw_text,
                            paper_id=paper_id,
                            subject_id=subject_id,
                        )
                        store_result = store_parse_result(parse_result)
                        questions_stored += store_result["inserted"]
                        log.info(
                            f"[R22Crawler] Parsed {parse_result.total_questions} questions "
                            f"({store_result['inserted']} new)"
                        )
                    except Exception as e:
                        log.warning(f"[R22Crawler] Parse failed: {e}")

    log.info(
        f"[R22Crawler] Done: {subject_code} "
        f"found={papers_found} new={papers_new} cached={papers_cached} "
        f"questions={questions_stored}"
    )
    return {
        "subject_code"    : subject_code,
        "subject_name"    : subject_info["name"],
        "papers_found"    : papers_found,
        "papers_new"      : papers_new,
        "papers_cached"   : papers_cached,
        "questions_stored": questions_stored,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fuzzy_match_filename(fname: str, code: str, info: dict) -> bool:
    """Approximate match for files without explicit code in name."""
    fname_lower = fname.lower()
    short = info.get("short", "").lower()
    name_words = [w.lower() for w in info["name"].split() if len(w) > 3]
    # Must match at least the short name OR 2+ words from full name
    if short and len(short) > 2 and short in fname_lower:
        return True
    matches = sum(1 for w in name_words if w in fname_lower)
    return matches >= 2


def _get_or_create_subject(db, code: str, info: dict, college_id: str) -> Optional[str]:
    """Return existing subject_id or create it."""
    try:
        existing = (
            db.table("subjects")
            .select("id")
            .eq("code", code)
            .eq("college_id", college_id)
            .single()
            .execute()
        )
        if existing.data:
            return existing.data["id"]
        result = db.table("subjects").insert({
            "college_id" : college_id,
            "name"       : info["name"],
            "code"       : code,
            "semester"   : 2,
            "year"       : 2,
            "regulation" : "R22",
        }).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        log.error(f"[R22Crawler] Subject lookup failed: {e}")
        return None

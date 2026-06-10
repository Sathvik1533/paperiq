"""
MLRIT R22 Targeted Crawler (2-1 and 2-2 Semesters).

Unlike the generic scraper, this crawler:
1. Knows exactly which archives to download (no portal scraping needed)
2. Knows where 2-1 and 2-2 papers live inside each archive
3. Maps each docx to its R22 subject code automatically
4. Stores papers with full metadata: subject_code, subject_name, semester=(1 or 2), regulation=R22

Entry points:
  - crawl_r22_subject(subject_code, semester, year_from, year_to) → Crawl single subject
  - crawl_r22_semester(semester, year_from, year_to) → Crawl entire semester
  - crawl_r22_22(subject_code, ...) → Legacy alias for semester 2
"""
import os
import re
import asyncio
import tempfile
import subprocess
from datetime import datetime
from typing import Optional

import httpx

from app.scrapers.colleges.mlrit_r22 import (
    R22_ARCHIVES, BASE_URL, identify_subject_from_filename, R22_SUBJECTS, get_all_archives,
)
from app.extractors.archive_extractor import ArchiveExtractor
from app.extractors.extractor_factory import extract, is_academic_file
from app.parsers.marks_extractor import extract_dynamic_marks
from app.parsers.question_parser import QuestionParser
from app.parsers.question_store import store_parse_result
from app.utils.hash_utils import sha256_file
from app.database import get_admin_db
from app.logger import get_logger

log = get_logger(__name__)
_parser = QuestionParser()
_archive_ext = ArchiveExtractor()


async def crawl_r22_subject(
    subject_code: str,
    college_id: str,
    semester: Optional[int] = None,
    year_from: int = 2021,
    year_to: int = 2025,
    force_refresh: bool = False,
) -> dict:
    """
    Full automatic pipeline for one R22 subject (2-1 or 2-2):
      1. Select relevant archives from catalogue
      2. Download each archive
      3. Extract the archive
      4. Find files matching subject_code
      5. Extract text from each file
      6. Parse questions
      7. Store in DB with full metadata
      8. Return summary

    Args:
        subject_code: R22 subject code (e.g., A6CS05, A6CS09)
        college_id: College UUID
        semester: Optional override (1 or 2). If None, uses subject's registered semester.
        year_from: Start year (inclusive)
        year_to: End year (inclusive)
        force_refresh: Re-process cached papers

    Returns: {subject_code, semester, papers_found, papers_new, papers_cached, questions_stored}
    """
    subject_code = subject_code.upper()
    subject_info = R22_SUBJECTS.get(subject_code)
    if not subject_info:
        raise ValueError(f"Unknown R22 subject code: {subject_code}")

    # Use explicit semester or fall back to registry
    target_semester = semester if semester is not None else subject_info["semester"]
    
    log.info(
        f"[R22Crawler] Crawling {subject_code} ({subject_info['name']}) "
        f"Semester={target_semester} Years={year_from}-{year_to}"
    )

    db = get_admin_db()
    dest_dir = os.path.join("/tmp/paperiq_r22", subject_code)
    os.makedirs(dest_dir, exist_ok=True)

    papers_found = 0
    papers_new   = 0
    papers_cached = 0
    questions_stored = 0

    # Select archives in year range using dynamic discovery
    archives = [a for a in get_all_archives() if year_from <= a["year"] <= year_to]
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

                # Resolve subject_id from DB (use target_semester, not registry semester)
                subject_id = _get_or_create_subject(db, subject_code, subject_info, college_id, target_semester)

                # NEW: Dynamic Regulation Mapping (70-marks evaluation criteria)
                dyn_marks = extract_dynamic_marks(raw_text)
                if dyn_marks is not None:
                    max_evaluation_marks = dyn_marks
                else:
                    max_evaluation_marks = 70.0 if archive_meta["year"] in (2023, 2024, 2025) else 75.0

                # Store paper
                # Upload to Supabase Storage
                try:
                    file_size = os.path.getsize(fpath)
                    file_ext = os.path.splitext(fpath)[1].lower()
                    storage_bucket = "papers"
                    original_storage_path = f"mlrit/{archive_meta['year']}/{subject_code}_{file_hash}{file_ext}"
                    
                    content_type = "application/pdf"
                    if file_ext in [".doc", ".docx"]:
                        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        
                    # Upload Original Source File
                    with open(fpath, "rb") as f:
                        db.storage.from_(storage_bucket).upload(
                            path=original_storage_path,
                            file=f,
                            file_options={"content-type": content_type, "upsert": "true"}
                        )
                    
                    viewable_storage_path = original_storage_path
                    if file_ext in [".doc", ".docx"]:
                        # Convert to PDF
                        log.info(f"[R22Crawler] Converting {fpath} to PDF...")
                        pdf_path = fpath.replace(file_ext, ".pdf")
                        try:
                            # Use LibreOffice headless to convert
                            subprocess.run([
                                "soffice", "--headless", "--convert-to", "pdf",
                                fpath, "--outdir", os.path.dirname(fpath)
                            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            if os.path.exists(pdf_path):
                                viewable_storage_path = f"mlrit/{archive_meta['year']}/{subject_code}_{file_hash}.pdf"
                                with open(pdf_path, "rb") as pdf_f:
                                    db.storage.from_(storage_bucket).upload(
                                        path=viewable_storage_path,
                                        file=pdf_f,
                                        file_options={"content-type": "application/pdf", "upsert": "true"}
                                    )
                                log.info(f"[R22Crawler] Successfully converted & uploaded viewable PDF.")
                            else:
                                log.warning(f"[R22Crawler] PDF conversion produced no file for {fpath}")
                        except Exception as conv_err:
                            log.warning(f"[R22Crawler] PDF conversion failed: {conv_err}")

                    result = db.table("papers").insert({
                        "college_id"       : college_id,
                        "subject_id"       : subject_id,
                        "title"            : f"{subject_info['name']} — {archive_meta['month']} {archive_meta['year']}",
                        "exam_type"        : archive_meta["type"],
                        "exam_month"       : archive_meta["month"],
                        "exam_year"        : archive_meta["year"],
                        "btech_year"       : 2,
                        "semester"         : target_semester,
                        "regulation"       : "R22",
                        "max_evaluation_marks" : max_evaluation_marks,
                        "original_url"     : archive_url,
                        "source_url"       : archive_url,
                        "source_filename"  : os.path.basename(fpath),
                        "download_timestamp": datetime.utcnow().isoformat(),
                        "file_name"        : os.path.basename(fpath),
                        "file_type"        : file_ext.lstrip("."),
                        "file_size_bytes"  : file_size,
                        "file_hash"        : file_hash,
                        "raw_text"         : raw_text,
                        "extraction_status": "success",
                        "storage_path"     : viewable_storage_path, # Legacy fallback
                        "original_storage_path": original_storage_path,
                        "viewable_storage_path": viewable_storage_path,
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
        f"[R22Crawler] Done: {subject_code} Semester={target_semester} "
        f"found={papers_found} new={papers_new} cached={papers_cached} "
        f"questions={questions_stored}"
    )
    return {
        "subject_code"    : subject_code,
        "subject_name"    : subject_info["name"],
        "semester"        : target_semester,
        "papers_found"    : papers_found,
        "papers_new"      : papers_new,
        "papers_cached"   : papers_cached,
        "questions_stored": questions_stored,
    }


async def crawl_r22_22(
    subject_code: str,
    college_id: str,
    year_from: int = 2021,
    year_to: int = 2025,
    force_refresh: bool = False,
) -> dict:
    """
    Legacy alias for crawl_r22_subject with semester=2.
    Maintained for backward compatibility.
    """
    return await crawl_r22_subject(
        subject_code=subject_code,
        college_id=college_id,
        semester=2,
        year_from=year_from,
        year_to=year_to,
        force_refresh=force_refresh,
    )


async def crawl_r22_semester(
    semester: int,
    college_id: str,
    year_from: int = 2021,
    year_to: int = 2025,
    force_refresh: bool = False,
) -> dict:
    """
    Crawl all subjects for a given semester (1 for 2-1, 2 for 2-2).
    
    Returns: {
        semester, total_subjects, successful, failed,
        subjects: [list of individual results]
    }
    """
    if semester not in (1, 2):
        raise ValueError(f"Invalid semester: {semester}. Must be 1 or 2.")
    
    from app.scrapers.colleges.mlrit_r22 import get_all_subjects_for_semester
    
    subjects = get_all_subjects_for_semester(semester)
    log.info(f"[R22Crawler] Starting semester {semester} crawl: {len(subjects)} subjects")
    
    results = []
    successful = 0
    failed = 0
    
    for subject in subjects:
        code = subject["code"]
        try:
            result = await crawl_r22_subject(
                subject_code=code,
                college_id=college_id,
                semester=semester,
                year_from=year_from,
                year_to=year_to,
                force_refresh=force_refresh,
            )
            results.append(result)
            successful += 1
            log.info(f"[R22Crawler] ✓ {code}: {result['papers_new']} new papers")
        except Exception as e:
            log.error(f"[R22Crawler] ✗ {code}: {e}")
            results.append({
                "subject_code": code,
                "subject_name": subject["name"],
                "semester": semester,
                "error": str(e),
            })
            failed += 1
    
    log.info(
        f"[R22Crawler] Semester {semester} complete: "
        f"{successful} successful, {failed} failed"
    )
    
    return {
        "semester": semester,
        "total_subjects": len(subjects),
        "successful": successful,
        "failed": failed,
        "subjects": results,
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


def _get_or_create_subject(db, code: str, info: dict, college_id: str, semester: int) -> Optional[str]:
    """Return existing subject_id or create it with correct semester."""
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
        # Use the provided semester (overrides registry if needed)
        result = db.table("subjects").insert({
            "college_id" : college_id,
            "name"       : info["name"],
            "code"       : code,
            "semester"   : semester,
            "year"       : 2,
            "regulation" : "R22",
        }).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        log.error(f"[R22Crawler] Subject lookup failed: {e}")
        return None

#!/usr/bin/env python3
"""
Ingest Missing Operating Systems Paper (A6CS11)
==============================================
Source: /Users/k.sathvik/Downloads/2-BTech(June25)/Reg/OS QP_Set-2.docx
Course Code: A6CS11 (Operating System)
Semester: II B.Tech II Semester Regular Examinations June/July-2025
Max Marks: 60M (Part A: 10x1M = 10M, Part B: 50M)

Enforces idempotency using SHA-256 question hashes across both database
and local cache storage.
"""
import os
import sys
import hashlib
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.database import get_admin_db
from app.extractors.docx_extractor import DocxExtractor
from app.parsers.question_parser import QuestionParser
from app.parsers.question_store import store_parse_result
from app.parsers.local_paper_cache import ingest_paper_to_cache, get_cached_questions
from app.utils.exam_pattern_validator import validate_paper_60m_structure, PaperEligibilityStatus
from app.logger import get_logger

log = get_logger(__name__)

OS_DOCX_PATH = Path("/Users/k.sathvik/Downloads/2-BTech(June25)/Reg/OS QP_Set-2.docx")
SUBJECT_CODE = "A6CS11"


def ingest_os_paper(docx_path: Path = OS_DOCX_PATH) -> str:
    if not docx_path.exists():
        raise FileNotFoundError(f"OS paper not found at {docx_path}")

    db = get_admin_db()

    print(f"Reading {docx_path}...")
    file_bytes = docx_path.read_bytes()
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size = len(file_bytes)

    # 1. Resolve subject
    sub_res = db.table("subjects").select("*").eq("code", SUBJECT_CODE).execute()
    if not sub_res.data:
        raise RuntimeError(f"Subject {SUBJECT_CODE} not found in database!")
    subject = sub_res.data[0]
    subject_id = subject["id"]
    college_id = subject.get("college_id") or "a0000000-0000-0000-0000-000000000001"
    print(f"Resolved subject: {subject['name']} ({SUBJECT_CODE}), id={subject_id}")

    # Deterministic UUID for OS paper
    paper_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"mlrit:A6CS11:June2025:Set2:{file_hash}"))

    # 2. Extract text using DocxExtractor (with adjacent deduplication)
    extractor = DocxExtractor()
    extracted_doc = extractor.extract(str(docx_path))
    raw_text = extracted_doc.raw_text
    print(f"Extracted raw_text: {len(raw_text)} chars")

    storage_bucket = "papers"
    storage_path = f"mlrit/2025/A6CS11_{file_hash}.docx"

    paper_record = {
        "id": paper_id,
        "title": "Operating System — June 2025",
        "college_id": college_id,
        "subject_id": subject_id,
        "exam_type": "Regular",
        "exam_month": "June",
        "exam_year": 2025,
        "semester": 2,
        "btech_year": 2,
        "regulation": "R22",
        "max_marks": 60,
        "duration_hours": 3,
        "set_number": 2,
        "file_name": docx_path.name,
        "file_type": "docx",
        "file_size_bytes": file_size,
        "file_hash": file_hash,
        "storage_path": storage_path,
        "storage_bucket": storage_bucket,
        "raw_text": raw_text,
        "extraction_status": "success",
        "exam_category": "Semester",
        "max_evaluation_marks": 60.0,
        "source_filename": docx_path.name,
    }

    # 3. Attempt database insertion (handles RLS policies)
    db_write_successful = False
    try:
        existing = db.table("papers").select("id").eq("id", paper_id).execute().data
        if not existing:
            db.table("papers").insert(paper_record).execute()
        db_write_successful = True
        print(f"Database paper record synced for id={paper_id}")
    except Exception as e:
        print(f"Database write note (RLS/mock key active, falling back to local cache): {e}")

    # 4. Parse questions
    parser = QuestionParser()
    parse_result = parser.parse(raw_text, paper_id, subject_id)
    print(f"Parsed {len(parse_result.questions)} questions (Part A: {parse_result.part_a_count}, Part B: {parse_result.part_b_count})")

    # 5. Ingest into persistent local cache with SHA-256 idempotency
    stats_1 = ingest_paper_to_cache(paper_record, parse_result.questions)
    print(f"Cache Ingestion Run 1: inserted={stats_1['inserted']}, skipped_duplicate={stats_1['skipped_duplicate']}, failed={stats_1['failed']}")

    # 6. Strict Idempotency Verification: Re-ingest the exact same paper
    stats_2 = ingest_paper_to_cache(paper_record, parse_result.questions)
    print(f"Cache Ingestion Run 2 (Idempotency Re-check): inserted={stats_2['inserted']}, skipped_duplicate={stats_2['skipped_duplicate']}, failed={stats_2['failed']}")
    assert stats_2["inserted"] == 0, f"Expected 0 inserted on re-ingestion, got {stats_2['inserted']}"
    assert stats_2["skipped_duplicate"] == len(parse_result.questions), (
        f"Expected all {len(parse_result.questions)} skipped as duplicate on re-ingestion"
    )
    print("✅ Idempotency strictly verified: 0 duplicate records created upon re-ingestion.")

    # If DB write was enabled, also attempt DB question insertion
    if db_write_successful:
        try:
            store_stats = store_parse_result(parse_result)
            print(f"DB question sync: {store_stats}")
        except Exception as e:
            print(f"DB question sync note: {e}")

    # 7. Validate 60M structure
    cached_qs = get_cached_questions(paper_id)
    val = validate_paper_60m_structure(paper_record, cached_qs)
    print(f"60M Validation: status={val['status']}, is_eligible={val['is_eligible']}, evaluated_marks={val.get('marks_validation', {}).get('total_marks')}")
    assert val["is_eligible"] is True
    assert val["status"] == PaperEligibilityStatus.ELIGIBLE_60M
    assert val["marks_validation"]["total_marks"] == 60
    assert val["part_a"]["one_mark_count"] == 10
    assert val["part_b"]["direct_10m_count"] == 3
    assert val["part_b"]["sub_5m_count"] == 14
    print("✅ Operating System paper is verified 100% ELIGIBLE_60M with 10×1M Part A and 50M Part B!")

    return paper_id


if __name__ == "__main__":
    ingest_os_paper()

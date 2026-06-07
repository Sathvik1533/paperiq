"""
Fix stale paper metadata by wiping blank records and re-running the full R22 crawler.

The existing papers were ingested without exam_year, exam_month, or original_url,
so the download system has no way to find the real MLRIT archive.

This script:
1. Deletes all papers where exam_year IS NULL (the broken ones)
2. Re-runs the full crawler for every R22 subject
3. Each new record will have: exam_year, exam_month, original_url (real MLRIT RAR URL)
4. Users will then get the real MLRIT DOCX from exams.mlrinstitutions.ac.in
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import get_db
from app.logger import get_logger
from app.scrapers.colleges.mlrit_r22 import R22_SUBJECTS
from app.scrapers.colleges.mlrit_r22_crawler import crawl_r22_22

log = get_logger("fix_metadata")

COLLEGE_ID = "a0000000-0000-0000-0000-000000000001"


async def main():
    db = get_db()

    # Step 1: Count broken papers
    broken = db.table("papers").select("id").is_("exam_year", "null").execute()
    log.info(f"Found {len(broken.data)} papers with null exam_year (stale ingestion).")

    if broken.data:
        ids_to_delete = [r["id"] for r in broken.data]

        # Also delete their parsed questions first (FK constraint)
        log.info("Deleting stale questions...")
        for paper_id in ids_to_delete:
            db.table("questions").delete().eq("paper_id", paper_id).execute()

        # Now delete the papers
        log.info("Deleting stale paper records...")
        db.table("papers").delete().is_("exam_year", "null").execute()
        log.info("Stale records deleted.")
    else:
        log.info("No stale records found. Running crawler to add any missing papers.")

    # Step 2: Re-run the full crawler for all R22 subjects
    # This correctly populates: exam_year, exam_month, original_url, file_name, etc.
    log.info("=" * 60)
    log.info("Starting full R22 crawler run for all subjects...")
    log.info("=" * 60)

    total_new = 0
    total_questions = 0

    for subject_code in R22_SUBJECTS.keys():
        log.info(f"\nCrawling subject: {subject_code}")
        try:
            result = await crawl_r22_22(
                subject_code=subject_code,
                college_id=COLLEGE_ID,
                year_from=2021,
                year_to=2025,
                force_refresh=False,
            )
            total_new += result["papers_new"]
            total_questions += result["questions_stored"]
            log.info(
                f"  {subject_code}: found={result['papers_found']} "
                f"new={result['papers_new']} questions={result['questions_stored']}"
            )
        except Exception as e:
            log.error(f"  {subject_code}: FAILED — {e}")
            continue

    log.info("=" * 60)
    log.info(f"DONE. Total new papers: {total_new}, Total questions: {total_questions}")
    log.info("Papers now have real MLRIT archive URLs in original_url column.")
    log.info("Users will now receive authentic MLRIT DOCX files on download.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

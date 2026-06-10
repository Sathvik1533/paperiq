#!/usr/bin/env python3
"""
Crawl ALL R22 papers for both 2-1 and 2-2 semesters.

Usage:
    python scripts/crawl_r22_all.py                    # Crawl both semesters
    python scripts/crawl_r22_all.py --semester 1       # Crawl 2-1 only
    python scripts/crawl_r22_all.py --semester 2       # Crawl 2-2 only
    python scripts/crawl_r22_all.py --subject A6CS05   # Crawl single subject
    python scripts/crawl_r22_all.py --force-refresh    # Re-process cached papers
"""
import asyncio
import argparse
from datetime import datetime

from app.database import get_admin_db
from app.scrapers.colleges.mlrit_r22_crawler import (
    crawl_r22_subject,
    crawl_r22_semester,
)
from app.scrapers.colleges.mlrit_r22 import R22_SUBJECTS
from app.logger import get_logger

log = get_logger(__name__)

MLRIT_COLLEGE_ID = "01GQW7Z8A6YF9M3N5P2Q1R4S3T"  # Official MLRIT UUID


async def main():
    parser = argparse.ArgumentParser(description="Crawl R22 papers from MLRIT portal")
    parser.add_argument(
        "--semester",
        type=int,
        choices=[1, 2],
        help="Target semester (1 for 2-1, 2 for 2-2). If omitted, crawl both.",
    )
    parser.add_argument(
        "--subject",
        type=str,
        help="Single subject code (e.g., A6CS05). If provided, only crawl this subject.",
    )
    parser.add_argument(
        "--year-from",
        type=int,
        default=2021,
        help="Start year (default: 2021)",
    )
    parser.add_argument(
        "--year-to",
        type=int,
        default=2025,
        help="End year (default: 2025)",
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="Re-process cached papers",
    )
    args = parser.parse_args()

    db = get_admin_db()
    start_time = datetime.now()
    
    print("=" * 80)
    print("MLRIT R22 Crawler")
    print("=" * 80)
    print(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Year range: {args.year_from}-{args.year_to}")
    print(f"Force refresh: {args.force_refresh}")
    print("=" * 80)
    print()

    # Single subject mode
    if args.subject:
        code = args.subject.upper()
        if code not in R22_SUBJECTS:
            print(f"❌ Unknown subject code: {code}")
            print(f"\nKnown subjects:")
            for c, info in R22_SUBJECTS.items():
                print(f"  {c} - {info['name']} (Semester {info['semester']})")
            return 1
        
        subject_info = R22_SUBJECTS[code]
        sem = args.semester if args.semester else subject_info["semester"]
        
        print(f"📚 Crawling: {code} - {subject_info['name']}")
        print(f"   Semester: {sem} ({['2-1', '2-2'][sem-1]})")
        print()
        
        try:
            result = await crawl_r22_subject(
                subject_code=code,
                college_id=MLRIT_COLLEGE_ID,
                semester=sem,
                year_from=args.year_from,
                year_to=args.year_to,
                force_refresh=args.force_refresh,
            )
            print()
            print("✅ Success!")
            print(f"   Papers found: {result['papers_found']}")
            print(f"   New papers: {result['papers_new']}")
            print(f"   Cached: {result['papers_cached']}")
            print(f"   Questions stored: {result['questions_stored']}")
            return 0
        except Exception as e:
            print(f"❌ Failed: {e}")
            log.exception("Crawl failed")
            return 1

    # Full semester(s) mode
    semesters = [args.semester] if args.semester else [1, 2]
    total_results = {"successful": 0, "failed": 0, "papers_new": 0, "questions": 0}
    
    for sem in semesters:
        print()
        print("=" * 80)
        print(f"SEMESTER {sem} ({'2-1' if sem == 1 else '2-2'})")
        print("=" * 80)
        print()
        
        try:
            result = await crawl_r22_semester(
                semester=sem,
                college_id=MLRIT_COLLEGE_ID,
                year_from=args.year_from,
                year_to=args.year_to,
                force_refresh=args.force_refresh,
            )
            
            print()
            print(f"📊 Semester {sem} Summary:")
            print(f"   Total subjects: {result['total_subjects']}")
            print(f"   Successful: {result['successful']}")
            print(f"   Failed: {result['failed']}")
            print()
            
            # Show per-subject details
            for subj in result["subjects"]:
                if "error" in subj:
                    print(f"   ❌ {subj['subject_code']}: {subj['error']}")
                else:
                    print(
                        f"   ✓ {subj['subject_code']}: "
                        f"{subj['papers_new']} new, {subj['papers_cached']} cached, "
                        f"{subj['questions_stored']} questions"
                    )
                    total_results["papers_new"] += subj["papers_new"]
                    total_results["questions"] += subj["questions_stored"]
            
            total_results["successful"] += result["successful"]
            total_results["failed"] += result["failed"]
            
        except Exception as e:
            print(f"❌ Semester {sem} failed: {e}")
            log.exception(f"Semester {sem} crawl failed")
            total_results["failed"] += 1

    # Final summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print()
    print("=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    print(f"Duration: {duration:.1f} seconds")
    print(f"Successful subjects: {total_results['successful']}")
    print(f"Failed subjects: {total_results['failed']}")
    print(f"New papers ingested: {total_results['papers_new']}")
    print(f"Total questions parsed: {total_results['questions']}")
    print("=" * 80)
    
    return 0 if total_results["failed"] == 0 else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)

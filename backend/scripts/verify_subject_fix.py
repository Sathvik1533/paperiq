"""
Quick verification script to confirm subject-semester mapping is correct.
Run this to validate that the frontend will see all 10 subjects properly distributed.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

def main():
    log.info("=" * 80)
    log.info("SUBJECT-SEMESTER MAPPING VERIFICATION")
    log.info("=" * 80)
    
    db = get_db()
    
    # Test 1: Verify semester 2-1 subjects
    log.info("\n📚 Test 1: Semester 2-1 (II B.Tech I Semester)")
    sem_2_1 = db.table("subjects").select("code, name").eq("semester", 1).eq("regulation", "R22").order("code").execute()
    
    if len(sem_2_1.data or []) == 5:
        log.info(f"  ✅ Found exactly 5 subjects")
        for s in sem_2_1.data:
            log.info(f"     {s['code']}: {s['name']}")
    else:
        log.error(f"  ❌ Expected 5 subjects, found {len(sem_2_1.data or [])}")
    
    # Test 2: Verify semester 2-2 subjects
    log.info("\n📚 Test 2: Semester 2-2 (II B.Tech II Semester)")
    sem_2_2 = db.table("subjects").select("code, name").eq("semester", 2).eq("regulation", "R22").order("code").execute()
    
    if len(sem_2_2.data or []) == 5:
        log.info(f"  ✅ Found exactly 5 subjects")
        for s in sem_2_2.data:
            log.info(f"     {s['code']}: {s['name']}")
    else:
        log.error(f"  ❌ Expected 5 subjects, found {len(sem_2_2.data or [])}")
    
    # Test 3: Verify A6CS02 exists
    log.info("\n🔍 Test 3: Verify A6CS02 (correct code) exists")
    a6cs02 = db.table("subjects").select("code, name").eq("code", "A6CS02").eq("regulation", "R22").execute()
    if a6cs02.data:
        log.info(f"  ✅ A6CS02 found: {a6cs02.data[0]['name']}")
    else:
        log.error(f"  ❌ A6CS02 not found!")
    
    # Test 4: Verify A6CS28 does NOT exist
    log.info("\n🔍 Test 4: Verify A6CS28 (incorrect code) removed")
    a6cs28 = db.table("subjects").select("code").eq("code", "A6CS28").eq("regulation", "R22").execute()
    if not a6cs28.data:
        log.info(f"  ✅ A6CS28 does not exist (correct)")
    else:
        log.error(f"  ❌ A6CS28 still exists! Should be removed")
    
    # Test 5: Count total papers
    log.info("\n📄 Test 5: Papers linked to subjects")
    for code in ["A6CS02", "A6CS05", "A6IT02", "A6CS07", "A6BS03"]:
        subject = db.table("subjects").select("id, code").eq("code", code).eq("regulation", "R22").single().execute()
        if subject.data:
            papers = db.table("papers").select("id").eq("subject_id", subject.data['id']).execute()
            log.info(f"  {code}: {len(papers.data or [])} papers")
    
    log.info("\n" + "=" * 80)
    log.info("✅ VERIFICATION COMPLETE")
    log.info("=" * 80)
    log.info("\nFrontend Test URLs:")
    log.info("  Analysis Page: http://localhost:5173/analysis")
    log.info("  Papers Page:   http://localhost:5173/papers")
    log.info("  Dashboard:     http://localhost:5173/dashboard")
    log.info("\nExpected Behavior:")
    log.info("  - Analysis subject dropdown: Shows all 5 subjects for selected semester")
    log.info("  - Papers subject filter: Shows all 10 subjects (5 + 5)")
    log.info("  - Subject names: 'Digital Electronics...' appears with code A6CS02")

if __name__ == "__main__":
    main()

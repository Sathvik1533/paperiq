"""
Fix Subject-to-Semester Mapping - R22 CSE
==========================================

This script corrects the subject code A6CS28 → A6CS02 and ensures
all 10 core R22 CSE subjects are properly mapped to semesters 2-1 and 2-2.

Run this ONCE to fix the database and rebuild the subject registry.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# ── OFFICIAL MLRIT R22 CSE SUBJECT DISTRIBUTION ────────────────────────────────

R22_SEMESTER_2_1 = {
    "A6CS05": {"name": "Data Structures", "semester": 1},
    "A6IT02": {"name": "Object Oriented Programming through Java", "semester": 1},
    "A6CS02": {"name": "Digital Electronics and Computer Organization", "semester": 1},  # CORRECTED
    "A6CS07": {"name": "Software Engineering", "semester": 1},
    "A6BS03": {"name": "Computer Oriented Statistical Methods", "semester": 1},
}

R22_SEMESTER_2_2 = {
    "A6HS08": {"name": "Business Economics and Financial Analysis", "semester": 2},
    "A6CS08": {"name": "Discrete Mathematics", "semester": 2},
    "A6CS09": {"name": "Database Management Systems", "semester": 2},
    "A6CS11": {"name": "Operating System", "semester": 2},
    "A6CS13": {"name": "Software Testing Fundamentals", "semester": 2},
}

ALL_R22_SUBJECTS = {**R22_SEMESTER_2_1, **R22_SEMESTER_2_2}

REGULATION = "R22"
BRANCH = "CSE"


def fix_incorrect_subject_code(db):
    """Fix A6CS28 → A6CS02 in database"""
    log.info("Step 1: Fixing incorrect subject code A6CS28 → A6CS02")
    
    # Check if A6CS28 exists (query by code column, not UUID id)
    result = db.table("subjects").select("*").eq("code", "A6CS28").eq("regulation", REGULATION).execute()
    if result.data:
        old_subject = result.data[0]
        old_uuid = old_subject["id"]
        log.warning(f"Found incorrect subject code A6CS28 with UUID {old_uuid}")
        
        # Update papers first (foreign key references UUID)
        papers_result = db.table("papers").select("id").eq("subject_id", old_uuid).execute()
        paper_count = len(papers_result.data or [])
        
        if paper_count > 0:
            log.info(f"  Found {paper_count} papers linked to A6CS28")
            # We'll handle these in the next step by ensuring A6CS02 exists and re-linking
        
        # Update the code to A6CS02
        db.table("subjects").update({"code": "A6CS02"}).eq("id", old_uuid).execute()
        log.info(f"  ✅ Updated subject code from A6CS28 to A6CS02")
    else:
        log.info("  ✅ A6CS28 not found (already corrected or never existed)")


def upsert_all_subjects(db):
    """Insert or update all 10 R22 CSE subjects"""
    log.info("Step 2: Upserting all 10 R22 CSE subjects")
    
    # First, get MLRIT college ID
    college_result = db.table("colleges").select("id").eq("short_name", "MLRIT").execute()
    if not college_result.data:
        log.error("❌ MLRIT college not found in database")
        return []
    college_id = college_result.data[0]["id"]
    log.info(f"  Using MLRIT college_id: {college_id}")
    
    # Process each subject
    created_count = 0
    updated_count = 0
    
    for code, info in ALL_R22_SUBJECTS.items():
        # Check if subject exists (by code)
        existing = db.table("subjects").select("*").eq("code", code).eq("regulation", REGULATION).execute()
        
        subject_data = {
            "college_id": college_id,
            "name": info["name"],
            "code": code,
            "semester": info["semester"],
            "regulation": REGULATION,
        }
        
        if existing.data:
            # Update existing subject
            subject_id = existing.data[0]["id"]
            db.table("subjects").update(subject_data).eq("id", subject_id).execute()
            log.info(f"  ✅ Updated {code}: {info['name']}")
            updated_count += 1
        else:
            # Insert new subject
            db.table("subjects").insert(subject_data).execute()
            log.info(f"  ✅ Inserted {code}: {info['name']}")
            created_count += 1
    
    log.info(f"  Created: {created_count}, Updated: {updated_count}, Total: {created_count + updated_count}")
    return list(ALL_R22_SUBJECTS.keys())


def verify_subject_distribution(db):
    """Verify all subjects are correctly distributed"""
    log.info("Step 3: Verifying subject distribution")
    
    # Get semester 2-1 subjects (query by code for readability)
    sem_2_1 = db.table("subjects").select("id, code, name, semester").eq("semester", 1).eq("regulation", REGULATION).order("code").execute()
    log.info(f"\n  Semester 2-1 (semester=1): {len(sem_2_1.data or [])} subjects")
    for subj in (sem_2_1.data or []):
        log.info(f"    {subj['code']}: {subj['name']}")
    
    # Get semester 2-2 subjects
    sem_2_2 = db.table("subjects").select("id, code, name, semester").eq("semester", 2).eq("regulation", REGULATION).order("code").execute()
    log.info(f"\n  Semester 2-2 (semester=2): {len(sem_2_2.data or [])} subjects")
    for subj in (sem_2_2.data or []):
        log.info(f"    {subj['code']}: {subj['name']}")
    
    # Validate counts
    if len(sem_2_1.data or []) != 5:
        log.error(f"❌ Semester 2-1 should have exactly 5 subjects, found {len(sem_2_1.data or [])}")
        return False
    
    if len(sem_2_2.data or []) != 5:
        log.error(f"❌ Semester 2-2 should have exactly 5 subjects, found {len(sem_2_2.data or [])}")
        return False
    
    # Validate specific subjects by code
    expected_2_1 = set(R22_SEMESTER_2_1.keys())
    actual_2_1 = set(s["code"] for s in (sem_2_1.data or []))
    if expected_2_1 != actual_2_1:
        log.error(f"❌ Semester 2-1 subject mismatch. Expected: {expected_2_1}, Got: {actual_2_1}")
        return False
    
    expected_2_2 = set(R22_SEMESTER_2_2.keys())
    actual_2_2 = set(s["code"] for s in (sem_2_2.data or []))
    if expected_2_2 != actual_2_2:
        log.error(f"❌ Semester 2-2 subject mismatch. Expected: {expected_2_2}, Got: {actual_2_2}")
        return False
    
    # Critical check: Ensure A6CS02 exists and A6CS28 does not
    a6cs02_check = db.table("subjects").select("code").eq("code", "A6CS02").eq("regulation", REGULATION).execute()
    a6cs28_check = db.table("subjects").select("code").eq("code", "A6CS28").eq("regulation", REGULATION).execute()
    
    if not a6cs02_check.data:
        log.error("❌ A6CS02 (Digital Electronics and Computer Organization) not found!")
        return False
    
    if a6cs28_check.data:
        log.error("❌ A6CS28 still exists! Should have been corrected to A6CS02")
        return False
    
    log.info("\n✅ All subject distribution checks passed!")
    log.info("✅ A6CS02 exists (correct code)")
    log.info("✅ A6CS28 does not exist (incorrect code removed)")
    return True


def main():
    log.info("=" * 80)
    log.info("SUBJECT-SEMESTER MAPPING FIX - R22 CSE")
    log.info("=" * 80)
    
    db = get_db()
    
    try:
        # Step 1: Fix incorrect code
        fix_incorrect_subject_code(db)
        
        # Step 2: Upsert all subjects
        upsert_all_subjects(db)
        
        # Step 3: Verify
        success = verify_subject_distribution(db)
        
        if success:
            log.info("\n" + "=" * 80)
            log.info("✅ SUBJECT MAPPING FIX COMPLETE")
            log.info("=" * 80)
            log.info("\nNext steps:")
            log.info("1. Test frontend: npm run dev")
            log.info("2. Verify Analysis page shows all 5 subjects per semester")
            log.info("3. Verify Papers page subject filter shows all subjects")
            log.info("4. Check that A6CS02 (not A6CS28) appears for Digital Electronics")
        else:
            log.error("\n❌ Verification failed. Please check logs above.")
            sys.exit(1)
            
    except Exception as e:
        log.error(f"\n❌ Error during fix: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

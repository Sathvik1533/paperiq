import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# The 10 official subjects
VALID_CODES = [
    "A6CS05", "A6IT02", "A6CS02", "A6CS07", "A6BS03",
    "A6HS08", "A6CS08", "A6CS09", "A6CS11", "A6CS13"
]

def clean_db():
    db = get_db()
    
    # 1. First run the existing mapping fix (changes A6CS28 to A6CS02)
    try:
        from scripts.fix_subject_semester_mapping import fix_incorrect_subject_code, upsert_all_subjects
        fix_incorrect_subject_code(db)
        upsert_all_subjects(db)
    except Exception as e:
        log.error(f"Error running fix_subject_semester_mapping: {e}")

    # 2. Get all subjects for R22
    response = db.table("subjects").select("id, code, name").eq("regulation", "R22").execute()
    all_subjects = response.data or []
    
    deleted_count = 0
    for subj in all_subjects:
        if subj["code"] not in VALID_CODES:
            log.warning(f"Found invalid subject: {subj['code']} - {subj['name']} ({subj['id']})")
            # Delete questions
            q_res = db.table("questions").delete().eq("subject_id", subj["id"]).execute()
            # Delete papers
            p_res = db.table("papers").delete().eq("subject_id", subj["id"]).execute()
            # Delete subject
            s_res = db.table("subjects").delete().eq("id", subj["id"]).execute()
            log.info(f"Deleted invalid subject {subj['code']} along with its papers and questions.")
            deleted_count += 1
            
    log.info(f"Done. Deleted {deleted_count} invalid subjects.")

if __name__ == "__main__":
    clean_db()

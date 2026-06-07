"""
Backfill Missing Paper Metadata

This script:
1. Calculates max_marks from questions for papers missing this data
2. Sets default duration_hours = 3 for papers missing this field
3. Counts questions per paper
4. Updates the papers table

Run: python -m backend.scripts.backfill_paper_metadata
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)


def backfill_metadata():
    """Backfill max_marks and duration_hours for all papers"""
    db = get_db()
    
    print("="*70)
    print("BACKFILLING PAPER METADATA")
    print("="*70)
    
    # Get all papers
    papers_result = db.table("papers").select("id, max_marks, duration_hours, regulation").execute()
    papers = papers_result.data or []
    
    print(f"\nTotal papers: {len(papers)}")
    
    updated_marks = 0
    updated_duration = 0
    updated_both = 0
    
    for paper in papers:
        paper_id = paper['id']
        needs_update = False
        updates = {}
        
        # Check max_marks
        if paper.get('max_marks') is None:
            # Calculate from questions
            questions_result = db.table("questions").select("marks").eq("paper_id", paper_id).execute()
            questions = questions_result.data or []
            
            if questions:
                # Sum all marks (filter out None values)
                total_marks = sum(q.get('marks', 0) or 0 for q in questions)
                
                if total_marks > 0:
                    updates['max_marks'] = total_marks
                    needs_update = True
                    updated_marks += 1
                else:
                    # No marks data - use default based on regulation
                    # Most JNTUH exams are 70 marks
                    updates['max_marks'] = 70
                    needs_update = True
                    updated_marks += 1
            else:
                # No questions yet - use default
                updates['max_marks'] = 70
                needs_update = True
                updated_marks += 1
        
        # Check duration_hours
        if paper.get('duration_hours') is None:
            # Standard exam duration is 3 hours
            updates['duration_hours'] = 3
            needs_update = True
            updated_duration += 1
        
        # Apply updates
        if needs_update:
            try:
                db.table("papers").update(updates).eq("id", paper_id).execute()
                
                if 'max_marks' in updates and 'duration_hours' in updates:
                    updated_both += 1
                    log.info(f"Updated {paper_id}: max_marks={updates['max_marks']}, duration_hours={updates['duration_hours']}")
                elif 'max_marks' in updates:
                    log.info(f"Updated {paper_id}: max_marks={updates['max_marks']}")
                elif 'duration_hours' in updates:
                    log.info(f"Updated {paper_id}: duration_hours={updates['duration_hours']}")
                    
            except Exception as e:
                log.error(f"Failed to update {paper_id}: {e}")
    
    print("\n" + "="*70)
    print("BACKFILL COMPLETE")
    print("="*70)
    print(f"Papers updated with max_marks: {updated_marks}")
    print(f"Papers updated with duration_hours: {updated_duration}")
    print(f"Papers updated with both: {updated_both}")
    print("="*70)


if __name__ == "__main__":
    backfill_metadata()

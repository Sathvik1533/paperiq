#!/usr/bin/env python3
"""
Step 1: Remap all papers to verified subject registry
This must run BEFORE deleting old subjects
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Subject code mapping from hall tickets
SUBJECT_CODE_TO_SEMESTER = {
    # 2-1
    'A6IT02': {'semester': 1, 'name': 'Object Oriented Programming through Java'},
    'A6CS28': {'semester': 1, 'name': 'Digital Electronics and Computer Organization'},
    'A6CS05': {'semester': 1, 'name': 'Data Structures'},
    'A6CS07': {'semester': 1, 'name': 'Software Engineering'},
    'A6BS03': {'semester': 1, 'name': 'Computer Oriented Statistical Methods'},
    # 2-2
    'A6HS08': {'semester': 2, 'name': 'Business Economics and Financial Analysis'},
    'A6CS08': {'semester': 2, 'name': 'Discrete Mathematics'},
    'A6CS13': {'semester': 2, 'name': 'Software Testing Fundamentals'},
    'A6CS09': {'semester': 2, 'name': 'Database Management Systems'},
    'A6CS11': {'semester': 2, 'name': 'Operating System'},
}

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("REMAPPING PAPERS TO VERIFIED SUBJECTS")
    print("=" * 70)
    print()
    
    # Get all papers with subject codes
    papers = supabase.table("papers").select("id, subject_code, exam_category").execute()
    print(f"Total papers: {len(papers.data)}")
    
    # Get verified subjects
    subjects = supabase.table("subjects").select("id, code, name, semester").eq("regulation", "R22").eq("year", 2).execute()
    subject_map = {s['code']: s for s in subjects.data}
    
    print(f"Verified subjects in database: {len(subject_map)}")
    print()
    
    remapped = 0
    skipped = 0
    unknown_codes = set()
    
    for paper in papers.data:
        code = paper.get('subject_code')
        if not code:
            skipped += 1
            continue
        
        if code in SUBJECT_CODE_TO_SEMESTER:
            # Find matching subject in database
            matching_subjects = [s for s in subjects.data if s['code'] == code and s['semester'] == SUBJECT_CODE_TO_SEMESTER[code]['semester']]
            
            if matching_subjects:
                subject = matching_subjects[0]
                try:
                    supabase.table("papers").update({
                        "subject_id": subject['id'],
                        "semester": SUBJECT_CODE_TO_SEMESTER[code]['semester']
                    }).eq("id", paper['id']).execute()
                    remapped += 1
                    if remapped % 50 == 0:
                        print(f"  Remapped {remapped} papers...")
                except Exception as e:
                    print(f"❌ Failed to remap paper {paper['id']}: {e}")
            else:
                print(f"⚠️  Subject {code} not found in database")
        else:
            unknown_codes.add(code)
            skipped += 1
    
    print()
    print("=" * 70)
    print(f"✅ Remapped: {remapped} papers")
    print(f"⏭️  Skipped: {skipped} papers")
    print("=" * 70)
    
    if unknown_codes:
        print()
        print("UNKNOWN SUBJECT CODES (not in verified list):")
        for code in sorted(unknown_codes):
            count = len([p for p in papers.data if p.get('subject_code') == code])
            print(f"  {code}: {count} papers")
    
    # Verify remapping
    print()
    print("VERIFICATION - Papers per verified subject:")
    print("-" * 70)
    for code in sorted(SUBJECT_CODE_TO_SEMESTER.keys()):
        info = SUBJECT_CODE_TO_SEMESTER[code]
        matching_subs = [s for s in subjects.data if s['code'] == code and s['semester'] == info['semester']]
        if matching_subs:
            sub_id = matching_subs[0]['id']
            count = supabase.table("papers").select("id", count="exact").eq("subject_id", sub_id).execute()
            question_count = supabase.table("questions").select("id", count="exact").eq("subject_id", sub_id).execute()
            print(f"{code} ({info['semester']}-{info['semester']}): {count.count} papers, {question_count.count} questions")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Extract subject codes from paper filenames and remap to verified subjects
"""
import sys
import os
import re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Verified subjects from hall tickets
VERIFIED_SUBJECTS = {
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

def extract_subject_code(filename):
    """Extract subject code from filename like 'DBMS_A6CS09.docx'"""
    match = re.search(r'(A6[A-Z]{2}\d{2})', filename)
    return match.group(1) if match else None

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("EXTRACTING SUBJECT CODES AND REMAPPING")
    print("=" * 70)
    print()
    
    # Get all verified subjects from database
    db_subjects = supabase.table("subjects").select("*").eq("regulation", "R22").eq("year", 2).execute()
    subject_lookup = {}
    for s in db_subjects.data:
        key = (s['code'], s['semester'])
        subject_lookup[key] = s
    
    print(f"Verified subjects in database: {len(db_subjects.data)}")
    for code, info in sorted(VERIFIED_SUBJECTS.items()):
        key = (code, info['semester'])
        if key in subject_lookup:
            print(f"  ✅ {code} (2-{info['semester']})")
        else:
            print(f"  ❌ {code} (2-{info['semester']}) - MISSING")
    print()
    
    # Get all papers
    papers = supabase.table("papers").select("id, file_name, subject_id, semester").execute()
    print(f"Total papers: {len(papers.data)}")
    print()
    
    # Extract and map
    remapped_papers = 0
    remapped_questions = 0
    unknown_codes = {}
    
    for paper in papers.data:
        filename = paper.get('file_name', '')
        subject_code = extract_subject_code(filename)
        
        if not subject_code:
            continue
        
        if subject_code in VERIFIED_SUBJECTS:
            semester = VERIFIED_SUBJECTS[subject_code]['semester']
            key = (subject_code, semester)
            
            if key in subject_lookup:
                subject_id = subject_lookup[key]['id']
                
                # Update paper
                try:
                    supabase.table("papers").update({
                        "subject_id": subject_id,
                        "semester": semester
                    }).eq("id", paper['id']).execute()
                    remapped_papers += 1
                    
                    # Update questions for this paper
                    result = supabase.table("questions").update({
                        "subject_id": subject_id,
                        "semester": semester
                    }).eq("paper_id", paper['id']).execute()
                    
                    if hasattr(result, 'count') and result.count:
                        remapped_questions += result.count
                    
                    if remapped_papers % 50 == 0:
                        print(f"  Remapped {remapped_papers} papers, {remapped_questions} questions...")
                        
                except Exception as e:
                    print(f"❌ Error remapping {filename}: {e}")
            else:
                print(f"⚠️  {subject_code} semester {semester} not in database")
        else:
            if subject_code:
                unknown_codes[subject_code] = unknown_codes.get(subject_code, 0) + 1
    
    print()
    print("=" * 70)
    print(f"✅ Remapped {remapped_papers} papers")
    print(f"✅ Remapped {remapped_questions} questions")
    print("=" * 70)
    
    if unknown_codes:
        print()
        print("UNKNOWN SUBJECT CODES (not in verified list):")
        for code, count in sorted(unknown_codes.items()):
            print(f"  {code}: {count} papers")
    
    # Show final counts per subject
    print()
    print("FINAL VERIFICATION - Data per verified subject:")
    print("-" * 70)
    for code in sorted(VERIFIED_SUBJECTS.keys()):
        info = VERIFIED_SUBJECTS[code]
        key = (code, info['semester'])
        if key in subject_lookup:
            sub_id = subject_lookup[key]['id']
            papers_count = supabase.table("papers").select("id", count="exact").eq("subject_id", sub_id).execute()
            questions_count = supabase.table("questions").select("id", count="exact").eq("subject_id", sub_id).execute()
            print(f"{code} (2-{info['semester']}): {papers_count.count or 0} papers, {questions_count.count or 0} questions")

if __name__ == "__main__":
    main()

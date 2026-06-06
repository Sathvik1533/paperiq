#!/usr/bin/env python3
"""
Rebuild academic registry from verified hall tickets ONLY
Source: Verified 2-1 and 2-2 hall ticket images
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# VERIFIED SUBJECTS FROM HALL TICKETS - SOURCE OF TRUTH
VERIFIED_2_1 = [
    {'code': 'A6IT02', 'name': 'Object Oriented Programming through Java'},
    {'code': 'A6CS28', 'name': 'Digital Electronics and Computer Organization'},
    {'code': 'A6CS05', 'name': 'Data Structures'},
    {'code': 'A6CS07', 'name': 'Software Engineering'},
    {'code': 'A6BS03', 'name': 'Computer Oriented Statistical Methods'},
]

VERIFIED_2_2 = [
    {'code': 'A6HS08', 'name': 'Business Economics and Financial Analysis'},
    {'code': 'A6CS08', 'name': 'Discrete Mathematics'},
    {'code': 'A6CS13', 'name': 'Software Testing Fundamentals'},
    {'code': 'A6CS09', 'name': 'Database Management Systems'},
    {'code': 'A6CS11', 'name': 'Operating System'},
]

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("REBUILDING VERIFIED ACADEMIC REGISTRY")
    print("Source: Verified Hall Tickets (2-1 and 2-2)")
    print("=" * 70)
    print()
    
    # Get college ID
    college = supabase.table("colleges").select("id").execute()
    college_id = college.data[0]['id']
    
    # STEP 1: Get ALL R22 Year 2 subjects
    print("STEP 1: Identifying all R22 Year 2 subjects...")
    all_subjects = supabase.table("subjects").select("id, code, semester").eq("regulation", "R22").eq("year", 2).execute()
    print(f"Found {len(all_subjects.data)} subjects")
    print()
    
    # STEP 2: Identify which to keep
    verified_codes = {s['code'] for s in VERIFIED_2_1 + VERIFIED_2_2}
    to_delete = []
    to_keep = {}
    
    for subj in all_subjects.data:
        code = subj['code']
        sem = subj['semester']
        
        if code in verified_codes:
            # Keep ONE per code - prefer the one with more data
            if code not in to_keep:
                to_keep[code] = subj
            else:
                # Check which has more papers
                papers1 = supabase.table("papers").select("id", count="exact").eq("subject_id", subj['id']).execute()
                papers2 = supabase.table("papers").select("id", count="exact").eq("subject_id", to_keep[code]['id']).execute()
                
                if papers1.count > papers2.count:
                    to_delete.append(to_keep[code])
                    to_keep[code] = subj
                else:
                    to_delete.append(subj)
        else:
            to_delete.append(subj)
    
    print(f"Subjects to keep: {len(to_keep)}")
    print(f"Subjects to delete: {len(to_delete)}")
    print()
    
    # STEP 3: Move papers and questions from subjects being deleted
    print("STEP 3: Moving papers and questions to correct subjects...")
    for subj in to_delete:
        code = subj['code']
        if code in to_keep:
            target_id = to_keep[code]['id']
            
            # Move papers
            papers = supabase.table("papers").select("id").eq("subject_id", subj['id']).execute()
            if papers.data:
                print(f"  Moving {len(papers.data)} papers from {code} (old) to {code} (new)")
                for p in papers.data:
                    supabase.table("papers").update({"subject_id": target_id}).eq("id", p['id']).execute()
            
            # Move questions
            questions = supabase.table("questions").select("id").eq("subject_id", subj['id']).execute()
            if questions.data:
                print(f"  Moving {len(questions.data)} questions from {code} (old) to {code} (new)")
                for q in questions.data:
                    supabase.table("questions").update({"subject_id": target_id}).eq("id", q['id']).execute()
    
    print()
    
    # STEP 4: Delete unwanted subjects
    print("STEP 4: Deleting incorrect/duplicate subjects...")
    for subj in to_delete:
        try:
            # Delete syllabus_topics first
            supabase.table("syllabus_topics").delete().eq("subject_id", subj['id']).execute()
            # Delete subject
            supabase.table("subjects").delete().eq("id", subj['id']).execute()
            print(f"  ✅ Deleted {subj['code']} (semester {subj['semester']})")
        except Exception as e:
            print(f"  ⚠️  Could not delete {subj['code']}: {e}")
    
    print()
    
    # STEP 5: Verify remaining subjects have correct semester
    print("STEP 5: Verifying semester mappings...")
    for code, subj in to_keep.items():
        # Find correct semester
        correct_sem = None
        if any(s['code'] == code for s in VERIFIED_2_1):
            correct_sem = 1
        elif any(s['code'] == code for s in VERIFIED_2_2):
            correct_sem = 2
        
        if correct_sem and subj['semester'] != correct_sem:
            print(f"  Fixing {code}: semester {subj['semester']} → {correct_sem}")
            supabase.table("subjects").update({"semester": correct_sem}).eq("id", subj['id']).execute()
    
    print()
    
    # STEP 6: Create any missing subjects
    print("STEP 6: Creating missing subjects...")
    existing_codes = set(to_keep.keys())
    
    for subj_list, semester in [(VERIFIED_2_1, 1), (VERIFIED_2_2, 2)]:
        for subj in subj_list:
            if subj['code'] not in existing_codes:
                print(f"  Creating {subj['code']} - {subj['name']}")
                supabase.table("subjects").insert({
                    "college_id": college_id,
                    "code": subj['code'],
                    "name": subj['name'],
                    "regulation": "R22",
                    "year": 2,
                    "semester": semester
                }).execute()
    
    print()
    print("=" * 70)
    print("FINAL VERIFIED REGISTRY")
    print("=" * 70)
    print()
    
    # Query final registry
    subjects = supabase.table("subjects").select("*").eq("regulation", "R22").eq("year", 2).order("semester").order("code").execute()
    
    sem1 = [s for s in subjects.data if s['semester'] == 1]
    sem2 = [s for s in subjects.data if s['semester'] == 2]
    
    print(f"2-1 (II B.Tech I Semester): {len(sem1)} subjects")
    for s in sorted(sem1, key=lambda x: x['code']):
        papers = supabase.table("papers").select("id", count="exact").eq("subject_id", s['id']).execute()
        questions = supabase.table("questions").select("id", count="exact").eq("subject_id", s['id']).execute()
        print(f"  ✓ {s['code']} - {s['name']}")
        print(f"    Papers: {papers.count}, Questions: {questions.count}")
    
    print()
    print(f"2-2 (II B.Tech II Semester): {len(sem2)} subjects")
    for s in sorted(sem2, key=lambda x: x['code']):
        papers = supabase.table("papers").select("id", count="exact").eq("subject_id", s['id']).execute()
        questions = supabase.table("questions").select("id", count="exact").eq("subject_id", s['id']).execute()
        print(f"  ✓ {s['code']} - {s['name']}")
        print(f"    Papers: {papers.count}, Questions: {questions.count}")
    
    print()
    print("=" * 70)
    
    if len(sem1) == 5 and len(sem2) == 5:
        print("✅✅✅ REGISTRY CORRECT ✅✅✅")
        print("5 subjects in 2-1, 5 subjects in 2-2")
    else:
        print(f"❌ REGISTRY INCORRECT: {len(sem1)} in 2-1, {len(sem2)} in 2-2 (expected 5 each)")
    
    print("=" * 70)

if __name__ == "__main__":
    main()

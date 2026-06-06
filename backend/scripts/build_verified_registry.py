#!/usr/bin/env python3
"""
Build verified subject registry from official MLRIT CSE R22 structure
Source: Hall tickets + Official syllabus PDF
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# VERIFIED THEORY SUBJECTS FROM HALL TICKETS
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
    print("BUILDING VERIFIED SUBJECT REGISTRY")
    print("Source: MLRIT CSE R22 Hall Tickets + Official Syllabus")
    print("=" * 70)
    print()
    
    print("YEAR 2 SEMESTER 1 (2-1) - THEORY SUBJECTS")
    print("-" * 70)
    for s in VERIFIED_2_1:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("YEAR 2 SEMESTER 2 (2-2) - THEORY SUBJECTS")
    print("-" * 70)
    for s in VERIFIED_2_2:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("=" * 70)
    print(f"2-1 Theory: {len(VERIFIED_2_1)} subjects")
    print(f"2-2 Theory: {len(VERIFIED_2_2)} subjects")
    print(f"Total: {len(VERIFIED_2_1) + len(VERIFIED_2_2)} subjects")
    print("=" * 70)
    print()
    
    # Get college ID
    college = supabase.table("colleges").select("id").execute()
    if not college.data:
        print("❌ No college found in database")
        return
    
    college_id = college.data[0]['id']
    print(f"Using college ID: {college_id}")
    print()
    
    # Clear existing subjects for R22 CSE Year 2
    print("Clearing existing Year 2 R22 CSE subjects...")
    existing = supabase.table("subjects").select("id").eq("regulation", "R22").eq("year", 2).execute()
    if existing.data:
        # First delete syllabus_topics to avoid foreign key constraint
        for subj in existing.data:
            try:
                supabase.table("syllabus_topics").delete().eq("subject_id", subj['id']).execute()
            except:
                pass
        # Then delete subjects
        for subj in existing.data:
            try:
                supabase.table("subjects").delete().eq("id", subj['id']).execute()
            except Exception as e:
                print(f"Warning: Could not delete subject {subj['id']}: {e}")
    print(f"✅ Cleared {len(existing.data) if existing.data else 0} old subjects")
    
    # Insert verified subjects
    print("\nInserting verified subjects...")
    inserted = 0
    
    for s in VERIFIED_2_1:
        try:
            supabase.table("subjects").insert({
                "college_id": college_id,
                "code": s['code'],
                "name": s['name'],
                "regulation": "R22",
                "year": 2,
                "semester": 1
            }).execute()
            inserted += 1
            print(f"✅ {s['code']}")
        except Exception as e:
            print(f"❌ {s['code']}: {e}")
    
    for s in VERIFIED_2_2:
        try:
            supabase.table("subjects").insert({
                "college_id": college_id,
                "code": s['code'],
                "name": s['name'],
                "regulation": "R22",
                "year": 2,
                "semester": 2
            }).execute()
            inserted += 1
            print(f"✅ {s['code']}")
        except Exception as e:
            print(f"❌ {s['code']}: {e}")
    
    print()
    print("=" * 70)
    print(f"✅ Registry built: {inserted} subjects")
    print("=" * 70)
    
    # Verify registry
    print("\nVERIFYING REGISTRY...")
    print("-" * 70)
    
    subjects = supabase.table("subjects").select("*").eq("regulation", "R22").eq("year", 2).order("semester").order("code").execute()
    
    sem1 = [s for s in subjects.data if s['semester'] == 1]
    sem2 = [s for s in subjects.data if s['semester'] == 2]
    
    print(f"2-1 in database: {len(sem1)}")
    for s in sem1:
        print(f"  {s['code']} - {s['name']}")
    
    print()
    print(f"2-2 in database: {len(sem2)}")
    for s in sem2:
        print(f"  {s['code']} - {s['name']}")
    
    print()
    if len(sem1) == len(VERIFIED_2_1) and len(sem2) == len(VERIFIED_2_2):
        print("✅✅✅ REGISTRY VERIFIED ✅✅✅")
        print("Subject counts match verified data")
    else:
        print("❌ MISMATCH - registry does not match verified data")

if __name__ == "__main__":
    main()

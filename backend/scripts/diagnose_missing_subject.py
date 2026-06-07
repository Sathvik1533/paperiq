#!/usr/bin/env python3
"""
Diagnose why A6BS03 is not showing in Analysis dropdown
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
import json

load_dotenv()

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 80)
    print("DIAGNOSING MISSING SUBJECT ISSUE (A6BS03)")
    print("=" * 80)
    print()
    
    # STEP 1: Check if subject exists
    print("STEP 1: Checking if A6BS03 exists in database...")
    subjects = supabase.table("subjects").select("*").eq("code", "A6BS03").execute()
    
    if not subjects.data:
        print("❌ A6BS03 NOT FOUND in database!")
        print()
        print("SOLUTION: Run rebuild_verified_registry.py to create it")
        return
    
    print(f"✅ Found {len(subjects.data)} record(s) for A6BS03")
    for s in subjects.data:
        print(f"   ID: {s['id']}")
        print(f"   Name: {s['name']}")
        print(f"   Regulation: {s['regulation']}")
        print(f"   Year: {s.get('year', 'N/A')}")
        print(f"   Semester: {s['semester']}")
        print(f"   College ID: {s.get('college_id', 'N/A')}")
        print(f"   Branch ID: {s.get('branch_id', 'N/A')}")
        print()
    
    subject = subjects.data[0]
    
    # STEP 2: Check all R22 Semester 1 subjects
    print("STEP 2: All subjects for R22 Semester 1...")
    all_sem1 = supabase.table("subjects").select("code, name").eq("regulation", "R22").eq("semester", 1).order("code").execute()
    
    print(f"Found {len(all_sem1.data)} subjects:")
    for s in all_sem1.data:
        marker = "✅" if s['code'] == "A6BS03" else "  "
        print(f"  {marker} {s['code']}: {s['name']}")
    print()
    
    # STEP 3: Check papers for A6BS03
    print("STEP 3: Papers linked to A6BS03...")
    papers = supabase.table("papers").select("id, title, exam_type, exam_year").eq("subject_id", subject['id']).execute()
    print(f"Found {len(papers.data)} papers")
    if papers.data:
        for p in papers.data[:5]:
            print(f"   - {p.get('title', 'Untitled')} ({p.get('exam_type', 'N/A')} {p.get('exam_year', '')})")
    print()
    
    # STEP 4: Check branch mapping
    print("STEP 4: Checking branch mapping...")
    branch_map = supabase.table("subject_branch_map").select("*").eq("subject_id", subject['id']).execute()
    
    if not branch_map.data:
        print("⚠️  No branch mapping found - subject is NOT linked to any branch")
        print("   This might cause filtering issues in frontend")
        print()
        print("   SOLUTION: Either:")
        print("   1. Link subject to all branches")
        print("   2. Remove branch filtering in frontend API")
    else:
        print(f"✅ Subject is linked to {len(branch_map.data)} branch(es)")
        for m in branch_map.data:
            branch = supabase.table("branches").select("name, short_name").eq("id", m['branch_id']).execute()
            if branch.data:
                print(f"   - {branch.data[0]['name']} ({branch.data[0]['short_name']})")
    print()
    
    # STEP 5: Check what frontend sees
    print("STEP 5: Simulating frontend API call...")
    print("Frontend calls: getSubjectsForSemester(1, 'R22')")
    print("This queries: SELECT * FROM subjects WHERE semester=1 AND regulation='R22'")
    
    frontend_query = supabase.table("subjects").select("id, code, name").eq("semester", 1).eq("regulation", "R22").order("code").execute()
    
    print(f"Frontend would receive {len(frontend_query.data)} subjects:")
    has_a6bs03 = False
    for s in frontend_query.data:
        marker = "✅" if s['code'] == "A6BS03" else "  "
        if s['code'] == "A6BS03":
            has_a6bs03 = True
        print(f"  {marker} {s['code']}: {s['name']}")
    print()
    
    # FINAL DIAGNOSIS
    print("=" * 80)
    print("DIAGNOSIS")
    print("=" * 80)
    
    if not has_a6bs03:
        print("❌ A6BS03 exists but NOT returned by frontend query")
        print()
        print("Possible causes:")
        print("1. College ID mismatch - subject has different college_id than expected")
        print("2. Year field issue - subject might have year=NULL or wrong value")
        print("3. Database view/filter issue")
        print()
        print("SOLUTION: Check subject's college_id and year fields match user's profile")
    else:
        print("✅ A6BS03 IS in the frontend query results")
        print()
        print("If still not showing in UI, check:")
        print("1. Browser console for JavaScript errors")
        print("2. Network tab to see actual API response")
        print("3. Component rendering logic in Analysis.tsx")
        print("4. User's profile - does current_semester=1 and regulation='R22'?")
    
    print("=" * 80)

if __name__ == "__main__":
    main()

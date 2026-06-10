#!/usr/bin/env python3
"""
Verify hall ticket subjects against database
Based on manual extraction from hall tickets uploaded by user
"""
import asyncio
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))

from app.database import get_admin_db

# MANUALLY EXTRACTED FROM HALL TICKETS (from previous conversation context)
# Source: 2-1 SUPPLEMENTARY and 2-2 REGULAR hall tickets

SEMESTER_2_1_SUBJECTS = {
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS28": "Digital Electronics and Computer Organization",  # Matches PYQ papers (DECO abbreviation)
    "A6CS05": "Data Structures",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
}

SEMESTER_2_2_SUBJECTS = {
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS13": "Software Testing Fundamentals",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
}

# NON-THEORY SUBJECTS (should NOT be in system)
NON_THEORY_SUBJECTS = {
    "A6CS12": "Operating System Lab (Lab)",
    "A6CS14": "Mini Project (Project)",
    "A6CS53": "Skill Development (Skills)",
    "A6HS06": "Constitution of India (No exam date)",
    "A6MC02": "Constitution of India (Duplicate)",
}

async def verify_subjects():
    """Verify all hall ticket subjects exist in database"""
    
    supabase = get_admin_db()
    
    print("="*80)
    print("HALL TICKET SUBJECT VERIFICATION")
    print("="*80)
    print()
    
    # Combine all theory subjects
    all_theory_subjects = {**SEMESTER_2_1_SUBJECTS, **SEMESTER_2_2_SUBJECTS}
    
    print(f"Theory Subjects from Hall Tickets: {len(all_theory_subjects)}")
    print(f"  Semester 2-1: {len(SEMESTER_2_1_SUBJECTS)}")
    print(f"  Semester 2-2: {len(SEMESTER_2_2_SUBJECTS)}")
    print()
    
    # Query database
    print("Querying database...")
    response = supabase.table('subjects').select('*').eq('regulation', 'R22').execute()
    
    db_subjects = {s['code']: s for s in response.data}
    print(f"Database Subjects (R22): {len(db_subjects)}")
    print()
    
    # Verification
    print("="*80)
    print("VERIFICATION RESULTS")
    print("="*80)
    print()
    
    # Check each theory subject
    missing = []
    present = []
    wrong_name = []
    
    for code, expected_name in all_theory_subjects.items():
        if code not in db_subjects:
            missing.append((code, expected_name))
            print(f"❌ MISSING: {code} - {expected_name}")
        else:
            db_name = db_subjects[code]['name']
            present.append((code, db_name))
            # Check if name matches (allow minor variations)
            if db_name.lower().strip() != expected_name.lower().strip():
                wrong_name.append((code, expected_name, db_name))
                print(f"⚠️  NAME MISMATCH: {code}")
                print(f"    Expected: {expected_name}")
                print(f"    Database: {db_name}")
            else:
                print(f"✅ VERIFIED: {code} - {db_name}")
    
    print()
    
    # Check for non-theory subjects
    print("="*80)
    print("NON-THEORY SUBJECTS (Should NOT be present)")
    print("="*80)
    print()
    
    non_theory_found = []
    for code, name in NON_THEORY_SUBJECTS.items():
        if code in db_subjects:
            non_theory_found.append((code, name, db_subjects[code]['name']))
            print(f"⚠️  FOUND: {code} - {name}")
            print(f"    (In DB as: {db_subjects[code]['name']})")
        else:
            print(f"✅ ABSENT: {code} - {name}")
    
    print()
    
    # Check for papers and questions
    print("="*80)
    print("DATA AVAILABILITY CHECK")
    print("="*80)
    print()
    
    for code, name in all_theory_subjects.items():
        if code in db_subjects:
            subject_id = db_subjects[code]['id']
            
            # Count papers
            papers_response = supabase.table('papers').select('id', count='exact').eq('subject_id', subject_id).execute()
            paper_count = papers_response.count or 0
            
            # Count questions
            questions_response = supabase.table('questions').select('id', count='exact').eq('subject_id', subject_id).execute()
            question_count = questions_response.count or 0
            
            status = "✅" if paper_count > 0 and question_count > 0 else "⚠️ "
            print(f"{status} {code}: {paper_count} papers, {question_count} questions")
    
    print()
    
    # Summary
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total theory subjects in hall tickets: {len(all_theory_subjects)}")
    print(f"Present in database: {len(present)}")
    print(f"Missing from database: {len(missing)}")
    print(f"Name mismatches: {len(wrong_name)}")
    print(f"Non-theory subjects found: {len(non_theory_found)}")
    print()
    
    if len(missing) == 0 and len(wrong_name) == 0 and len(non_theory_found) == 0:
        print("✅ ALL VERIFICATION PASSED!")
    else:
        print("⚠️  ACTION REQUIRED:")
        if missing:
            print(f"  - Add {len(missing)} missing subjects to database")
        if wrong_name:
            print(f"  - Fix {len(wrong_name)} subject name mismatches")
        if non_theory_found:
            print(f"  - Remove {len(non_theory_found)} non-theory subjects from frontend")

if __name__ == "__main__":
    asyncio.run(verify_subjects())

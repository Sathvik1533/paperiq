#!/usr/bin/env python3
"""
R22 Historical Paper Ingestion
Scope: MLRIT CSE R22 2-1 and 2-2 papers from 2021-2025

Features:
- Only R22 papers (ignores R18, R20, R15)
- All years: 2021-2025 (keeps historical data)
- Extracts: subject_code, semester, regulation, exam_year, exam_attempt, exam_category
- Supports filtering: All Papers, Latest, Regular, Supplementary, Mid-1, Mid-2, Semester
"""
import os
import sys
import re
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# VERIFIED R22 SUBJECTS
R22_SUBJECTS = {
    # 2-1
    'A6IT02': {'name': 'Object Oriented Programming through Java', 'semester': 1},
    'A6CS28': {'name': 'Digital Electronics and Computer Organization', 'semester': 1},
    'A6CS05': {'name': 'Data Structures', 'semester': 1},
    'A6CS07': {'name': 'Software Engineering', 'semester': 1},
    'A6BS03': {'name': 'Computer Oriented Statistical Methods', 'semester': 1},
    # 2-2
    'A6HS08': {'name': 'Business Economics and Financial Analysis', 'semester': 2},
    'A6CS08': {'name': 'Discrete Mathematics', 'semester': 2},
    'A6CS13': {'name': 'Software Testing Fundamentals', 'semester': 2},
    'A6CS09': {'name': 'Database Management Systems', 'semester': 2},
    'A6CS11': {'name': 'Operating System', 'semester': 2},
}

# Exam month to category mapping
MONTH_TO_CATEGORY = {
    'August': 'mid1',
    'September': 'mid1',
    'October': 'mid2',
    'November': 'mid2',
    'December': 'semester',
    'January': 'semester',
    'February': 'mid1',
    'March': 'mid1',
    'April': 'mid2',
    'May': 'semester',
    'June': 'semester',
    'July': 'semester',
}

# Exam type patterns
EXAM_TYPES = {
    'regular': ['regular', 'normal'],
    'supplementary': ['supplementary', 'supply', 'supple'],
}

def extract_subject_code(filename):
    """Extract subject code from filename"""
    match = re.search(r'(A6[A-Z]{2}\d{2})', filename, re.IGNORECASE)
    return match.group(1).upper() if match else None

def extract_exam_month(text):
    """Extract exam month from paper title or filename"""
    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    for month in months:
        if re.search(month, text, re.IGNORECASE):
            return month
    return None

def extract_exam_year(text):
    """Extract exam year from paper title or filename"""
    # Look for 4-digit year or 2-digit year
    match = re.search(r'20(\d{2})|(\d{2})(?:25|24|23|22|21)', text)
    if match:
        year = match.group(1) or match.group(2)
        return int(f'20{year}') if len(year) == 2 else int(year)
    return None

def extract_exam_type(text):
    """Extract exam type (regular/supplementary)"""
    text_lower = text.lower()
    for exam_type, patterns in EXAM_TYPES.items():
        if any(p in text_lower for p in patterns):
            return exam_type
    return 'regular'  # default

def determine_exam_category(month):
    """Determine exam category from month"""
    return MONTH_TO_CATEGORY.get(month, 'Unknown')

def is_r22_paper(paper_title, filename):
    """Check if paper is R22"""
    text = f"{paper_title} {filename}"
    # Look for R22 or R-22
    if re.search(r'\(R-?22\)|R-?22', text, re.IGNORECASE):
        return True
    # Exclude known other regulations
    if re.search(r'R-?(18|20|15|16)', text, re.IGNORECASE):
        return False
    # If year is 2022+, likely R22
    year = extract_exam_year(text)
    if year and year >= 2022:
        return True
    return False

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("R22 HISTORICAL PAPER INGESTION")
    print("Scope: MLRIT CSE R22 2-1 and 2-2 (2021-2025)")
    print("=" * 70)
    print()
    
    # Get all papers
    papers = supabase.table("papers").select("id, title, file_name, regulation, exam_year, exam_month, exam_type, exam_category, subject_id").execute()
    
    # Get all papers with verified R22 subject IDs
    verified_subject_ids = []
    for code in R22_SUBJECTS.keys():
        subj = supabase.table("subjects").select("id").eq("code", code).eq("regulation", "R22").execute()
        if subj.data:
            verified_subject_ids.append(subj.data[0]['id'])
    
    print(f"Total papers in database: {len(papers.data)}")
    print(f"Verified R22 subject IDs: {len(verified_subject_ids)}")
    print()
    
    # Filter for papers with R22 subjects OR explicit R22 regulation
    r22_papers = []
    non_r22_papers = []
    
    for paper in papers.data:
        subject_id = paper.get('subject_id')
        regulation = paper.get('regulation', '')
        
        # Paper is R22 if it has a verified subject OR regulation is R22
        if subject_id in verified_subject_ids or regulation == 'R22':
            r22_papers.append(paper)
        else:
            non_r22_papers.append(paper)
    
    print(f"R22 papers identified: {len(r22_papers)}")
    print(f"Non-R22 papers (will be ignored): {len(non_r22_papers)}")
    print()
    
    # Process R22 papers
    updated = 0
    subject_counts = {}
    
    print("Processing R22 papers...")
    for paper in r22_papers:
        paper_id = paper['id']
        title = paper.get('title', '')
        filename = paper.get('file_name', '')
        
        # Extract metadata
        subject_code = extract_subject_code(filename or title)
        exam_month = extract_exam_month(title) or paper.get('exam_month')
        exam_year = extract_exam_year(title) or paper.get('exam_year')
        exam_type = extract_exam_type(title) or paper.get('exam_type', 'regular')
        exam_category = determine_exam_category(exam_month) if exam_month else 'Unknown'
        
        # Find subject in registry
        subject_id = None
        semester = None
        if subject_code and subject_code in R22_SUBJECTS:
            subject_info = R22_SUBJECTS[subject_code]
            semester = subject_info['semester']
            
            # Get subject_id from database
            subj = supabase.table("subjects").select("id").eq("code", subject_code).eq("regulation", "R22").eq("semester", semester).execute()
            if subj.data:
                subject_id = subj.data[0]['id']
        
        # Update paper
        updates = {
            "regulation": "R22",
        }
        
        if subject_id:
            updates["subject_id"] = subject_id
        if semester:
            updates["semester"] = semester
        if exam_year:
            updates["exam_year"] = exam_year
        if exam_month:
            updates["exam_month"] = exam_month
        if exam_type:
            updates["exam_type"] = exam_type
        if exam_category and exam_category != 'Unknown':
            updates["exam_category"] = exam_category
        
        # Apply updates
        try:
            supabase.table("papers").update(updates).eq("id", paper_id).execute()
            updated += 1
            
            # Track subject counts
            if subject_code:
                subject_counts[subject_code] = subject_counts.get(subject_code, 0) + 1
            
            if updated % 20 == 0:
                print(f"  Updated {updated} papers...")
        except Exception as e:
            print(f"  ❌ Error updating paper {paper_id}: {e}")
    
    print()
    print("=" * 70)
    print(f"✅ Updated {updated} R22 papers")
    print("=" * 70)
    print()
    
    # Show distribution
    print("PAPERS BY SUBJECT:")
    print("-" * 70)
    for code in sorted(subject_counts.keys()):
        name = R22_SUBJECTS.get(code, {}).get('name', 'Unknown')
        semester = R22_SUBJECTS.get(code, {}).get('semester', '?')
        count = subject_counts[code]
        print(f"  {code} (2-{semester}): {count:3} papers - {name}")
    
    print()
    print("PAPERS BY EXAM CATEGORY:")
    print("-" * 70)
    all_papers = supabase.table("papers").select("exam_category").eq("regulation", "R22").execute()
    from collections import Counter
    cats = Counter(p.get('exam_category', 'Unknown') for p in all_papers.data)
    for cat, count in sorted(cats.items()):
        print(f"  {cat:15}: {count:3} papers")
    
    print()
    print("PAPERS BY EXAM TYPE:")
    print("-" * 70)
    types = Counter(p.get('exam_type', 'Unknown') for p in all_papers.data)
    for typ, count in sorted(types.items()):
        print(f"  {typ:15}: {count:3} papers")
    
    print()
    print("PAPERS BY YEAR:")
    print("-" * 70)
    years = Counter(p.get('exam_year', 'Unknown') for p in all_papers.data)
    for year, count in sorted(years.items(), key=lambda x: (x[0] or 0)):
        print(f"  {year or 'Unknown':15}: {count:3} papers")
    
    print()
    print("=" * 70)
    print("✅ R22 INGESTION COMPLETE")
    print()
    print("Filtering options available:")
    print("  - All Papers (historical: 2021-2025)")
    print("  - Latest Papers (most recent year)")
    print("  - Regular only")
    print("  - Supplementary only")
    print("  - Mid-1 only")
    print("  - Mid-2 only")
    print("  - Semester only")
    print("=" * 70)

if __name__ == "__main__":
    main()

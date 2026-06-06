#!/usr/bin/env python3
"""
Extract exam month from paper titles and classify exam category
"""
import sys
import os
import re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Month patterns in titles/filenames
MONTH_PATTERNS = [
    (r'(?:January|Jan)', 'January'),
    (r'(?:February|Feb)', 'February'),
    (r'(?:March|Mar)', 'March'),
    (r'(?:April|Apr)', 'April'),
    (r'(?:May)', 'May'),
    (r'(?:June|Jun)', 'June'),
    (r'(?:July|Jul)', 'July'),
    (r'(?:August|Aug)', 'August'),
    (r'(?:September|Sep|Sept)', 'September'),
    (r'(?:October|Oct)', 'October'),
    (r'(?:November|Nov)', 'November'),
    (r'(?:December|Dec)', 'December'),
]

# Exam month to category (MLRIT calendar)
MONTH_TO_CATEGORY = {
    'August': 'mid1',     # 2nd year starts Aug, mid1 in Sep
    'September': 'mid1',
    'October': 'mid2',
    'November': 'mid2',
    'December': 'semester',
    'January': 'semester',
    'February': 'mid1',   # Spring semester starts Feb, mid1 in Mar
    'March': 'mid1',
    'April': 'mid2',
    'May': 'semester',
    'June': 'semester',
}

def extract_month(text):
    """Extract month from text"""
    if not text:
        return None
    for pattern, month in MONTH_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return month
    return None

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("EXTRACTING MONTH AND CLASSIFYING EXAM CATEGORY")
    print("=" * 70)
    print()
    
    # Get all papers
    papers = supabase.table("papers").select("id, title, file_name, exam_month, exam_category").execute()
    print(f"Total papers: {len(papers.data)}")
    print()
    
    updated = 0
    
    for paper in papers.data:
        # Try to extract month from title or filename
        month = extract_month(paper.get('title', ''))
        if not month:
            month = extract_month(paper.get('file_name', ''))
        
        if month:
            category = MONTH_TO_CATEGORY.get(month, 'Unknown')
            
            # Update if different from current
            current_month = paper.get('exam_month')
            current_cat = paper.get('exam_category')
            
            if current_month != month or current_cat != category:
                try:
                    supabase.table("papers").update({
                        "exam_month": month,
                        "exam_category": category
                    }).eq("id", paper['id']).execute()
                    updated += 1
                    if updated % 50 == 0:
                        print(f"  Updated {updated} papers...")
                except Exception as e:
                    print(f"❌ Error: {e}")
    
    print()
    print("=" * 70)
    print(f"✅ Updated: {updated} papers")
    print("=" * 70)
    
    # Show distribution
    print()
    print("DISTRIBUTION:")
    print("-" * 70)
    papers = supabase.table("papers").select("exam_month, exam_category").execute()
    
    from collections import Counter
    months = Counter(p.get('exam_month', 'None') for p in papers.data)
    cats = Counter(p.get('exam_category', 'None') for p in papers.data)
    
    print("By Month:")
    for month, count in sorted(months.items(), key=lambda x: (x[0] or 'ZZZ', x[1])):
        print(f"  {month or 'None':15}: {count:4} papers")
    
    print()
    print("By Category:")
    for cat, count in sorted(cats.items(), key=lambda x: (x[0] or 'ZZZ', x[1])):
        print(f"  {cat or 'None':15}: {count:4} papers")

if __name__ == "__main__":
    main()

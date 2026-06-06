#!/usr/bin/env python3
"""
Backfill exam_category for papers based on exam_month
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Exam month to category mapping (based on MLRIT calendar)
MONTH_TO_CATEGORY = {
    'September': 'mid1',
    'October': 'mid1',
    'November': 'mid2',
    'December': 'semester',
    'March': 'mid1',
    'April': 'mid2',
    'May': 'semester',
    'June': 'semester',
}

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 70)
    print("BACKFILLING EXAM CATEGORY")
    print("=" * 70)
    print()
    
    # Get all papers with Unknown exam_category
    papers = supabase.table("papers").select("id, exam_month, exam_category, title").execute()
    
    print(f"Total papers: {len(papers.data)}")
    unknown = [p for p in papers.data if p.get('exam_category') in ['Unknown', None]]
    print(f"Papers with Unknown category: {len(unknown)}")
    print()
    
    updated = 0
    skipped = 0
    
    for paper in unknown:
        month = paper.get('exam_month')
        if month and month in MONTH_TO_CATEGORY:
            category = MONTH_TO_CATEGORY[month]
            try:
                supabase.table("papers").update({
                    "exam_category": category
                }).eq("id", paper['id']).execute()
                updated += 1
                if updated % 50 == 0:
                    print(f"  Updated {updated} papers...")
            except Exception as e:
                print(f"❌ Failed to update {paper['id']}: {e}")
                skipped += 1
        else:
            skipped += 1
    
    print()
    print("=" * 70)
    print(f"✅ Updated: {updated} papers")
    print(f"⏭️  Skipped: {skipped} papers (no month or unmapped month)")
    print("=" * 70)
    
    # Show distribution
    print()
    print("DISTRIBUTION BY EXAM CATEGORY:")
    print("-" * 70)
    papers = supabase.table("papers").select("exam_category").execute()
    from collections import Counter
    counts = Counter(p.get('exam_category', 'None') for p in papers.data)
    for cat, count in sorted(counts.items()):
        print(f"  {cat:15}: {count:4} papers")

if __name__ == "__main__":
    main()

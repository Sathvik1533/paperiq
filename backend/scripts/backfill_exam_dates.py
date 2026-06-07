"""
Backfill exam_date field for all papers based on filename patterns and existing data.

Exam dates are extracted from:
1. Filename patterns (e.g., "R22_CSE_2023_Semester_DataStructures.pdf" → "2023-05")
2. Regulation + academic year mapping (e.g., R22 → 2022-2023 academic year)
3. Month estimation based on exam category:
   - Semester: May (end of academic year)
   - Mid-1: September (start of semester)
   - Mid-2: November (mid-semester)

This script updates the exam_date column in the papers table.
"""

import os
import re
import sys
from datetime import date
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def extract_year_from_filename(filename: str) -> Optional[int]:
    """Extract year from filename patterns like 'R22_CSE_2023_Semester_...'"""
    # Look for 4-digit year in filename
    match = re.search(r'_(\d{4})_', filename)
    if match:
        year = int(match.group(1))
        # Only accept reasonable years (2015-2030)
        if 2015 <= year <= 2030:
            return year
    return None


def regulation_to_year(regulation: str) -> int:
    """Convert regulation to base academic year (e.g., R22 → 2022)"""
    # Extract digits from regulation (R22 → 22, R20 → 20, etc.)
    match = re.search(r'R?(\d{2})', regulation, re.IGNORECASE)
    if match:
        year_suffix = int(match.group(1))
        # Convert 2-digit to 4-digit year (22 → 2022, 18 → 2018)
        return 2000 + year_suffix
    return 2022  # Default fallback


def exam_category_to_month(category: str) -> int:
    """Map exam category to typical month"""
    category_lower = category.lower() if category else ''
    if 'semester' in category_lower or 'end' in category_lower:
        return 5  # May (end of academic year)
    elif 'mid-1' in category_lower or 'mid1' in category_lower:
        return 9  # September (start of semester)
    elif 'mid-2' in category_lower or 'mid2' in category_lower:
        return 11  # November (mid-semester)
    else:
        return 5  # Default to May


def estimate_exam_date(
    filename: str,
    regulation: str,
    exam_category: str,
    semester: int
) -> date:
    """
    Estimate exam date from available data.
    
    Priority:
    1. Year from filename
    2. Regulation base year + semester offset
    3. Current year as fallback
    
    Month is estimated from exam category.
    """
    # Try to get year from filename first
    year = extract_year_from_filename(filename)
    
    if not year:
        # Calculate year from regulation + semester
        base_year = regulation_to_year(regulation)
        # Add semester offset (semester 1-2 → year 0, 3-4 → year 1, etc.)
        semester_offset = (semester - 1) // 2
        year = base_year + semester_offset
    
    # Get month from exam category
    month = exam_category_to_month(exam_category)
    
    # Create date (use day 1 for simplicity)
    try:
        return date(year, month, 1)
    except ValueError:
        # Fallback if date creation fails
        return date(year, 1, 1)


def backfill_exam_dates():
    """Backfill exam_date for all papers missing this field"""
    print("🔍 Fetching papers without exam_date...")
    
    # Get all papers without exam_date
    response = supabase.table('papers') \
        .select('id, file_name, regulation, exam_category, semester') \
        .is_('exam_date', 'null') \
        .execute()
    
    papers = response.data
    total = len(papers)
    
    if total == 0:
        print("✅ All papers already have exam dates.")
        return
    
    print(f"📝 Found {total} papers to backfill")
    
    updated = 0
    errors = 0
    
    for paper in papers:
        try:
            # Estimate exam date
            exam_date = estimate_exam_date(
                filename=paper.get('file_name', ''),
                regulation=paper.get('regulation', 'R22'),
                exam_category=paper.get('exam_category', 'Semester'),
                semester=paper.get('semester', 1)
            )
            
            # Update paper
            supabase.table('papers') \
                .update({'exam_date': exam_date.isoformat()}) \
                .eq('id', paper['id']) \
                .execute()
            
            updated += 1
            
            if updated % 10 == 0:
                print(f"  ✓ Updated {updated}/{total} papers...")
        
        except Exception as e:
            errors += 1
            print(f"  ✗ Error updating paper {paper['id']}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✅ Backfill complete!")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")
    print(f"   Total processed: {total}")
    print(f"{'='*60}")


def verify_backfill():
    """Verify the backfill was successful"""
    print("\n🔍 Verifying backfill...")
    
    # Count papers with and without exam_date
    total_response = supabase.table('papers') \
        .select('id', count='exact') \
        .execute()
    
    missing_response = supabase.table('papers') \
        .select('id', count='exact') \
        .is_('exam_date', 'null') \
        .execute()
    
    total = total_response.count
    missing = missing_response.count
    filled = total - missing
    
    print(f"\n📊 Exam Date Coverage:")
    print(f"   Total papers: {total}")
    print(f"   With exam_date: {filled} ({filled/total*100:.1f}%)")
    print(f"   Missing exam_date: {missing} ({missing/total*100:.1f}%)")
    
    # Sample some recent updates
    sample_response = supabase.table('papers') \
        .select('file_name, regulation, exam_category, semester, exam_date') \
        .not_('exam_date', 'is', 'null') \
        .order('exam_date', desc=True) \
        .limit(5) \
        .execute()
    
    if sample_response.data:
        print(f"\n📋 Sample of backfilled papers:")
        for paper in sample_response.data:
            print(f"   • {paper['file_name'][:50]:50s} → {paper['exam_date']}")


if __name__ == '__main__':
    print("="*60)
    print("🚀 Backfilling Exam Dates for Papers")
    print("="*60)
    
    try:
        backfill_exam_dates()
        verify_backfill()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

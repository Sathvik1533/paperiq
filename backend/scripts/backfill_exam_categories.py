#!/usr/bin/env python3
"""
Backfill exam_category and regulation for existing papers in the database.

This script:
1. Reads all papers with NULL exam_category
2. Classifies them using exam_classifier.py
3. Updates the database with detected values

Run after migration 002 is applied.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.utils.exam_classifier import classify_paper_from_label


async def backfill_papers():
    """Backfill exam_category for all existing papers."""
    
    print("🔄 Starting exam_category backfill...")
    
    # Get Supabase client
    db = get_db()
    
    # Fetch papers with NULL exam_category
    print("📥 Fetching papers without exam_category...")
    response = db.table("papers").select("id, title, exam_type, regulation").is_("exam_category", "null").execute()
    papers = response.data
    
    if not papers:
        print("✅ No papers to backfill. All papers already classified.")
        return
    
    print(f"📊 Found {len(papers)} papers to classify")
    
    # Classify and update each paper
    updated_count = 0
    skipped_count = 0
    
    for i, paper in enumerate(papers, 1):
        paper_id = paper["id"]
        title = paper["title"]
        
        # Classify the paper
        classification = classify_paper_from_label(title)
        
        # Prepare update data
        update_data = {
            "exam_category": classification["exam_category"],
        }
        
        # Update regulation only if detected and not already set
        if classification["regulation"] and not paper.get("regulation"):
            update_data["regulation"] = classification["regulation"]
        
        # Update database
        try:
            db.table("papers").update(update_data).eq("id", paper_id).execute()
            
            print(f"  [{i}/{len(papers)}] ✅ {paper_id[:8]}: {classification['exam_category']} | {title[:60]}...")
            updated_count += 1
            
        except Exception as e:
            print(f"  [{i}/{len(papers)}] ❌ {paper_id[:8]}: Error - {e}")
            skipped_count += 1
            continue
    
    print(f"\n🎉 Backfill complete!")
    print(f"  ✅ Updated: {updated_count} papers")
    print(f"  ❌ Skipped: {skipped_count} papers")
    print(f"  📊 Total: {len(papers)} papers")


async def verify_backfill():
    """Verify backfill results by showing distribution."""
    
    print("\n📊 Verifying backfill results...")
    
    db = get_db()
    
    # Count papers by exam_category
    response = db.table("papers").select("exam_category", count="exact").execute()
    
    # Group by exam_category
    categories = {}
    for paper in response.data:
        cat = paper.get("exam_category") or "NULL"
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📈 Papers by Exam Category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat:15} : {count:4} papers")
    
    # Check for NULL values
    null_count = categories.get("NULL", 0)
    if null_count > 0:
        print(f"\n⚠️  Warning: {null_count} papers still have NULL exam_category")
    else:
        print("\n✅ All papers have exam_category assigned!")


if __name__ == "__main__":
    print("=" * 60)
    print("PaperIQ — Exam Category Backfill Script")
    print("=" * 60)
    
    try:
        # Run backfill
        asyncio.run(backfill_papers())
        
        # Verify results
        asyncio.run(verify_backfill())
        
        print("\n✅ Script completed successfully")
        
    except KeyboardInterrupt:
        print("\n⚠️  Script interrupted by user")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Script failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

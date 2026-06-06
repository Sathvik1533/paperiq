#!/usr/bin/env python3
"""
Generate PDF placeholder links for papers until actual PDFs are uploaded.

This script creates external URLs pointing to MLRIT exam cell or Google Drive
where the PDFs might be hosted, OR generates a "PDF Coming Soon" indicator.

Run after fixing critical bugs to make the download button functional.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)


def generate_placeholder_url(paper: dict) -> str:
    """
    Generate a placeholder URL for a paper.
    
    For now, returns None to show "PDF Coming Soon" message.
    In production, this would point to college website or Google Drive.
    """
    # Example: If you have PDFs hosted externally
    # return f"https://mlrit.ac.in/exam-papers/{paper['regulation']}/{paper['subject_id']}.pdf"
    
    # For now, return None to show "Coming Soon"
    return None


def update_paper_urls():
    """Update all papers with placeholder URLs"""
    db = get_db()
    
    # Get all papers without URLs
    papers = db.table('papers').select('*').is_('original_url', 'null').execute()
    log.info(f"Found {len(papers.data)} papers without PDFs")
    
    updated_count = 0
    
    for paper in papers.data:
        url = generate_placeholder_url(paper)
        
        if url:
            db.table('papers').update({
                'original_url': url
            }).eq('id', paper['id']).execute()
            
            log.info(f"✅ Updated: {paper['title']}")
            updated_count += 1
        else:
            log.info(f"⏳ Skipped (no URL): {paper['title']}")
    
    log.info(f"\n✅ Updated {updated_count} / {len(papers.data)} papers")
    log.info(f"📝 {len(papers.data) - updated_count} papers still show 'PDF Coming Soon'")


if __name__ == '__main__':
    print("="*60)
    print("PDF Placeholder Generator")
    print("="*60)
    print("\nThis script generates placeholder URLs for papers.")
    print("Currently set to show 'PDF Coming Soon' for all papers.")
    print("\nTo link actual PDFs:")
    print("1. Upload PDFs to Supabase Storage bucket 'papers'")
    print("2. Update generate_placeholder_url() to return storage URLs")
    print("3. Or update original_url directly with external links")
    print("="*60)
    print()
    
    update_paper_urls()

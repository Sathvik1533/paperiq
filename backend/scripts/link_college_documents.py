#!/usr/bin/env python3
"""
Link College Website Documents to Papers

Since papers were extracted from DOCX files from MLRIT website,
this script generates download URLs pointing back to the college website.

The college website structure is typically:
https://mlrit.ac.in/examcell/questionpapers/R22/CSE/DBMS_A6CS09.docx
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# MLRIT exam cell actual URL from scraper
# Documents are in RAR archives that were extracted
# We need to point to wherever these DOCX files are accessible
# Option 1: If uploaded to Supabase storage
# Option 2: If still on college portal (need actual file paths)
BASE_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp"


def generate_document_url(paper: dict) -> str:
    """
    Generate download URL for paper document from college website.
    
    Example: DBMS_A6CS09.docx → 
    https://mlrit.ac.in/examcell/questionpapers/R22/CSE/DBMS_A6CS09.docx
    """
    regulation = paper.get('regulation', 'R22')
    file_name = paper.get('file_name', '')
    
    if not file_name:
        return None
    
    # Branch is typically CSE, ECE, MECH, etc.
    # For now assume CSE (can be extracted from subject_id if needed)
    branch = 'CSE'  # TODO: Get from subject or branch_id
    
    # Construct URL
    url = f"{BASE_URL}/{regulation}/{branch}/{file_name}"
    return url


def link_all_documents():
    """Link all papers to their college website documents"""
    db = get_db()
    
    # Get all papers without original_url
    papers = db.table('papers').select('*').is_('original_url', 'null').execute()
    log.info(f"Found {len(papers.data)} papers without download links")
    
    updated = 0
    failed = 0
    
    for paper in papers.data:
        url = generate_document_url(paper)
        
        if url:
            try:
                db.table('papers').update({
                    'original_url': url
                }).eq('id', paper['id']).execute()
                
                log.info(f"✅ Linked: {paper['title']}")
                log.info(f"   URL: {url}")
                updated += 1
            except Exception as e:
                log.error(f"❌ Failed to update {paper['title']}: {e}")
                failed += 1
        else:
            log.warning(f"⚠️ No file_name for: {paper['title']}")
            failed += 1
    
    print("\n" + "="*60)
    print(f"✅ Successfully linked: {updated} papers")
    print(f"❌ Failed: {failed} papers")
    print(f"📊 Total processed: {len(papers.data)} papers")
    print("="*60)
    
    print("\n📝 Next Steps:")
    print("1. Test download button in frontend")
    print("2. Verify URLs are correct for your college website")
    print("3. If URLs are wrong, update BASE_URL in this script")
    print("4. Users will download DOCX files (not PDFs)")


if __name__ == '__main__':
    print("="*60)
    print("MLRIT Document Linker")
    print("="*60)
    print("\nThis script links papers to college website documents")
    print(f"Base URL: {BASE_URL}")
    print("\nGenerated URLs will look like:")
    print(f"  {BASE_URL}/R22/CSE/DBMS_A6CS09.docx")
    print("\n⚠️  IMPORTANT: Verify this URL structure matches your college website!")
    print("="*60)
    
    response = input("\nProceed with linking? (yes/no): ")
    if response.lower() == 'yes':
        link_all_documents()
    else:
        print("Aborted.")

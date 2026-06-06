#!/usr/bin/env python3
"""
Upload Original DOCX Files to Supabase Storage

This script:
1. Downloads RAR archives from MLRIT website
2. Extracts DOCX files from archives  
3. Uploads them to Supabase Storage
4. Updates database with storage_path

This gives users authentic MLRIT question papers in DOCX format.
"""

import sys
import os
import tempfile
import subprocess
import asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_db
from app.logger import get_logger
from app.scrapers.colleges.mlrit import MLRITScraper

log = get_logger(__name__)

# Portal URL
MLRIT_PORTAL_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"

def extract_rar(rar_path: str, dest_dir: str) -> bool:
    """Extract RAR archive using unar"""
    try:
        result = subprocess.run(
            ['unar', '-o', dest_dir, rar_path],
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.returncode == 0
    except Exception as e:
        log.error(f"Failed to extract {rar_path}: {e}")
        return False


def upload_to_supabase_storage(local_path: str, storage_path: str) -> bool:
    """Upload file to Supabase Storage"""
    try:
        db = get_db()
        
        # Read file
        with open(local_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to 'papers' bucket
        result = db.storage.from_('papers').upload(
            storage_path,
            file_data,
            file_options={"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
        )
        
        log.info(f"✅ Uploaded: {storage_path}")
        return True
    except Exception as e:
        # If file already exists, that's okay
        if 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
            log.info(f"⏭️  Already exists: {storage_path}")
            return True
        log.error(f"❌ Upload failed for {storage_path}: {e}")
        return False


def process_paper(paper: dict, rar_extract_dir: Path) -> bool:
    """
    Find DOCX file for this paper, upload to storage, update database
    """
    file_name = paper.get('file_name')
    if not file_name:
        log.warning(f"⚠️  No file_name for paper: {paper['title']}")
        return False
    
    # Find the DOCX file in extracted directory
    docx_files = list(rar_extract_dir.rglob(file_name))
    
    if not docx_files:
        log.warning(f"⚠️  DOCX not found: {file_name}")
        return False
    
    local_docx_path = str(docx_files[0])
    
    # Storage path format: R22/CSE/DBMS_A6CS09.docx
    regulation = paper.get('regulation', 'R22')
    storage_path = f"{regulation}/CSE/{file_name}"
    
    # Upload to Supabase Storage
    if upload_to_supabase_storage(local_docx_path, storage_path):
        # Update database
        try:
            db = get_db()
            db.table('papers').update({
                'storage_path': storage_path
            }).eq('id', paper['id']).execute()
            
            log.info(f"✅ Updated DB: {paper['title']}")
            return True
        except Exception as e:
            log.error(f"❌ DB update failed for {paper['title']}: {e}")
            return False
    
    return False


def main():
    """Main execution"""
    
    # Check if archives directory exists
    if not ARCHIVES_DIR.exists():
        print(f"❌ Archives directory not found: {ARCHIVES_DIR}")
        print("\nPlease run the scraper first to download RAR archives:")
        print("  cd backend")
        print("  python scripts/download_papers.py")
        return
    
    # Find all RAR archives
    rar_files = list(ARCHIVES_DIR.glob("*.rar"))
    
    if not rar_files:
        print(f"❌ No RAR files found in {ARCHIVES_DIR}")
        return
    
    print("="*60)
    print("MLRIT DOCX Upload to Supabase Storage")
    print("="*60)
    print(f"\nFound {len(rar_files)} RAR archives")
    print(f"Archives directory: {ARCHIVES_DIR}")
    
    # Get all papers from database
    db = get_db()
    papers = db.table('papers').select('*').execute()
    total_papers = len(papers.data)
    
    print(f"Total papers in database: {total_papers}")
    print("\n" + "="*60)
    
    response = input("\nProceed with extraction and upload? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted.")
        return
    
    print("\n" + "="*60)
    print("EXTRACTING AND UPLOADING")
    print("="*60 + "\n")
    
    # Create temporary extraction directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Extract all RAR archives
        for rar_file in rar_files:
            print(f"\n📦 Extracting: {rar_file.name}")
            extract_dir = temp_path / rar_file.stem
            extract_dir.mkdir(exist_ok=True)
            
            if extract_rar(str(rar_file), str(extract_dir)):
                print(f"   ✅ Extracted")
            else:
                print(f"   ❌ Failed to extract")
                continue
        
        # Process each paper
        print("\n" + "="*60)
        print("UPLOADING DOCX FILES")
        print("="*60 + "\n")
        
        uploaded = 0
        failed = 0
        
        for paper in papers.data:
            if process_paper(paper, temp_path):
                uploaded += 1
            else:
                failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Successfully uploaded: {uploaded} files")
    print(f"❌ Failed: {failed} files")
    print(f"📊 Total papers: {total_papers}")
    print("="*60)
    
    print("\n📝 Next Steps:")
    print("1. Verify files in Supabase Storage bucket 'papers'")
    print("2. Test download in frontend")
    print("3. Users will now get authentic MLRIT DOCX files")


if __name__ == '__main__':
    # Check if unar is installed
    try:
        subprocess.run(['unar', '-v'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ 'unar' not found. Please install it:")
        print("   brew install unar")
        sys.exit(1)
    
    main()

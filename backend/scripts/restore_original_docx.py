#!/usr/bin/env python3
"""
Restore Original MLRIT DOCX Files

This script ensures students get authentic MLRIT question papers:
1. Downloads RAR archives from MLRIT website
2. Extracts original DOCX files
3. Uploads to Supabase Storage (papers bucket)
4. Updates database with storage_path

NO PDF GENERATION - Only authentic college documents.
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
from app.scrapers.playwright_scraper import PlaywrightScraper

log = get_logger(__name__)

MLRIT_PORTAL_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"


def extract_rar(rar_path: str, dest_dir: str) -> bool:
    """Extract RAR archive using unar"""
    try:
        result = subprocess.run(
            ['unar', '-q', '-o', dest_dir, rar_path],
            capture_output=True,
            text=True,
            timeout=300,
            check=True
        )
        return True
    except Exception as e:
        log.error(f"Failed to extract {rar_path}: {e}")
        return False


def upload_to_storage(local_path: str, storage_path: str) -> bool:
    """Upload DOCX file to Supabase Storage"""
    try:
        db = get_db()
        
        # Read file
        with open(local_path, 'rb') as f:
            file_data = f.read()
        
        # Detect content type
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if local_path.endswith('.doc'):
            content_type = "application/msword"
        
        # Upload to 'paper' bucket (singular - as created in Supabase)
        db.storage.from_('paper').upload(
            storage_path,
            file_data,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        return True
    except Exception as e:
        # Check if already exists
        if 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
            return True
        log.error(f"Upload failed for {storage_path}: {e}")
        return False


async def download_rar_archives(temp_dir: Path) -> list:
    """Download RAR archives from MLRIT website"""
    print("\n📥 Downloading RAR archives from MLRIT website...")
    
    scraper = PlaywrightScraper()
    
    # Get all B.Tech II year papers (2021-2025)
    papers = await scraper.list_papers(
        portal_url=MLRIT_PORTAL_URL,
        btech_year=2,
        year_from=2021,
        year_to=2025
    )
    
    print(f"✅ Found {len(papers)} RAR archives")
    
    # Download each RAR
    downloaded = []
    for i, paper in enumerate(papers, 1):
        rar_url = paper.url
        rar_name = paper.file_name
        rar_path = temp_dir / rar_name
        
        print(f"[{i}/{len(papers)}] Downloading {rar_name}...", end=" ")
        
        try:
            # Download using requests
            import requests
            response = requests.get(rar_url, timeout=300)
            response.raise_for_status()
            
            with open(rar_path, 'wb') as f:
                f.write(response.content)
            
            print("✅")
            downloaded.append(rar_path)
        except Exception as e:
            print(f"❌ {e}")
    
    return downloaded


def find_docx_for_paper(paper: dict, extract_base_dir: Path) -> str | None:
    """Find the DOCX file matching this paper"""
    file_name = paper.get('file_name')
    if not file_name:
        return None
    
    # Search in all extracted directories
    matches = list(extract_base_dir.rglob(file_name))
    
    if matches:
        return str(matches[0])
    
    # Try case-insensitive search
    for docx_file in extract_base_dir.rglob("*.doc*"):
        if docx_file.name.lower() == file_name.lower():
            return str(docx_file)
    
    return None


async def main():
    """Main execution"""
    
    print("="*70)
    print("RESTORE ORIGINAL MLRIT DOCX FILES")
    print("="*70)
    print("\nThis ensures students get authentic college question papers.")
    print("NO generated PDFs - only original MLRIT documents.\n")
    print("="*70)
    
    # Check prerequisites
    try:
        subprocess.run(['unar', '-v'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ 'unar' not found. Install it first:")
        print("   brew install unar")
        return
    
    # Get all papers from database
    db = get_db()
    papers_result = db.table('papers').select('*').execute()
    total_papers = len(papers_result.data)
    
    print(f"\n📊 Total papers in database: {total_papers}")
    
    # Check how many already have storage_path
    papers_with_storage = [p for p in papers_result.data if p.get('storage_path')]
    papers_without = [p for p in papers_result.data if not p.get('storage_path')]
    
    print(f"✅ Already have files: {len(papers_with_storage)}")
    print(f"⏳ Need files: {len(papers_without)}")
    
    if len(papers_without) == 0:
        print("\n🎉 All papers already have original DOCX files!")
        return
    
    print("\n" + "="*70)
    response = 'yes'
    if response.lower() != 'yes':
        print("Aborted.")
        return
    
    # Create temp directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Step 1: Download RAR archives
        print("\n" + "="*70)
        print("STEP 1: DOWNLOADING RAR ARCHIVES")
        print("="*70)
        
        rar_files = await download_rar_archives(temp_path)
        
        if not rar_files:
            print("❌ No RAR files downloaded. Check MLRIT website connection.")
            return
        
        # Step 2: Extract RAR archives
        print("\n" + "="*70)
        print("STEP 2: EXTRACTING RAR ARCHIVES")
        print("="*70)
        
        extract_dir = temp_path / "extracted"
        extract_dir.mkdir(exist_ok=True)
        
        for i, rar_file in enumerate(rar_files, 1):
            print(f"[{i}/{len(rar_files)}] Extracting {rar_file.name}...", end=" ")
            
            archive_extract = extract_dir / rar_file.stem
            archive_extract.mkdir(exist_ok=True)
            
            if extract_rar(str(rar_file), str(archive_extract)):
                print("✅")
            else:
                print("❌")
        
        # Step 3: Upload DOCX files to Supabase Storage
        print("\n" + "="*70)
        print("STEP 3: UPLOADING ORIGINAL DOCX TO SUPABASE")
        print("="*70)
        
        uploaded = 0
        not_found = 0
        failed = 0
        
        for i, paper in enumerate(papers_without, 1):
            title = paper.get('title', 'Unknown')[:50]
            print(f"[{i}/{len(papers_without)}] {title}...", end=" ")
            
            # Find DOCX file
            docx_path = find_docx_for_paper(paper, extract_dir)
            
            if not docx_path:
                print("⚠️  Not found")
                not_found += 1
                continue
            
            # Storage path: R22/CSE/filename.docx
            regulation = paper.get('regulation', 'R22')
            file_name = paper.get('file_name')
            storage_path = f"{regulation}/CSE/{file_name}"
            
            # Upload
            if upload_to_storage(docx_path, storage_path):
                # Update database
                try:
                    db.table('papers').update({
                        'storage_path': storage_path
                    }).eq('id', paper['id']).execute()
                    
                    print("✅")
                    uploaded += 1
                except Exception as e:
                    print(f"❌ DB: {e}")
                    failed += 1
            else:
                print("❌ Upload")
                failed += 1
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"✅ Successfully uploaded: {uploaded} files")
    print(f"⚠️  Not found: {not_found} files")
    print(f"❌ Failed: {failed} files")
    print(f"📊 Total papers: {total_papers}")
    print(f"📁 Papers with files: {len(papers_with_storage) + uploaded}")
    print("="*70)
    
    print("\n✅ Students will now download authentic MLRIT DOCX files!")
    print("\n📝 Next Steps:")
    print("1. Verify files in Supabase Storage dashboard")
    print("2. Test download in browser")
    print("3. Deploy to production")


if __name__ == '__main__':
    asyncio.run(main())

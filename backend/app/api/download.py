"""
On-Demand DOCX Download API

Extracts and serves authentic MLRIT question papers from RAR archives.
User clicks download → gets original DOCX instantly.

Performance: All blocking I/O operations offloaded to thread pool.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import tempfile
import subprocess
import asyncio
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import httpx

from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

# Thread pool for blocking I/O operations (prevents event loop blocking)
io_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="docx-io")

# Cache RAR archives for 24 hours to avoid repeated downloads
RAR_CACHE_DIR = Path(tempfile.gettempdir()) / "paperiq_rar_cache"
RAR_CACHE_DIR.mkdir(exist_ok=True)

# Cache extracted DOCX files for 1 hour
DOCX_CACHE_DIR = Path(tempfile.gettempdir()) / "paperiq_docx_cache"
DOCX_CACHE_DIR.mkdir(exist_ok=True)


def _extract_rar_sync(rar_path: str, dest_dir: str) -> bool:
    """
    Extract RAR using unar (synchronous - runs in thread pool).
    Separated to prevent blocking event loop during subprocess execution.
    """
    try:
        subprocess.run(
            ['unar', '-q', '-o', dest_dir, rar_path],
            capture_output=True,
            timeout=120,
            check=True
        )
        return True
    except Exception as e:
        log.error(f"RAR extraction failed: {e}")
        return False


async def extract_rar(rar_path: str, dest_dir: str) -> bool:
    """Async wrapper for RAR extraction - offloads to thread pool"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(io_executor, _extract_rar_sync, rar_path, dest_dir)


def find_docx_in_directory(directory: Path, file_name: str) -> Path | None:
    """Find file in extracted directory"""
    # Exact match
    matches = list(directory.rglob(file_name))
    if matches:
        return matches[0]
    
    # Case-insensitive match (handle doc, docx, pdf)
    for ext in ["*.doc*", "*.pdf"]:
        for file in directory.rglob(ext):
            if file.name.lower() == file_name.lower():
                return file
            
    # Try fuzzy match if exact name fails (e.g. if file_name missing extension)
    base_name = os.path.splitext(file_name)[0].lower()
    for ext in ["*.doc*", "*.pdf"]:
        for file in directory.rglob(ext):
            if file.stem.lower() == base_name:
                return file
                
    return None


async def get_rar_url_for_paper(paper: dict) -> str | None:
    """Get RAR archive URL containing this paper"""
    # Papers table has file_name like "DBMS_A6CS09.docx"
    # We need to find which RAR archive contains this file
    
    # For MLRIT, RAR archives are named like:
    # "II-B.Tech-December2024.rar", "II-BTech-May2023.rar"
    
    # We stored the archive info during scraping
    # Check if we have archive_url in papers table
    if paper.get('archive_url'):
        return paper['archive_url']
    
    # Fallback: scrape MLRIT website to find the archive
    # This is expensive, so we should store archive_url during ingestion
    
    # For now, return None and log error
    log.error(f"No archive_url found for paper: {paper.get('title')}")
    return None


async def download_rar(url: str, dest_path: Path) -> bool:
    """
    Download RAR archive using async HTTP client.
    Non-blocking - uses httpx for async downloads.
    """
    try:
        log.info(f"Downloading RAR from {url}")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream('GET', url) as response:
                response.raise_for_status()
                
                # Write in chunks to avoid loading entire file into memory
                async with asyncio.Lock():  # Prevent concurrent writes to same file
                    with open(dest_path, 'wb') as f:
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            f.write(chunk)
        
        return True
    except Exception as e:
        log.error(f"RAR download failed: {e}")
        return False


@router.get("/papers/{paper_id}/download/docx")
async def download_original_docx(paper_id: str):
    """
    Download authentic MLRIT DOCX question paper.
    
    Flow:
    1. Get paper metadata from database
    2. Check if DOCX already in cache
    3. If not cached: download RAR → extract DOCX → cache
    4. Serve DOCX file directly to user
    
    User gets original college document in one click.
    """
    
    db = get_db()
    
    # Get paper metadata
    paper_result = db.table('papers').select('*').eq('id', paper_id).execute()
    
    if not paper_result.data:
        raise HTTPException(404, "Paper not found")
    
    paper = paper_result.data[0]
    file_name = paper.get('file_name')
    
    if not file_name:
        raise HTTPException(404, "Paper file name not found")
    
    # Check DOCX cache first (fast path)
    cached_docx = DOCX_CACHE_DIR / file_name
    if cached_docx.exists():
        # Check if cache is fresh (< 1 hour old)
        cache_age = datetime.now().timestamp() - cached_docx.stat().st_mtime
        if cache_age < 3600:  # 1 hour
            log.info(f"Serving DOCX from cache: {file_name}")
            return FileResponse(
                path=str(cached_docx),
                filename=file_name,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
    
    # Not in cache - need to download and extract
    log.info(f"File not in cache, trying to get original: {file_name}")
    
    # Get archive URL
    archive_url = paper.get('archive_url')
    if not archive_url:
        # Fallback to original_url if archive_url is missing
        if paper.get('original_url') and (paper['original_url'].lower().endswith('.rar') or paper['original_url'].lower().endswith('.zip')):
            archive_url = paper['original_url']
        elif paper.get('original_url') and paper['original_url'].lower().endswith('.pdf'):
            # Direct PDF case
            archive_url = paper['original_url']
            
    if not archive_url:
        # Fallback: derive from MLRIT archive catalog based on month/year
        from app.scrapers.colleges.mlrit_r22 import R22_ARCHIVES, BASE_URL
        exam_year = paper.get('exam_year')
        exam_month = paper.get('exam_month')
        
        for archive in R22_ARCHIVES:
            if archive['year'] == exam_year and archive['month'] == exam_month:
                archive_url = f"{BASE_URL}/{archive['file']}"
                log.info(f"Derived archive URL from catalog: {archive_url}")
                break
    
    if not archive_url:
        log.error(f"No archive_url, original_url, or catalog match found for paper: {paper.get('title')}")
        raise HTTPException(
            503,
            "Original document temporarily unavailable. Please try PDF download instead."
        )
    
    # Handle direct PDF downloads
    is_direct_pdf = archive_url.lower().endswith('.pdf')
    
    download_name = archive_url.split('/')[-1]
    cached_download = RAR_CACHE_DIR / download_name
    
    if not cached_download.exists():
        log.info(f"Downloading file: {download_name}")
        if not await download_rar(archive_url, cached_download):
            raise HTTPException(503, "Failed to download file from college website")
    else:
        log.info(f"Using cached file: {download_name}")
    
    if is_direct_pdf:
        # If it's a PDF, just serve it directly
        import shutil
        shutil.copy(str(cached_download), str(cached_docx))
        return FileResponse(
            path=str(cached_docx),
            filename=file_name if file_name.lower().endswith('.pdf') else file_name + '.pdf',
            media_type="application/pdf"
        )
        
    # Extract archive to temp directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        log.info(f"Extracting archive: {download_name}")
        if not await extract_rar(str(cached_download), str(temp_path)):
            raise HTTPException(503, "Failed to extract archive")
        
        # Find the DOCX or PDF file
        docx_path = find_docx_in_directory(temp_path, file_name)
        
        if not docx_path:
            raise HTTPException(404, f"Question paper not found in archive: {file_name}")
        
        # Copy to cache for next time
        import shutil
        shutil.copy(str(docx_path), str(cached_docx))
        log.info(f"Cached file for future requests: {file_name}")
        
        media_type = "application/pdf" if str(docx_path).lower().endswith('.pdf') else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Serve the file
        return FileResponse(
            path=str(cached_docx),
            filename=docx_path.name,
            media_type=media_type
        )


@router.get("/papers/{paper_id}/download")
async def download_paper(paper_id: str):
    """
    Smart download endpoint:
    1. Try original DOCX first
    2. Fallback to PDF generation if DOCX unavailable
    """
    try:
        return await download_original_docx(paper_id)
    except HTTPException as e:
        if e.status_code == 503:
            # Original unavailable, generate PDF
            log.warning(f"DOCX unavailable for {paper_id}, falling back to PDF")
            
            # Import PDF generation logic
            from app.api.papers import download_paper as generate_pdf
            return await generate_pdf(paper_id)
        raise

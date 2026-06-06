"""
On-Demand DOCX Download API

Extracts and serves authentic MLRIT question papers from RAR archives.
User clicks download → gets original DOCX instantly.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import tempfile
import subprocess
import asyncio
from pathlib import Path
import requests
from datetime import datetime, timedelta

from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

# Cache RAR archives for 24 hours to avoid repeated downloads
RAR_CACHE_DIR = Path(tempfile.gettempdir()) / "paperiq_rar_cache"
RAR_CACHE_DIR.mkdir(exist_ok=True)

# Cache extracted DOCX files for 1 hour
DOCX_CACHE_DIR = Path(tempfile.gettempdir()) / "paperiq_docx_cache"
DOCX_CACHE_DIR.mkdir(exist_ok=True)


def extract_rar(rar_path: str, dest_dir: str) -> bool:
    """Extract RAR using unar"""
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


def find_docx_in_directory(directory: Path, file_name: str) -> Path | None:
    """Find DOCX file in extracted directory"""
    # Exact match
    matches = list(directory.rglob(file_name))
    if matches:
        return matches[0]
    
    # Case-insensitive match
    for docx_file in directory.rglob("*.doc*"):
        if docx_file.name.lower() == file_name.lower():
            return docx_file
    
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


def download_rar(url: str, dest_path: Path) -> bool:
    """Download RAR archive"""
    try:
        log.info(f"Downloading RAR from {url}")
        response = requests.get(url, timeout=300, stream=True)
        response.raise_for_status()
        
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
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
    log.info(f"DOCX not in cache, extracting from RAR: {file_name}")
    
    # Get RAR archive URL
    rar_url = await get_rar_url_for_paper(paper)
    
    if not rar_url:
        # Fallback to PDF generation if we can't get original
        raise HTTPException(
            503,
            "Original DOCX temporarily unavailable. Please try PDF download instead."
        )
    
    # Download RAR (with caching)
    rar_name = rar_url.split('/')[-1]
    cached_rar = RAR_CACHE_DIR / rar_name
    
    if not cached_rar.exists():
        log.info(f"Downloading RAR: {rar_name}")
        if not download_rar(rar_url, cached_rar):
            raise HTTPException(503, "Failed to download archive from college website")
    else:
        log.info(f"Using cached RAR: {rar_name}")
    
    # Extract RAR to temp directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        log.info(f"Extracting RAR: {rar_name}")
        if not extract_rar(str(cached_rar), str(temp_path)):
            raise HTTPException(503, "Failed to extract archive")
        
        # Find the DOCX file
        docx_path = find_docx_in_directory(temp_path, file_name)
        
        if not docx_path:
            raise HTTPException(404, f"Question paper not found in archive: {file_name}")
        
        # Copy to cache for next time
        import shutil
        shutil.copy(str(docx_path), str(cached_docx))
        log.info(f"Cached DOCX for future requests: {file_name}")
        
        # Serve the file
        return FileResponse(
            path=str(cached_docx),
            filename=file_name,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

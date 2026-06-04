"""
Knowledge Base Builder — Automatic Discovery System

This job:
1. Downloads MLRIT R22 CSE syllabus PDF
2. Parses semesters, subjects, units, topics
3. Creates subject registry in database
4. Triggers paper discovery for all subjects
5. Runs automatically on system startup if knowledge base is empty

NO manual intervention required for MLRIT R22 CSE students.
"""
import os
import tempfile
import httpx
from typing import List, Dict, Optional
from dataclasses import dataclass

from app.database import get_db
from app.extractors.syllabus_ingester import ingest_syllabus, parse_syllabus_text
from app.extractors.extractor_factory import extract
from app.extractors.text_normalizer import normalize
from app.scrapers.colleges.mlrit import MLRITScraper
from app.jobs.scrape_job import enqueue_paper_scrape
from app.logger import get_logger

log = get_logger(__name__)

# MLRIT R22 syllabus URL (source of truth)
MLRIT_R22_SYLLABUS_URL = "https://files.mlrit.ac.in/curriculum/133-links/B.Tech-(CSE)MLR22-SYLLABUS.pdf"


@dataclass
class SubjectInfo:
    """Parsed subject metadata from syllabus"""
    subject_code: str
    subject_name: str
    semester: int
    credits: Optional[float] = None
    subject_type: Optional[str] = None  # Theory | Lab | Project


def extract_subjects_from_syllabus(pdf_path: str, regulation: str) -> List[SubjectInfo]:
    """
    Parse syllabus PDF and extract all subjects with metadata.
    
    MLRIT R22 syllabus format:
    - Each semester listed with subject codes and names
    - Format: "CS2201 Data Structures" or "22CS501 Machine Learning"
    
    Returns list of SubjectInfo objects.
    """
    log.info(f"[KnowledgeBaseBuilder] Extracting subjects from {pdf_path}")
    
    doc = extract(pdf_path)
    text = normalize(doc.raw_text)
    
    subjects: List[SubjectInfo] = []
    current_semester: Optional[int] = None
    
    # Common subject code patterns for R22
    import re
    # Matches: CS2201, 22CS501, CSE2201, etc.
    subject_pattern = re.compile(
        r'\b(?:(?:22)?(?:CS|CSE)(?:E)?[\s\-]?(\d{3,4}))\s+([A-Za-z\s&\-()]+)',
        re.IGNORECASE
    )
    semester_pattern = re.compile(r'(?:Semester|SEM)[\s\-]*([IVX]+|\d)', re.IGNORECASE)
    
    lines = text.splitlines()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect semester headers
        sem_match = semester_pattern.search(line)
        if sem_match:
            sem_str = sem_match.group(1)
            # Convert roman numerals to numbers
            roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
            current_semester = roman_map.get(sem_str.upper(), int(sem_str) if sem_str.isdigit() else None)
            log.info(f"[KnowledgeBaseBuilder] Found semester {current_semester}")
            continue
        
        # Extract subjects
        subject_match = subject_pattern.search(line)
        if subject_match and current_semester:
            code = subject_match.group(1)
            name = subject_match.group(2).strip()
            
            # Clean up name
            name = re.sub(r'\s+', ' ', name)
            name = name.strip('.-:,')
            
            # Skip if name is too short (likely parsing error)
            if len(name) < 5:
                continue
            
            # Construct full subject code
            full_code = f"CS{code}" if not code.startswith("22") else f"22CS{code}"
            
            subjects.append(SubjectInfo(
                subject_code=full_code,
                subject_name=name,
                semester=current_semester
            ))
            log.info(f"[KnowledgeBaseBuilder] Found subject: {full_code} - {name} (Sem {current_semester})")
    
    log.info(f"[KnowledgeBaseBuilder] Extracted {len(subjects)} subjects")
    return subjects


async def download_syllabus(url: str) -> str:
    """
    Download syllabus PDF to temp file.
    Returns path to downloaded file.
    """
    log.info(f"[KnowledgeBaseBuilder] Downloading syllabus from {url}")
    
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(response.content)
            temp_path = f.name
    
    log.info(f"[KnowledgeBaseBuilder] Downloaded to {temp_path}")
    return temp_path


async def build_subject_registry(
    college_name: str,
    branch_name: str,
    regulation: str,
    syllabus_url: str
) -> Dict:
    """
    Build complete subject registry from syllabus.
    
    Steps:
    1. Download syllabus PDF
    2. Parse subjects from PDF
    3. Insert college, branch, subjects into DB
    4. Ingest full syllabus for each subject
    
    Returns summary dict.
    """
    db = get_db()
    
    # Step 1: Ensure college exists
    log.info(f"[KnowledgeBaseBuilder] Ensuring college: {college_name}")
    college_result = db.table("colleges").select("id").eq("name", college_name).execute()
    
    if not college_result.data:
        college_result = db.table("colleges").insert({
            "name": college_name,
            "location": "Hyderabad"  # MLRIT default
        }).execute()
    
    college_id = college_result.data[0]["id"]
    log.info(f"[KnowledgeBaseBuilder] College ID: {college_id}")
    
    # Step 2: Ensure branch exists
    log.info(f"[KnowledgeBaseBuilder] Ensuring branch: {branch_name}")
    branch_result = db.table("branches").select("id").eq("name", branch_name).eq("college_id", college_id).execute()
    
    if not branch_result.data:
        branch_result = db.table("branches").insert({
            "name": branch_name,
            "college_id": college_id
        }).execute()
    
    branch_id = branch_result.data[0]["id"]
    log.info(f"[KnowledgeBaseBuilder] Branch ID: {branch_id}")
    
    # Step 3: Download syllabus
    syllabus_path = await download_syllabus(syllabus_url)
    
    try:
        # Step 4: Extract subjects
        subjects = extract_subjects_from_syllabus(syllabus_path, regulation)
        
        if not subjects:
            log.warning("[KnowledgeBaseBuilder] No subjects extracted — PDF format may have changed")
            return {
                "success": False,
                "error": "No subjects found in syllabus PDF",
                "subjects_created": 0
            }
        
        # Step 5: Insert subjects
        subjects_created = 0
        subject_ids = []
        
        for subject_info in subjects:
            # Check if subject already exists
            existing = db.table("subjects").select("id").eq(
                "code", subject_info.subject_code
            ).eq("college_id", college_id).execute()
            
            if existing.data:
                subject_id = existing.data[0]["id"]
                log.info(f"[KnowledgeBaseBuilder] Subject {subject_info.subject_code} already exists")
            else:
                result = db.table("subjects").insert({
                    "name": subject_info.subject_name,
                    "code": subject_info.subject_code,
                    "college_id": college_id,
                    "branch_id": branch_id,
                    "semester": subject_info.semester,
                    "regulation": regulation
                }).execute()
                subject_id = result.data[0]["id"]
                subjects_created += 1
                log.info(f"[KnowledgeBaseBuilder] Created subject {subject_info.subject_code}")
            
            subject_ids.append(subject_id)
        
        # Step 6: Ingest full syllabus
        # Parse entire PDF content and associate with first subject (master syllabus)
        # Individual subject syllabi can be added later
        log.info(f"[KnowledgeBaseBuilder] Ingesting master syllabus")
        
        try:
            syllabus_id = ingest_syllabus(
                file_path=syllabus_path,
                subject_id=subject_ids[0],  # Associate with first subject
                regulation=regulation,
                college_id=college_id,
                branch_id=branch_id,
                semester=None  # Master syllabus covers all semesters
            )
            log.info(f"[KnowledgeBaseBuilder] Master syllabus ID: {syllabus_id}")
        except Exception as e:
            log.error(f"[KnowledgeBaseBuilder] Failed to ingest syllabus: {e}")
            # Continue even if syllabus ingestion fails
        
        return {
            "success": True,
            "college_id": college_id,
            "branch_id": branch_id,
            "regulation": regulation,
            "subjects_created": subjects_created,
            "total_subjects": len(subjects),
            "subject_ids": subject_ids
        }
    
    finally:
        # Cleanup temp file
        if os.path.exists(syllabus_path):
            os.unlink(syllabus_path)


async def trigger_paper_discovery(
    college_id: str,
    branch_id: str,
    regulation: str,
    btech_year: int = 2
) -> Dict:
    """
    Trigger automatic paper discovery for all subjects.
    
    Uses MLRITScraper to:
    1. Discover all available papers from portal
    2. Download archives
    3. Extract PDFs
    4. Parse papers
    5. Store in database
    
    Returns job summary.
    """
    log.info(f"[KnowledgeBaseBuilder] Triggering paper discovery for {regulation}")
    
    try:
        # Enqueue scrape job
        job_id = await enqueue_paper_scrape(
            college_id=college_id,
            branch_id=branch_id,
            regulation=regulation,
            btech_year=btech_year,
            year_from=2021,
            year_to=2025
        )
        
        log.info(f"[KnowledgeBaseBuilder] Paper discovery job queued: {job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Paper discovery started"
        }
    
    except Exception as e:
        log.error(f"[KnowledgeBaseBuilder] Failed to trigger paper discovery: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def check_knowledge_base_exists(college_name: str, regulation: str) -> bool:
    """
    Check if knowledge base already exists for given college and regulation.
    Returns True if subjects exist, False otherwise.
    """
    db = get_db()
    
    try:
        # Check if college exists
        college_result = db.table("colleges").select("id").eq("name", college_name).execute()
        if not college_result.data:
            return False
        
        college_id = college_result.data[0]["id"]
        
        # Check if subjects exist for this regulation
        subjects_result = db.table("subjects").select("id").eq(
            "college_id", college_id
        ).eq("regulation", regulation).limit(1).execute()
        
        return len(subjects_result.data) > 0
    
    except Exception as e:
        log.error(f"[KnowledgeBaseBuilder] Error checking knowledge base: {e}")
        return False


async def auto_build_mlrit_r22_knowledge_base() -> Dict:
    """
    Automatic knowledge base builder for MLRIT R22 CSE.
    
    This runs automatically on system startup if knowledge base doesn't exist.
    
    Returns summary of operations.
    """
    college_name = "MLRIT"
    branch_name = "CSE"
    regulation = "R22"
    
    log.info(f"[KnowledgeBaseBuilder] Starting auto-build for {college_name} {regulation} {branch_name}")
    
    # Check if already exists
    exists = await check_knowledge_base_exists(college_name, regulation)
    if exists:
        log.info(f"[KnowledgeBaseBuilder] Knowledge base already exists — skipping")
        return {
            "success": True,
            "skipped": True,
            "message": "Knowledge base already exists"
        }
    
    # Build subject registry
    registry_result = await build_subject_registry(
        college_name=college_name,
        branch_name=branch_name,
        regulation=regulation,
        syllabus_url=MLRIT_R22_SYLLABUS_URL
    )
    
    if not registry_result["success"]:
        return registry_result
    
    # Trigger paper discovery
    discovery_result = await trigger_paper_discovery(
        college_id=registry_result["college_id"],
        branch_id=registry_result["branch_id"],
        regulation=regulation,
        btech_year=2
    )
    
    return {
        "success": True,
        "registry": registry_result,
        "paper_discovery": discovery_result,
        "message": f"Knowledge base built: {registry_result['total_subjects']} subjects, paper discovery started"
    }

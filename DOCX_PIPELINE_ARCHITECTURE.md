# DOCX Pipeline Architecture

## Overview
This document describes the **complete pipeline** for MLRIT official papers from crawler to user download, preserving the original DOCX format.

## Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         1. CRAWLER STAGE                              │
│  (backend/app/scrapers/colleges/mlrit_r22_crawler.py)               │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
    • Discovers MLRIT archives (.rar files) from official portal
    • Downloads archives to /tmp/paperiq_r22/{subject_code}/
    • Extracts archives using ArchiveExtractor
    • Identifies subject-specific DOCX files by filename pattern
    • Supports BOTH semesters:
      - Semester 1 (2-1): 5 subjects (DS, OOPS, DECO, SE, COSM)
      - Semester 2 (2-2): 5 subjects (BEFA, DM, DBMS, OS, STF)

┌──────────────────────────────────────────────────────────────────────┐
│                         2. INGESTION STAGE                            │
│  (backend/app/extractors/ + backend/app/parsers/)                    │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
    • extract() → Extracts raw text from DOCX (preserves formatting)
    • QuestionParser().parse() → Parses questions from text
    • extract_dynamic_marks() → Detects max marks (70 vs 75)

┌──────────────────────────────────────────────────────────────────────┐
│                      3. STORAGE STAGE                                 │
│  (Supabase Storage + PostgreSQL)                                     │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
    DUAL STORAGE STRATEGY:
    
    A. Original DOCX File:
       • Storage Path: mlrit/{year}/{subject_code}_{hash}.docx
       • Column: papers.original_storage_path
       • Purpose: User downloads (authentic source)
       • Bucket: "papers"
    
    B. Viewable PDF (Optional):
       • Storage Path: mlrit/{year}/{subject_code}_{hash}.pdf
       • Column: papers.viewable_storage_path
       • Purpose: Browser viewing (converted via LibreOffice)
       • Bucket: "papers"
       • Only created if conversion succeeds

    C. Metadata in PostgreSQL:
       • Table: papers
       • Columns: 
         - original_storage_path (DOCX URL)
         - viewable_storage_path (PDF URL, if available)
         - source_filename (original filename)
         - file_hash (SHA256 deduplication)
         - raw_text (extracted content)
         - subject_id, exam_year, exam_month, regulation, etc.

┌──────────────────────────────────────────────────────────────────────┐
│                      4. BACKEND API STAGE                             │
│  (backend/app/api/download.py)                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
    TWO ENDPOINTS:
    
    GET /papers/{paper_id}/download
    • Fetches papers.original_storage_path
    • Downloads ORIGINAL DOCX from Supabase Storage
    • Returns as attachment with correct filename
    • MIME: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    
    GET /papers/{paper_id}/view
    • Fetches papers.viewable_storage_path
    • Downloads VIEWABLE PDF from Supabase Storage
    • Returns as inline (browser display)
    • MIME: application/pdf

┌──────────────────────────────────────────────────────────────────────┐
│                      5. FRONTEND STAGE                                │
│  (frontend/src/pages/PaperView.tsx)                                 │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
    • Displays paper metadata
    • "View Paper" button → /papers/{id}/view (PDF in browser)
    • "Download Original" button → /papers/{id}/download (DOCX file)

┌──────────────────────────────────────────────────────────────────────┐
│                      6. USER EXPERIENCE                               │
└──────────────────────────────────────────────────────────────────────┘
    
    Student receives:
    ✅ Authentic MLRIT DOCX file (original format)
    ✅ Correct filename (e.g., "AI_ML_May_2024.docx")
    ✅ Full content (no extraction artifacts)
    ✅ Optional PDF preview in browser
```

## Critical Rules (DO NOT VIOLATE)

### ✅ **ALWAYS PRESERVE**
1. **Original DOCX files** - Never discard, never convert-only
2. **Source URLs** - Store original archive URL in `papers.original_url`
3. **File hashes** - SHA256 for deduplication
4. **Dual storage paths**:
   - `original_storage_path` → DOCX (mandatory)
   - `viewable_storage_path` → PDF (optional, for viewing only)

### ❌ **NEVER DO**
1. ~~Convert DOCX to PDF and discard DOCX~~ → Keep BOTH
2. ~~Store only extracted text~~ → Store full binary file + text
3. ~~Use generic storage_path~~ → Use explicit original_storage_path/viewable_storage_path
4. ~~Download PDFs from MLRIT~~ → MLRIT only provides DOCX in archives
5. ~~Extract .rar on user's device~~ → Extract server-side during ingestion

## Database Schema

```sql
-- papers table (relevant columns)
CREATE TABLE papers (
    id UUID PRIMARY KEY,
    
    -- File Storage (NEW: dual-path system)
    original_storage_path TEXT,  -- Always DOCX (user downloads this)
    viewable_storage_path TEXT,  -- PDF if available (browser views this)
    storage_path TEXT,           -- DEPRECATED (legacy fallback)
    storage_bucket TEXT DEFAULT 'papers',
    
    -- File Metadata
    source_filename TEXT,        -- Original name (e.g., "AI_ML_May_2024.docx")
    file_hash TEXT UNIQUE,       -- SHA256 for deduplication
    file_type TEXT,              -- "docx", "doc", "pdf"
    file_size_bytes BIGINT,
    
    -- Source Tracking
    original_url TEXT,           -- Archive URL (e.g., .rar file)
    source_url TEXT,             -- Same as original_url
    
    -- Extracted Content
    raw_text TEXT,               -- For search/parsing
    extraction_status TEXT,      -- "success", "failed"
    
    -- Academic Metadata
    subject_id UUID REFERENCES subjects(id),
    college_id UUID REFERENCES colleges(id),
    exam_year INTEGER,
    exam_month TEXT,
    exam_type TEXT,              -- "Regular", "Supplementary"
    semester INTEGER,
    regulation TEXT,             -- "R22", "R18", etc.
    max_evaluation_marks FLOAT,  -- 70 or 75 (dynamic detection)
    
    -- Questions (parsed separately)
    -- See questions table for parsed questions
);
```

## File Path Conventions

### Storage Paths in Supabase
```
papers/
└── mlrit/
    └── {year}/
        └── {subject_code}_{hash}.{ext}

Example:
  papers/mlrit/2024/AI_ML_a3f5d8e9.docx  ← original_storage_path
  papers/mlrit/2024/AI_ML_a3f5d8e9.pdf   ← viewable_storage_path
```

### Local Extraction Paths (Temporary)
```
/tmp/paperiq_r22/
└── {subject_code}/
    ├── {archive_file}.rar
    └── extracted_{year}_{month}/
        └── {original_docx_files}
```

## Deduplication Strategy

```python
# Before inserting new paper:
file_hash = sha256_file(fpath)  # SHA256 of DOCX binary

existing = db.table("papers")\
    .select("id")\
    .eq("file_hash", file_hash)\
    .execute()

if existing.data:
    return "cached"  # Skip re-ingestion
```

## Conversion Logic (DOCX → PDF)

**Purpose**: Create viewable PDF ONLY for browser display  
**Tool**: LibreOffice headless (`soffice`)  
**Status**: Best-effort (failure is non-fatal)

```python
if file_ext in [".doc", ".docx"]:
    try:
        subprocess.run([
            "soffice", "--headless", "--convert-to", "pdf",
            fpath, "--outdir", os.path.dirname(fpath)
        ], check=True, timeout=30)
        
        if os.path.exists(pdf_path):
            # Upload PDF as viewable_storage_path
            upload_to_supabase(pdf_path, viewable_storage_path)
        else:
            log.warning("PDF conversion failed - no output file")
            # Continue anyway - original DOCX is still available
    except Exception as e:
        log.warning(f"PDF conversion failed: {e}")
        # Continue anyway - original DOCX is still available
```

**Fallback**: If conversion fails, `viewable_storage_path` = `original_storage_path` (view DOCX directly)

## API Endpoints

### Download Original DOCX
```http
GET /api/papers/{paper_id}/download

Response:
  Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
  Content-Disposition: attachment; filename="AI_ML_May_2024.docx"
  Body: [binary DOCX data]
```

### View PDF in Browser
```http
GET /api/papers/{paper_id}/view

Response:
  Content-Type: application/pdf
  Content-Disposition: inline; filename="AI_ML_May_2024.pdf"
  Body: [binary PDF data]
```

## Error Handling

| Stage | Error | Handling |
|-------|-------|----------|
| Archive Download | Network failure | Log warning, skip archive |
| Archive Extraction | Corrupt .rar | Log warning, skip archive |
| Text Extraction | Unsupported format | Log warning, skip file |
| PDF Conversion | soffice timeout | Log warning, use DOCX as viewable |
| Storage Upload | Quota exceeded | Fail loudly, halt ingestion |
| Database Insert | Duplicate hash | Log info, mark as cached |

## Crawler API

### Crawl Single Subject
```python
from app.scrapers.colleges.mlrit_r22_crawler import crawl_r22_subject

result = await crawl_r22_subject(
    subject_code="A6CS05",  # Data Structures
    college_id=MLRIT_COLLEGE_ID,
    semester=1,  # Optional: override registry semester
    year_from=2021,
    year_to=2025,
    force_refresh=False,
)
# Returns: {subject_code, semester, papers_found, papers_new, papers_cached, questions_stored}
```

### Crawl Entire Semester
```python
from app.scrapers.colleges.mlrit_r22_crawler import crawl_r22_semester

result = await crawl_r22_semester(
    semester=1,  # 1 for 2-1, 2 for 2-2
    college_id=MLRIT_COLLEGE_ID,
    year_from=2021,
    year_to=2025,
    force_refresh=False,
)
# Returns: {semester, total_subjects, successful, failed, subjects: [...]}
```

## Monitoring & Verification

### Check Pipeline Health
```bash
cd backend

# 1. Crawl both semesters (all 10 subjects)
python scripts/crawl_r22_all.py

# 2. Crawl single semester
python scripts/crawl_r22_all.py --semester 1  # 2-1 only
python scripts/crawl_r22_all.py --semester 2  # 2-2 only

# 3. Crawl single subject
python scripts/crawl_r22_all.py --subject A6CS05

# 4. Force refresh (re-process cached papers)
python scripts/crawl_r22_all.py --force-refresh

# 5. Custom year range
python scripts/crawl_r22_all.py --year-from 2023 --year-to 2025

# 6. Check storage paths in DB
psql $DATABASE_URL -c "
  SELECT 
    s.code,
    s.name,
    p.semester,
    p.source_filename,
    p.original_storage_path,
    p.viewable_storage_path,
    p.file_type,
    p.exam_year,
    p.exam_month
  FROM papers p
  JOIN subjects s ON p.subject_id = s.id
  WHERE p.regulation = 'R22'
  ORDER BY p.semester, s.code, p.exam_year DESC, p.exam_month DESC
  LIMIT 20;
"

# 7. Verify Supabase storage
# Login to Supabase dashboard → Storage → papers bucket → mlrit/2024/
```

### Download Test
```bash
# From frontend:
curl http://localhost:5173/api/papers/{paper_id}/download -o test.docx
file test.docx  # Should show: Microsoft Word 2007+

# From production:
curl https://paperiq.com/api/papers/{paper_id}/download -o test.docx
```

## Common Issues & Solutions

### Issue: "Original document not available in storage"
**Cause**: Paper was ingested before storage preservation was enabled  
**Solution**: Re-run crawler with `force_refresh=True`

### Issue: PDF conversion fails silently
**Cause**: LibreOffice not installed or timeout  
**Solution**: 
```bash
# Install LibreOffice
brew install --cask libreoffice  # macOS
apt install libreoffice --headless  # Linux

# Verify
soffice --version
```

### Issue: Download endpoint returns 404
**Cause**: `original_storage_path` is NULL or file deleted from storage  
**Solution**: Check DB and re-upload file if needed

## R22 Subject Registry

### Semester 1 (2-1) Subjects
| Code | Name | Short |
|------|------|-------|
| A6CS05 | Data Structures | DS |
| A6IT02 | Object Oriented Programming through Java | OOPS |
| A6CS02 | Digital Electronics and Computer Organization | DECO |
| A6CS07 | Software Engineering | SE |
| A6BS03 | Computer Oriented Statistical Methods | COSM |

### Semester 2 (2-2) Subjects
| Code | Name | Short |
|------|------|-------|
| A6HS08 | Business Economics and Financial Analysis | BEFA |
| A6CS08 | Discrete Mathematics | DM |
| A6CS09 | Database Management Systems | DBMS |
| A6CS11 | Operating System | OS |
| A6CS13 | Software Testing Fundamentals | STF |

**Total: 10 subjects across 2 semesters**

## Related Files

- **Crawler**: `backend/app/scrapers/colleges/mlrit_r22_crawler.py`
- **Archive Definitions**: `backend/app/scrapers/colleges/mlrit_r22.py`
- **Crawl Script**: `backend/scripts/crawl_r22_all.py`
- **Extraction**: `backend/app/extractors/extractor_factory.py`
- **Parser**: `backend/app/parsers/question_parser.py`
- **Storage API**: `backend/app/api/download.py`
- **Database Models**: `backend/app/models/paper.py`
- **Frontend View**: `frontend/src/pages/PaperView.tsx`

## Version History

- **v1.0** (Pre-June 2024): Single `storage_path`, no original file preservation
- **v2.0** (June 2024): Dual-path system (`original_storage_path` + `viewable_storage_path`)
- **v2.1** (June 2026): Dynamic marks detection, improved subject mapping
- **v2.2** (Current): Full 2-1 and 2-2 semester support (10 subjects total)

---

**Last Updated**: June 9, 2026  
**Maintained By**: PaperIQ Engineering  
**Status**: ✅ Production-Ready

## Quick Start

```bash
# Navigate to backend
cd backend

# Crawl all R22 papers (both semesters)
python scripts/crawl_r22_all.py

# Expected output:
# ✓ Semester 1: 5 subjects
# ✓ Semester 2: 5 subjects
# ✓ Total: ~50-100 papers ingested
# ✓ Questions parsed and stored
```

# PaperIQ — Architecture Audit: Regulation & Exam Classification
**Date:** June 5, 2026  
**Auditor:** Kiro System  
**Scope:** Automatic syllabus discovery, exam classification (Mid/Semester, Regular/Supplementary)

---

## 🎯 Intended MVP Architecture

### Core User Flow (Target)
```
User selects:
├── College: MLRIT
├── Branch: CSE
├── Regulation: R22
├── Subject: Discrete Mathematics
├── Exam Category: Semester (or Mid)
├── Exam Attempt: Regular (or Supplementary)
└── Year Range: 2021-2025

System automatically:
1. Discovers official syllabus source for R22 CSE Discrete Math
2. Downloads syllabus
3. Extracts units and topics
4. Finds matching question papers (Semester + Regular only)
5. Downloads papers
6. Extracts and parses questions
7. Maps questions to syllabus topics
8. Generates analysis
9. Generates study plan
10. Calculates readiness score

Manual syllabus upload = fallback ONLY when auto-discovery fails
```

---

## ✅ What IS Implemented

### 1. Database Schema — Partial Support

**`papers` table** (lines 51-85 in `001_initial_schema.sql`):
```sql
exam_type           TEXT           -- EXISTS: stores "Regular" | "Supplementary"
semester            SMALLINT       -- EXISTS: stores semester number
regulation          TEXT           -- EXISTS: stores regulation code (e.g., "R22")
btech_year          SMALLINT       -- EXISTS: B.Tech year (1-4)
exam_month          TEXT           -- EXISTS: "February", "August", etc.
exam_year           SMALLINT       -- EXISTS: 2024, 2025, etc.
```

**✅ EXISTS:**
- Regulation tracking (`regulation` column)
- Exam Attempt classification (`exam_type`: Regular/Supplementary)

**❌ MISSING:**
- Exam Category classification (Mid vs Semester) — no `exam_category` column
- No enum/constraint enforcement on `exam_type`
- No index on `exam_type` for filtering

**`subjects` table** (lines 24-32):
```sql
regulation          TEXT           -- EXISTS: links subject to regulation
semester            SMALLINT       -- EXISTS: which semester subject is taught
```

### 2. Scraper — Exam Attempt Detection Only

**Current logic** (`backend/app/scrapers/playwright_scraper.py:96-98`):
```python
exam_type = "Supplementary" if any(
    w in label.lower() for w in ["supply", "supple", "supplementary"]
) else "Regular"
```

**✅ WORKS:**
- Detects Regular vs Supplementary from portal link labels
- Both `PlaywrightScraper` and `RequestsScraper` implement this

**❌ MISSING:**
- No detection of Mid vs Semester exam category
- Detection is keyword-based (fragile — if label changes, breaks)
- No validation against known exam schedules

### 3. API — Limited Filtering

**`GET /papers`** (`backend/app/api/papers.py:14-24`):
```python
def list_papers(
    subject_id: Optional[str] = None,
    year: Optional[int] = None,
    exam_type: Optional[str] = None,      # ✅ CAN filter Regular/Supplementary
    regulation: Optional[str] = None,     # ✅ CAN filter by regulation
    college_id: Optional[str] = None,
):
```

**✅ EXISTS:**
- Filter by `exam_type` (Regular/Supplementary)
- Filter by `regulation`

**❌ MISSING:**
- No filter parameter for exam category (Mid/Semester)
- No combined filter endpoint like `/papers?exam_category=Semester&exam_attempt=Regular`

**`POST /analysis/run`** (`backend/app/api/analysis.py:39-46`):
```python
class RunAnalysisRequest(BaseModel):
    subject_id: str
    regulation: str
    branch_id: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
```

**❌ MISSING:**
- No `exam_category` parameter (cannot analyze Mid-only)
- No `exam_attempt` parameter (cannot analyze Regular-only)
- Analysis runs on ALL papers regardless of type

### 4. Syllabus Workflow — Manual Upload ONLY

**Current implementation** (`backend/app/api/extract.py:56-108`):
```python
@router.post("/syllabus/upload")  # Manual upload endpoint
async def upload_syllabus(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    regulation: str = Form(...),
):
```

**`syllabi` table** (line 176):
```sql
source_type   TEXT DEFAULT 'upload'  -- Always 'upload', never 'auto'
```

**✅ EXISTS:**
- Manual PDF/DOCX upload
- Text extraction and unit/topic parsing
- Storage in `syllabi` + `syllabus_topics` tables

**❌ MISSING:**
- **Zero automatic syllabus discovery**
- No syllabus source registry (no known URLs for MLRIT R22 syllabi)
- No scraper for curriculum documents
- `source_type` is hardcoded to `'upload'` — no `'auto'` path exists
- **Syllabus upload is currently the PRIMARY workflow, not fallback**

### 5. Question Parsing — No Exam Category Extraction

**Current logic** (`backend/app/parsers/question_parser.py`):
- Extracts: question number, part, marks, unit, CO, Bloom level
- Does NOT extract exam category (Mid/Semester) from paper header

**Paper header example** (from test file):
```
II B.Tech I Semester Regular Examinations, February-2024
```

This header CONTAINS "Semester" but it's not being captured as metadata.

---

## ❌ What IS NOT Implemented

### 1. Exam Category Classification (Mid vs Semester)

**Database:**
- No `exam_category` column in `papers` table
- Cannot store whether a paper is Mid-1, Mid-2, or Semester

**Scraper:**
- No logic to detect "Mid-I", "Mid-II", "Semester" from portal labels
- MLRIT portal structure unclear — needs investigation

**API:**
- No filter parameter for exam category
- Cannot query "give me only Semester papers"

**Analysis:**
- Cannot generate "Mid-only analysis" or "Semester-only analysis"
- Current analysis mixes all exam types

### 2. Combined Filter Support

**User cannot select:**
```
Exam Category: Semester
Exam Attempt: Regular
```

**Current workaround:**
- Can filter by `exam_type=Regular`, but gets BOTH Mid and Semester papers

### 3. Automatic Syllabus Discovery

**Zero implementation:**
- No registry of MLRIT syllabus URLs
- No syllabus scraper
- No automatic download based on regulation + branch + subject
- No fallback chain: `auto_discover() → scrape() → manual_upload()`

**Impact:**
- Students MUST manually hunt and upload syllabus documents
- Violates MVP principle: "automatic end-to-end"

### 4. Regulation-Aware Scraping

**Current scraper** (`MLRITScraper`):
```python
async def list_papers(
    self,
    portal_url: str = MLRIT_PORTAL_URL,
    btech_year: int = 2,
    year_from: int = 2021,
    year_to: int = 2025,
) -> List[PaperMeta]:
```

**❌ MISSING parameters:**
- `regulation: str` — cannot filter "R22 papers only"
- `branch: str` — cannot filter "CSE only"
- `exam_category: str` — cannot request "Semester only"
- `exam_attempt: str` — cannot request "Regular only"

**Current behavior:**
- Scrapes ALL papers in year range
- User must filter AFTER download (wasteful)

---

## 🔍 MLRIT Syllabus Sources — Investigation Required

**Official MLRIT websites:**
1. Main site: `https://mlrinstitutions.ac.in/`
2. Exam portal: `https://exams.mlrinstitutions.ac.in/`
3. Academic portal: Unknown (needs reconnaissance)

**Typical syllabus locations at Indian universities:**
- `/academics/regulations/r22/syllabus/cse/`
- `/downloads/curriculum/r22/`
- Embedded PDFs in exam portal
- Separate document repository

**Action required:**
- Manual inspection of MLRIT website structure
- Identify regulation-wise syllabus archive
- Determine URL pattern: `{base_url}/r22/cse/discrete-mathematics.pdf`
- Check if syllabi are per-subject or per-semester bundles

---

## 📊 Gap Summary Table

| Feature | Status | Database | Scraper | API | Frontend |
|---------|--------|----------|---------|-----|----------|
| **Regulation tracking** | ✅ Implemented | `papers.regulation` | Extracted from portal | Filter param exists | Needs dropdown |
| **Exam Attempt (R/S)** | ✅ Implemented | `papers.exam_type` | Keyword detection | `exam_type` filter | Needs dropdown |
| **Exam Category (Mid/Sem)** | ❌ Missing | No column | No detection | No filter | No UI |
| **Auto syllabus discovery** | ❌ Missing | `source_type='upload'` only | No scraper | No endpoint | Manual upload only |
| **Combined filter (Sem+R)** | ❌ Missing | N/A | N/A | No combined param | No UI |
| **Regulation-based scraping** | ❌ Missing | N/A | No reg filter | No scrape param | No UI |

---

## 📐 Required Architecture Changes

### 1. Database Schema Changes

**Add `exam_category` to `papers` table:**
```sql
ALTER TABLE papers ADD COLUMN exam_category TEXT;
CREATE INDEX idx_papers_exam_category ON papers(exam_category);

-- Add constraint
ALTER TABLE papers ADD CONSTRAINT chk_exam_category 
  CHECK (exam_category IN ('Mid-1', 'Mid-2', 'Semester', NULL));

-- Add constraint for exam_type
ALTER TABLE papers ADD CONSTRAINT chk_exam_type 
  CHECK (exam_type IN ('Regular', 'Supplementary', NULL));
```

**Add `syllabus_sources` table:**
```sql
CREATE TABLE syllabus_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID REFERENCES colleges(id) ON DELETE CASCADE,
  regulation    TEXT NOT NULL,
  branch_id     UUID REFERENCES branches(id),
  base_url      TEXT,
  url_pattern   TEXT,  -- e.g., "{base_url}/{regulation}/{branch}/{subject_code}.pdf"
  scraper_type  TEXT DEFAULT 'direct_download',
  is_active     BOOLEAN DEFAULT TRUE,
  last_checked  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, regulation, branch_id)
);
```

**Update `syllabi` table:**
```sql
ALTER TABLE syllabi ALTER COLUMN source_type TYPE TEXT;
-- Now allows: 'upload' | 'auto_discovered' | 'scraped' | 'manual_url'
```

### 2. Scraper Changes

**Enhance `PaperMeta` model:**
```python
class PaperMeta(BaseModel):
    url: str
    file_name: str
    exam_year: int
    exam_month: str
    exam_type: str              # Regular | Supplementary
    exam_category: str          # NEW: Mid-1 | Mid-2 | Semester
    btech_year: int
    regulation: str             # NEW: extracted from label
    label: str
    archive_type: str = "rar"
```

**Enhance `MLRITScraper.list_papers()`:**
```python
async def list_papers(
    self,
    portal_url: str = MLRIT_PORTAL_URL,
    btech_year: int = 2,
    year_from: int = 2021,
    year_to: int = 2025,
    regulation: Optional[str] = None,      # NEW: filter R22, R20, etc.
    branch: Optional[str] = None,          # NEW: filter CSE, ECE, etc.
    exam_category: Optional[str] = None,   # NEW: Mid-1, Mid-2, Semester
    exam_attempt: Optional[str] = None,    # NEW: Regular, Supplementary
) -> List[PaperMeta]:
```

**Add detection logic in scraper:**
```python
def _detect_exam_category(label: str) -> str:
    """Extract exam category from portal label."""
    label_lower = label.lower()
    if 'mid-1' in label_lower or 'mid 1' in label_lower or 'mid-i' in label_lower:
        return 'Mid-1'
    elif 'mid-2' in label_lower or 'mid 2' in label_lower or 'mid-ii' in label_lower:
        return 'Mid-2'
    elif 'semester' in label_lower or 'sem ' in label_lower:
        return 'Semester'
    else:
        return 'Unknown'

def _detect_regulation(label: str) -> Optional[str]:
    """Extract regulation code from label."""
    # Pattern: R22, R20, R18, R16, etc.
    match = re.search(r'\b(R\d{2})\b', label, re.I)
    return match.group(1).upper() if match else None
```

**Create `SyllabusScraper` class:**
```python
class SyllabusScraper:
    """
    Discovers and downloads syllabi for a given regulation + branch + subject.
    """
    async def discover_syllabus(
        self,
        college_id: str,
        regulation: str,
        branch: str,
        subject_code: Optional[str] = None,
    ) -> Optional[str]:
        """
        Returns URL of syllabus PDF/DOCX if found, else None.
        """
        pass

    async def download_syllabus(
        self,
        url: str,
        dest_path: str,
    ) -> str:
        """Downloads syllabus file and returns local path."""
        pass
```

### 3. API Changes

**Add filter parameters to `/papers`:**
```python
@router.get("/papers")
async def list_papers(
    subject_id: Optional[str] = None,
    year: Optional[int] = None,
    exam_type: Optional[str] = None,
    exam_category: Optional[str] = None,    # NEW
    regulation: Optional[str] = None,
    college_id: Optional[str] = None,
):
```

**Add filter parameters to `/analysis/run`:**
```python
class RunAnalysisRequest(BaseModel):
    subject_id: str
    regulation: str
    branch_id: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    exam_category: Optional[str] = None     # NEW: "Mid-1" | "Mid-2" | "Semester" | "all"
    exam_attempt: Optional[str] = None      # NEW: "Regular" | "Supplementary" | "all"
```

**Add automatic syllabus discovery endpoint:**
```python
@router.post("/syllabus/discover")
async def discover_syllabus(
    college_id: str = Form(...),
    regulation: str = Form(...),
    branch_id: str = Form(...),
    subject_id: str = Form(...),
):
    """
    Attempts to automatically discover and download syllabus.
    Falls back to manual upload if discovery fails.
    """
    scraper = SyllabusScraper()
    url = await scraper.discover_syllabus(college_id, regulation, branch_id, subject_id)
    
    if not url:
        return {
            "success": False,
            "data": {
                "message": "Automatic discovery failed. Please upload syllabus manually.",
                "fallback_endpoint": "/syllabus/upload"
            }
        }
    
    # Download and ingest
    local_path = await scraper.download_syllabus(url, dest_path)
    syllabus_id = ingest_syllabus(local_path, subject_id, regulation, source_type="auto_discovered")
    
    return {
        "success": True,
        "data": {
            "syllabus_id": syllabus_id,
            "source_url": url,
            "source_type": "auto_discovered"
        }
    }
```

### 4. Frontend Changes

**Add filter dropdowns in Search page:**
```tsx
<select name="exam_category">
  <option value="">All Categories</option>
  <option value="Mid-1">Mid-1</option>
  <option value="Mid-2">Mid-2</option>
  <option value="Semester">Semester</option>
</select>

<select name="exam_attempt">
  <option value="">All Attempts</option>
  <option value="Regular">Regular</option>
  <option value="Supplementary">Supplementary</option>
</select>

<select name="regulation">
  <option value="">All Regulations</option>
  <option value="R22">R22 (2022-onwards)</option>
  <option value="R20">R20 (2020-2022)</option>
  <option value="R18">R18 (2018-2020)</option>
</select>
```

**Automatic syllabus discovery UI:**
```tsx
// Before showing manual upload form:
const handleAutoDiscover = async () => {
  const result = await fetch('/api/v1/syllabus/discover', {
    method: 'POST',
    body: JSON.stringify({ college_id, regulation, branch_id, subject_id })
  })
  
  if (result.success) {
    toast.success('Syllabus automatically discovered!')
  } else {
    setShowManualUpload(true)
    toast.info('Could not auto-discover. Please upload manually.')
  }
}
```

---

## 🚀 Implementation Estimate

### Phase 1: Exam Category Classification (2-3 days)
- [ ] Add `exam_category` column to DB (+ migration)
- [ ] Update `PaperMeta` model
- [ ] Add detection logic in scrapers
- [ ] Backfill existing papers (parse from `title` field)
- [ ] Add API filter parameter
- [ ] Add frontend dropdown
- [ ] Test end-to-end

### Phase 2: Combined Filtering (1 day)
- [ ] Update analysis job to respect `exam_category` + `exam_attempt`
- [ ] Update planner to filter papers by category
- [ ] Update frontend analysis form
- [ ] Test all combinations

### Phase 3: MLRIT Syllabus Discovery (3-4 days)
- [ ] **Reconnaissance**: manually browse MLRIT site, find syllabus URLs
- [ ] Document URL patterns per regulation
- [ ] Create `syllabus_sources` table
- [ ] Seed MLRIT R22 sources
- [ ] Implement `SyllabusScraper` class
- [ ] Add `/syllabus/discover` endpoint
- [ ] Update frontend: try auto-discover first, fallback to upload
- [ ] Test with R22 CSE subjects

### Phase 4: Regulation-Aware Scraping (2 days)
- [ ] Add `regulation` parameter to scraper
- [ ] Add regulation detection logic
- [ ] Update scrape trigger API
- [ ] Test scraping "R22 papers only"

**Total estimate: 8-10 days for full MVP-compliant implementation**

---

## 🎯 Recommended Implementation Order

1. **Phase 1 first** — unlocks ability to filter Mid vs Semester
2. **Phase 3 next** — biggest MVP gap (automatic syllabus)
3. **Phase 2 next** — leverages Phase 1 work
4. **Phase 4 last** — optimization, not blocker

---

## 🔴 Critical Findings

1. **Syllabus upload is currently PRIMARY workflow, not fallback**
   - Violates MVP design principle
   - Students must manually hunt academic documents
   - Should be: auto-discover → manual upload (fallback)

2. **No Mid vs Semester classification**
   - Analysis mixes both exam types
   - Cannot generate "Mid-only study plan"
   - Header contains "Semester" but it's not captured

3. **Regulation filtering incomplete**
   - Database has `regulation` column
   - Scrapers don't use it for pre-filtering
   - All papers downloaded, then filtered (wasteful)

4. **MLRIT syllabus sources unknown**
   - Zero reconnaissance done
   - No URL registry
   - Cannot implement auto-discovery without this data

---

## ✅ Next Steps

1. **Approve architecture changes** (this document)
2. **MLRIT syllabus reconnaissance** — find official sources
3. **Implement Phase 1** (exam category classification)
4. **Implement Phase 3** (automatic syllabus discovery)
5. **Update frontend** to match new capabilities
6. **Test end-to-end** with real MLRIT R22 CSE workflow

---

**End of Audit**

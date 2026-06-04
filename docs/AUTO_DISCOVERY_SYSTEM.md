# PaperIQ Automatic Discovery System

## Overview

PaperIQ automatically builds its knowledge base on first startup. MLRIT R22 CSE students never manually upload syllabi or papers.

## System Components

### 1. Knowledge Base Builder

**File:** `backend/app/jobs/knowledge_base_builder.py`

**What it does:**
- Downloads MLRIT R22 CSE syllabus PDF from official source
- Parses all subjects, codes, semesters
- Creates database records automatically
- Triggers paper discovery pipeline

**When it runs:**
- On system startup (if knowledge base doesn't exist)
- Manually via `/api/v1/admin/knowledge-base/build`

### 2. Paper Discovery Pipeline

**Files:**
- `backend/app/scrapers/colleges/mlrit.py`
- `backend/app/jobs/scrape_job.py`

**What it does:**
- Crawls MLRIT exam portal: https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html
- Discovers ZIP archives and standalone PDFs
- Downloads and extracts papers
- Classifies by subject, regulation, exam type
- Stores metadata in database

**Runs automatically after knowledge base build.**

### 3. Simplified User Workflow

#### Onboarding (One Time)

**Endpoint:** `POST /api/v1/profile/onboarding`

**User provides:**
```json
{
  "user_id": "user-123",
  "current_semester": 3,          // 2-1 → 3, 2-2 → 4
  "current_cgpa": 7.5,
  "backlogs_count": 1,
  "upcoming_exam_type": "Mid-1",
  "study_hours_per_day": 3
}
```

**System auto-infers:**
- College: MLRIT (fixed)
- Branch: CSE (fixed for MVP)
- Regulation: R22 (from semester)
- Year: 2 (from semester)
- Skill level: Beginner/Intermediate/Advanced (from CGPA + backlogs)
- Target CGPA: current + 0.5

**What user NEVER provides:**
- College ID
- Branch ID
- Regulation dropdown
- Subject IDs
- Skill level dropdown
- Manual uploads

#### Normal Analysis Workflow

**Step 1: Get available subjects**

`GET /api/v1/profile/{user_id}/subjects`

Returns subjects for user's semester, auto-filtered by regulation.

**Step 2: Select subject and request analysis**

`POST /api/v1/analysis/simple`

```json
{
  "user_id": "user-123",
  "subject_id": "subject-uuid",
  "exam_category": "Mid-1",
  "exam_attempt": "Regular"
}
```

**System auto-infers:**
- College, branch, regulation (from profile)
- Year range: last 5 years
- Papers to analyze (from database)

**Returns:**
```json
{
  "report_id": "report-uuid",
  "status": "processing"
}
```

**Step 3: Poll for results**

`GET /api/v1/analysis/{report_id}`

Returns complete analysis when ready.

## API Endpoints

### Admin Endpoints

#### Check Knowledge Base Status

```bash
GET /api/v1/admin/knowledge-base/status?college=MLRIT&regulation=R22
```

Returns whether knowledge base exists.

#### Build Knowledge Base

```bash
POST /api/v1/admin/knowledge-base/build
```

Triggers automatic build:
1. Downloads syllabus
2. Parses subjects
3. Creates DB records
4. Starts paper discovery

Safe to call multiple times — skips if already exists.

#### Trigger Paper Discovery

```bash
POST /api/v1/admin/knowledge-base/discover-papers
```

Body:
```json
{
  "college_id": "college-uuid",
  "branch_id": "branch-uuid",
  "regulation": "R22",
  "btech_year": 2
}
```

Manually triggers paper discovery. Use if initial discovery failed.

### User Endpoints

#### Complete Onboarding

```bash
POST /api/v1/profile/onboarding
```

Body:
```json
{
  "user_id": "user-123",
  "current_semester": 3,
  "current_cgpa": 7.5,
  "backlogs_count": 1,
  "upcoming_exam_type": "Mid-1",
  "study_hours_per_day": 3
}
```

#### Get User Subjects

```bash
GET /api/v1/profile/{user_id}/subjects
```

Returns subjects for user's semester.

#### Run Simplified Analysis

```bash
POST /api/v1/analysis/simple
```

Body:
```json
{
  "user_id": "user-123",
  "subject_id": "subject-uuid",
  "exam_category": "Mid-1",
  "exam_attempt": "Regular"
}
```

## Database Schema

### New Tables

#### `syllabus_sources`

Tracks known syllabus URLs for automatic discovery.

```sql
CREATE TABLE syllabus_sources (
  id            UUID PRIMARY KEY,
  college_id    UUID REFERENCES colleges(id),
  regulation    TEXT NOT NULL,
  branch_id     UUID REFERENCES branches(id),
  base_url      TEXT,
  scraper_type  TEXT DEFAULT 'direct_download',
  is_active     BOOLEAN DEFAULT TRUE,
  last_checked  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `learner_profiles`

Auto-detected learner characteristics.

```sql
CREATE TABLE learner_profiles (
  id                      UUID PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) UNIQUE,
  college_id              UUID REFERENCES colleges(id),
  branch_id               UUID REFERENCES branches(id),
  regulation              TEXT,
  current_semester        SMALLINT,
  current_cgpa            FLOAT,
  target_cgpa             FLOAT,
  study_hours_per_day     FLOAT,
  
  -- Auto-detected
  detected_skill_level    TEXT,
  consistency_score       FLOAT,
  learning_pace           TEXT,
  
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### Updated Tables

#### `papers`

Added exam filtering columns:

```sql
ALTER TABLE papers ADD COLUMN exam_category TEXT;
ALTER TABLE papers ADD CONSTRAINT chk_exam_category 
  CHECK (exam_category IN ('Mid-1', 'Mid-2', 'Semester', NULL));
```

#### `syllabi`

Added source type for auto-discovery:

```sql
ALTER TABLE syllabi ADD CONSTRAINT chk_source_type 
  CHECK (source_type IN ('upload', 'auto_discovered', 'scraped', 'manual_url'));
```

## Startup Sequence

1. FastAPI starts
2. Admin routes registered
3. Startup hook fires
4. Check if knowledge base exists
5. If not exists:
   - Download MLRIT R22 syllabus
   - Parse subjects
   - Insert into database
   - Queue paper discovery job
6. API ready for requests

## Fallback Workflow

If automatic discovery fails, admin can:

1. Check knowledge base status
2. Manually trigger build via `/admin/knowledge-base/build`
3. Manually trigger paper discovery
4. Check logs for errors

Normal users never see fallbacks.

## Success Criteria

✅ New MLRIT R22 CSE student can:
1. Complete onboarding (no dropdowns, no uploads)
2. Get list of subjects for their semester
3. Select subject + exam type
4. Get analysis automatically

✅ System automatically:
1. Downloads syllabus
2. Discovers papers
3. Classifies papers
4. Maps to subjects
5. Generates analysis

## Implementation Status

### Completed
- [x] Knowledge base builder
- [x] Syllabus parser
- [x] Subject registry creator
- [x] Simplified onboarding API
- [x] Simplified analysis API
- [x] User subjects endpoint
- [x] Admin control endpoints
- [x] Startup hook
- [x] Database migrations

### Next Steps
- [ ] Test end-to-end workflow
- [ ] Add paper parsing integration
- [ ] Add question extraction integration
- [ ] Frontend: simplified onboarding form
- [ ] Frontend: subject selector
- [ ] Frontend: automatic context display

## Configuration

### Environment Variables

```bash
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# LLM (for analysis)
GROQ_API_KEY=your-groq-key

# Scraper settings
SCRAPER_DOWNLOAD_DIR=./tmp/downloads
```

### Feature Flags

None required — automatic discovery is always enabled.

## Monitoring

### Logs to watch

```bash
# Knowledge base build
[KnowledgeBaseBuilder] Starting auto-build
[KnowledgeBaseBuilder] Downloaded syllabus
[KnowledgeBaseBuilder] Extracted N subjects
[KnowledgeBaseBuilder] Master syllabus ID: X

# Paper discovery
[MLRITScraper] Total archives discovered: N
[ScrapeJob] Processing archive: filename
[ScrapeJob] Extracted N PDFs
```

### Health checks

```bash
# Check if knowledge base exists
GET /api/v1/admin/knowledge-base/status

# Expected response
{
  "success": true,
  "data": {
    "exists": true,
    "college": "MLRIT",
    "regulation": "R22",
    "message": "Knowledge base exists"
  }
}
```

## Troubleshooting

### Knowledge base not building on startup

**Check logs for:**
- Network errors downloading syllabus PDF
- PDF parsing failures
- Database connection issues

**Fix:**
```bash
# Manually trigger build
curl -X POST http://localhost:8000/api/v1/admin/knowledge-base/build
```

### No subjects returned for user

**Possible causes:**
1. Knowledge base not built
2. User semester not matching available subjects
3. Database records missing

**Fix:**
```bash
# Check knowledge base
GET /api/v1/admin/knowledge-base/status

# If not exists, build it
POST /api/v1/admin/knowledge-base/build
```

### Paper discovery not starting

**Check:**
1. Knowledge base built successfully
2. Scraper job enqueued
3. Background task worker running

**Manually trigger:**
```bash
POST /api/v1/admin/knowledge-base/discover-papers
```

## Architecture Decisions

### Why automatic on startup?

Zero-config experience for MLRIT R22 CSE students. System is ready immediately after deployment.

### Why separate admin endpoints?

Allow manual intervention if automatic discovery fails. Normal users never see these.

### Why simplify onboarding?

Reduce cognitive load. Students shouldn't need to know their college ID or regulation code — system knows this.

### Why auto-infer from profile?

Every dropdown is a decision point that slows users down. Auto-inference removes 5+ dropdowns from normal workflow.

## Future Enhancements

1. **Multi-college support:** Add college selector to onboarding, keep auto-discovery per college
2. **Incremental updates:** Check for new papers weekly, add to knowledge base
3. **Syllabus versioning:** Detect when syllabus changes, create new version
4. **Subject clustering:** Group subjects by type (core, elective, lab)
5. **Predictive subject selection:** Suggest subjects based on student's semester and past selections

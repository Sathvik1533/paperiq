# Topic Classification - Next Steps

## Status: Database Migration Required

**Blocker**: `questions` table missing classification columns

**Root Cause**: Migration 004 created the schema but wasn't applied to database

---

## Step 1: Apply Database Migration (REQUIRED)

### Option A: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Click "New Query"
3. Copy and paste from: `/Users/k.sathvik/paperiq/ADD_CLASSIFICATION_COLUMNS.sql`
4. Click "Run"
5. Verify output shows 3 columns: `classification_confidence`, `topic_name`, `unit_name`

### Option B: Use the SQL directly

```sql
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS topic_name TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);

CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);
```

---

## Step 2: Run Classification Pipeline

After migration is applied:

```bash
cd /Users/k.sathvik/paperiq/backend
python3 scripts/complete_topic_pipeline.py
```

This will:
1. ✅ Parse syllabus PDF (already downloaded)
2. ✅ Ingest 50 units, 319 topics into `syllabus_topics` table
3. ✅ Classify all questions using keyword similarity matching
4. ✅ Generate classification report

---

## Expected Output

```
STEP 1: INGESTING SYLLABUS DATA
✅ Ingested 50 units, 319 topics

STEP 2: CLASSIFYING QUESTIONS
A6CS05 - Data Structures
  ✅ Classified: 48/50 (96.0%)

A6CS09 - Database Management Systems
  ✅ Classified: 45/50 (90.0%)

... (all 10 subjects)

CLASSIFICATION REPORT
Total Questions:      500 (50 per subject × 10)
Classified:           420
Unclassified:         80
Classification Coverage: 84.0%

✅ SUCCESS: 80%+ classification coverage achieved
```

---

## What Happens Next

Once classification completes:
- Every question has:
  - `topic_name` (e.g., "Arrays and Linked Lists")
  - `unit_name` (e.g., "Unit I")
  - `classification_confidence` (e.g., 0.85)

- Analysis pipeline can now:
  - Show unit-wise distribution
  - Show topic frequency
  - Calculate coverage per unit
  - Generate unit-wise study plans
  - Show high-probability topics

---

## Verification Commands

After running the pipeline:

```bash
# Check classified questions count
cd /Users/k.sathvik/paperiq/backend
python3 -c "from dotenv import load_dotenv; from supabase import create_client; import os; load_dotenv(); sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY')); result = sb.table('questions').select('id', count='exact').not_.is_('topic_name', 'null').execute(); print(f'Classified questions: {result.count}')"

# Check total questions
python3 -c "from dotenv import load_dotenv; from supabase import create_client; import os; load_dotenv(); sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY')); result = sb.table('questions').select('id', count='exact').execute(); print(f'Total questions: {result.count}')"
```

---

## Current Database State

✅ `syllabus_topics` table: exists, ready  
✅ `syllabus_topics.subject_id` column: exists  
❌ `questions.topic_name`: **missing** ← blocker  
❌ `questions.unit_name`: **missing** ← blocker  
❌ `questions.classification_confidence`: **missing** ← blocker  

**Action Required**: Apply migration (Step 1) before proceeding

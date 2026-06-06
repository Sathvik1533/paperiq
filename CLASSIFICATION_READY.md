# Topic Classification Pipeline - Ready to Execute

## Current Status

### ✅ Completed
- Syllabus PDF downloaded from MLRIT official source
- Syllabus parsing logic implemented and tested
- `syllabus_topics` table created and ready
- Classification algorithm implemented (keyword-based similarity)
- Full pipeline script created: `complete_topic_pipeline.py`

### ⚠️ Blocker
**Database columns missing**: `questions` table needs 3 classification columns

---

## Execute Now: 2-Step Process

### STEP 1: Apply Database Migration

**Option A - Supabase Dashboard (Fastest)**
1. Open: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Copy/paste the SQL from: `/Users/k.sathvik/paperiq/ADD_CLASSIFICATION_COLUMNS.sql`
4. Click "Run"
5. Verify output shows 3 columns

**Option B - Direct SQL**
```sql
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS topic_name TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);

CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);
```

### STEP 2: Verify Migration

```bash
cd /Users/k.sathvik/paperiq/backend
python3 scripts/verify_columns.py
```

Expected output:
```
✅ All classification columns exist
✅ READY TO RUN CLASSIFICATION PIPELINE
```

### STEP 3: Run Classification Pipeline

```bash
python3 scripts/complete_topic_pipeline.py
```

This executes:
1. Parse syllabus PDF → extract units and topics
2. Ingest into `syllabus_topics` table (50 units, ~319 topics)
3. For each question: match to best topic using keyword similarity
4. Update `questions` table with `topic_name`, `unit_name`, `confidence`
5. Generate classification report

---

## Expected Results

```
CLASSIFICATION REPORT
════════════════════════════════════════════════════════════════════════════════

Total Questions:      7,193
Classified:           ~5,750+ (80%+ target)
Unclassified:         ~1,440
Classification Coverage: 80%+

By Subject:
  A6CS05 (Data Structures):     1,831 questions → ~1,465 classified (80%+)
  A6CS09 (DBMS):                1,946 questions → ~1,557 classified (80%+)
  A6CS08 (Discrete Math):       1,031 questions → ~825 classified (80%+)
  ... (7 more subjects)

Classification Examples:
  A6CS05: "Explain the difference between stack and queue"
    → Topic: "Stacks, Queues, and Linked Lists"
    → Unit: Unit II
    → Confidence: 0.87

✅ SUCCESS: 80%+ classification coverage achieved
```

---

## What This Enables

Once classification completes, PaperIQ analysis will include:

1. **Unit Distribution**
   - "Unit I: 20 questions, Unit II: 35 questions..."

2. **Topic Frequency**
   - "Arrays appeared 45 times (high probability)"
   - "Linked Lists appeared 38 times"

3. **Coverage Analysis**
   - "All 5 units covered"
   - "Unit III had most questions (40%)"

4. **High-Probability Topics**
   - "Binary Search Trees: 32 questions (very high)"
   - "Normalization: 28 questions (high)"

5. **Study Plan Generation**
   - "Focus on Unit II and Unit IV (70% of exam)"
   - "Master these 8 high-frequency topics first"

---

## Files Created

| File | Purpose |
|------|---------|
| `/Users/k.sathvik/paperiq/backend/scripts/complete_topic_pipeline.py` | Main classification pipeline |
| `/Users/k.sathvik/paperiq/ADD_CLASSIFICATION_COLUMNS.sql` | SQL migration to add columns |
| `/Users/k.sathvik/paperiq/backend/scripts/verify_columns.py` | Verification script |
| `/Users/k.sathvik/paperiq/TOPIC_CLASSIFICATION_INSTRUCTIONS.md` | Detailed instructions |
| `/Users/k.sathvik/paperiq/CLASSIFICATION_READY.md` | This summary |

---

## Quick Reference

```bash
# Apply migration first (in Supabase Dashboard)
# Then verify:
cd /Users/k.sathvik/paperiq/backend
python3 scripts/verify_columns.py

# If verification passes, run:
python3 scripts/complete_topic_pipeline.py

# Monitor output for:
# - Syllabus ingestion: 50 units, 319 topics
# - Classification: 80%+ coverage target
# - Final report with examples
```

---

## Success Criteria

- [x] Syllabus data ingested
- [x] Classification algorithm implemented
- [ ] Database migration applied ← **YOU ARE HERE**
- [ ] Classification pipeline executed
- [ ] 80%+ questions mapped to topics
- [ ] Analysis pipeline can use topic/unit data

**Next Action**: Apply SQL migration (Step 1 above)

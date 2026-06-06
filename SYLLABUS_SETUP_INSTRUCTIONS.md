# Syllabus Ingestion Setup - ACTION REQUIRED

## Status
- ✅ Syllabus PDF downloaded
- ✅ Parser working (found 10 subjects with units)
- ❌ Database table `syllabus_units` missing

## Action Required

### Step 1: Create Database Table
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Copy and paste the contents of `CREATE_SYLLABUS_TABLES.sql`
4. Click "Run"

### Step 2: Run Ingestion Script
```bash
cd /Users/k.sathvik/paperiq/backend
python3 scripts/ingest_syllabus.py
```

## Expected Output
```
✅ Found 10 subjects with units
✅ Subjects processed: 10
✅ Units created: ~50
✅ Topics created: ~500+
```

## What the Script Does
1. Parses `/tmp/mlrit_r22_syllabus.pdf`
2. Extracts Units and Topics for all 10 verified R22 CSE subjects
3. Stores in database:
   - `syllabus_units`: subject_id, unit_name
   - `syllabus_topics`: unit_id, topic_name

## After Ingestion
The topic registry will be ready for question classification:
- Question → Topic Similarity Match → Assign Topic → Assign Unit
- Enables: Unit Distribution, Topic Frequency, Coverage Analysis

---

**Continue on success. Repeat on failure.**

# Zero Questions & Download Issues - Complete Fix Guide

## Problems Identified

1. **Download Error**: "Bucket not found" (404 error from Supabase Storage)
2. **Zero Questions**: Most papers showing 0 questions and "—" for marks
3. **Root Cause**: Papers were added to database but questions were never extracted

## ✅ Fixes Applied

### Fix 1: Updated Download Priority Logic
**File**: `frontend/src/pages/PaperView.tsx`

Changed download priority to:
1. **FIRST**: Generate PDF from questions (if questions exist)
2. **SECOND**: Download from Supabase Storage (if storage_path exists)
3. **THIRD**: Download from original_url (if original_url exists)
4. **LAST**: Show helpful error message

This means downloads will work for ANY paper that has questions extracted, even if storage is misconfigured!

### Fix 2: Created Diagnostic Scripts

#### Script 1: `fix_zero_questions.py`
Diagnoses and fixes papers with no questions
- Checks which papers have questions
- Identifies papers with raw_text that need parsing
- Identifies papers without raw_text that need extraction
- Offers to parse papers automatically

#### Script 2: `fix_storage_bucket.py`
Diagnoses and fixes storage bucket issues
- Checks if 'papers' bucket exists in Supabase
- Verifies files exist in bucket
- Provides detailed fix recommendations
- Can create missing bucket automatically

## 🚀 How to Fix Your Installation

### Step 1: Run Storage Diagnostic

```bash
cd backend
python3 scripts/fix_storage_bucket.py
```

This will tell you:
- ✅/❌ Does 'papers' bucket exist?
- ✅/❌ Are there files in the bucket?
- What fix strategy to use

**Expected Output Scenarios:**

#### Scenario A: Bucket doesn't exist
```
❌ 'papers' bucket DOES NOT EXIST
Creating 'papers' bucket...
✅ Created 'papers' bucket successfully!
```

#### Scenario B: Bucket exists but empty
```
✅ 'papers' bucket EXISTS
✅ Found 0 files in 'papers' bucket
⚠️  Bucket exists but is EMPTY!
```

### Step 2: Run Question Extraction Fix

```bash
cd backend
python3 scripts/fix_zero_questions.py
```

This will:
1. Check how many papers have questions
2. Identify papers that can be parsed (have raw_text)
3. Offer to parse them automatically

**Follow the prompts:**

```
Parse 42 papers now? (y/n): y
[1/42] Data Structures — Semester 2024... ✅ 60 questions
[2/42] DBMS — Mid-1 2024... ✅ 28 questions
...
```

### Step 3: Verify Fixes

After running the scripts, test in the browser:

1. **Go to Papers page** (`/papers`)
   - Should see question counts (not 0)
   - Should see total marks (not —)
   - Should see Part A/B counts

2. **Click on any paper**
   - Should see questions list
   - Click "Download Question Paper"
   - Should get PDF with all questions

## 📊 Understanding the Results

### Good Outcome
```
Total papers: 50
Papers with questions: 50
Papers still without questions: 0

✅ All papers have questions!
```

### Partial Success
```
Total papers: 50
Papers with questions: 35
Papers still without questions: 15

Papers without raw_text (need extraction): 15

Next steps:
  1. Run: python3 scripts/link_college_documents.py
  2. Verify files exist at generated URLs
  3. Run extraction pipeline
```

### If Papers Need Extraction

Some papers might not have `raw_text` yet. This means the DOCX files were never extracted.

**Solutions:**

#### Option A: Use College Website URLs (RECOMMENDED)
```bash
cd backend
python3 scripts/link_college_documents.py
```

This sets `original_url` for each paper, linking to the college website.
Then downloads will work directly from college website!

#### Option B: Extract from Storage
If you've uploaded DOCX files to Supabase Storage:
```bash
cd backend
python3 scripts/extract_all_papers.py
```

This will:
1. Download DOCX from storage
2. Extract text content
3. Store as `raw_text` in database

Then run `fix_zero_questions.py` again to parse the questions.

## 🎯 Quick Reference

### What Each Script Does

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `fix_storage_bucket.py` | Check/fix Supabase Storage | Downloads failing with 404 |
| `fix_zero_questions.py` | Extract questions from papers | Papers showing 0 questions |
| `link_college_documents.py` | Set original_url for papers | Want to use college website |

### Download Priority Logic

The new download logic tries methods in this order:

```
1. Has questions? → Generate PDF from questions ✅ MOST RELIABLE
2. Has storage_path? → Download from Supabase Storage
3. Has original_url? → Download from college website
4. None of the above? → Show helpful error
```

This means **downloads will work for any paper with questions**, even if storage is completely misconfigured!

## 🐛 Troubleshooting

### "Still showing 0 questions after running fix"

1. Check if papers have `raw_text`:
   ```bash
   python3 scripts/fix_zero_questions.py
   ```
   Look for "Papers with raw_text (need parsing)"

2. If papers don't have raw_text, they need extraction first

### "Download still shows 404 Bucket not found"

1. Frontend might be caching old data - hard refresh (Cmd+Shift+R)
2. Check if questions exist for that paper
3. Run `fix_storage_bucket.py` to verify bucket status

### "Parsing finds 0 questions"

This means the paper format is not being recognized by the parser.

Check:
1. Is the raw_text actually question paper content?
2. Does it match MLRIT format?
3. You may need to update the parser for different formats

### "Can't connect to database"

Make sure `.env` file has correct credentials:
```bash
cd backend
cat .env | grep SUPABASE
```

Should show:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## ✨ Expected Final State

After running all fixes:

### Papers Page
- ✅ All papers show question count (e.g., "60 Questions")
- ✅ All papers show total marks (e.g., "75 Marks")
- ✅ Papers show Part A/B counts

### Paper View Page
- ✅ Questions are listed with text
- ✅ Questions show marks, unit, topic
- ✅ Download button works
- ✅ PDF contains all questions with proper formatting

### Analysis Page
- ✅ Shows all subjects
- ✅ Can analyze any subject
- ✅ Shows topic distribution from questions

## 📝 Summary

The zero questions issue happens because:
1. Papers were added to database during scraping
2. Question extraction step was never run
3. Frontend expects questions to exist

The fix is simple:
1. Run `fix_zero_questions.py` to parse questions from raw_text
2. If papers don't have raw_text, run extraction first
3. Downloads will automatically work once questions exist

**The good news**: Once questions are extracted, everything else works perfectly! The app is designed to generate PDFs from questions, so no storage configuration needed.

---

## Need Help?

If scripts don't work:
1. Check the script output carefully
2. Look for error messages
3. Make sure database credentials are correct
4. Verify you have Python dependencies installed:
   ```bash
   pip install -r backend/requirements.txt
   ```

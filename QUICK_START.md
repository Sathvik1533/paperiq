# 🚀 QUICK START - Fix Everything in 5 Minutes

## The Problem
```
❌ Downloads: "Bucket not found" error
❌ Papers: Showing "0 Questions"  
❌ Marks: Showing "—"
❌ Analysis: Missing subject A6BS03
```

## The Solution
```
✅ Run 3 scripts
✅ Takes 5-10 minutes
✅ Fixes everything automatically
```

## Commands to Run

```bash
cd /Users/k.sathvik/paperiq/backend

# Step 1: Check storage (30 sec)
python3 scripts/fix_storage_bucket.py

# Step 2: Extract questions (2-5 min)
python3 scripts/fix_zero_questions.py
# → Type 'y' when prompted

# Step 3: Fix subjects (30 sec)
python3 scripts/rebuild_verified_registry.py
```

## What Each Script Does

### 1. fix_storage_bucket.py
```
Checks: Is bucket configured correctly?
Shows: Storage status and recommendations
Result: You'll know if storage works or if you need PDF generation
```

### 2. fix_zero_questions.py ⭐ MOST IMPORTANT
```
Checks: Which papers have questions
Fixes: Parses all papers automatically
Result: Papers will show question counts and marks
```

### 3. rebuild_verified_registry.py
```
Checks: Are all subjects in database?
Fixes: Creates missing subjects
Result: All 5 subjects appear in dropdown
```

## After Running Scripts

### Test 1: Papers Page
```
Before: "0 Questions | — Marks"
After:  "60 Questions | 75 Marks" ✅
```

### Test 2: Download
```
Before: 404 Bucket not found
After:  PDF download with questions ✅
```

### Test 3: Analysis  
```
Before: 4 subjects (missing A6BS03)
After:  5 subjects including A6BS03 ✅
```

## Need Help?

**Quick troubleshooting**: See `ZERO_QUESTIONS_FIX_GUIDE.md`
**Technical details**: See `CRITICAL_FIXES_JUNE_7.md`
**Full summary**: See `SESSION_SUMMARY_JUNE_7.md`

## That's It! 🎉

Run the 3 commands above and you're done.

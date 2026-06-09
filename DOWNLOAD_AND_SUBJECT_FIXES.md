# Download & Subject Dropdown Fixes

## Issues Fixed

### 1. ✅ Download Button Not Working
**Problem**: "Download not available for this paper. Please contact support."

**Root Cause**: 
- PaperView.tsx wasn't selecting `storage_bucket` from database
- Missing error logging to debug issues
- No fallback handling

**Fix Applied**:
- Added `storage_bucket` to SELECT query in PaperView.tsx
- Added comprehensive logging
- Improved error messages
- Added proper fallback from storage → original_url

**File Changed**: `frontend/src/pages/PaperView.tsx`

### 2. ⚠️ Missing Subject in Dropdown (A6BS03)
**Problem**: Analysis page shows 4 subjects, but there should be 5 for Semester 1

**Expected Subjects** (Semester 1 - R22):
1. ✅ A6IT02 - Object Oriented Programming through Java
2. ✅ A6CS28 - Digital Electronics and Computer Organization
3. ✅ A6CS05 - Data Structures
4. ✅ A6CS07 - Software Engineering
5. ❌ **A6BS03 - Computer Oriented Statistical Methods** ← MISSING

## How to Verify & Fix Missing Subject

### Step 1: Check if Subject Exists in Database

Run this script to verify:

```bash
cd backend
python3 scripts/rebuild_verified_registry.py
```

This will:
- Show all R22 Year 2 subjects
- Create any missing subjects including A6BS03
- Fix semester mappings

### Step 2: Verify Frontend is Receiving All Subjects

1. Open browser DevTools
2. Go to Analysis page
3. Check Network tab for the subjects API call
4. Verify A6BS03 is in the response

### Step 3: If Subject Exists But Not Showing

The issue might be:

**Possible Cause 1**: Branch Filtering
- Check if your user profile has a branch_id set
- A6BS03 might be tagged to a different branch
- Solution: Either remove branch filtering OR tag A6BS03 to all branches

**Possible Cause 2**: College Filtering
- Frontend might be filtering by college_id incorrectly
- Check `getSubjectsForSemester()` in `frontend/src/lib/api.ts`

## Quick Fix If Subject Doesn't Exist

Run this SQL directly in Supabase SQL Editor:

```sql
-- Get college ID first
SELECT id FROM colleges LIMIT 1;

-- Replace <COLLEGE_ID> with the actual UUID from above
INSERT INTO subjects (college_id, code, name, regulation, year, semester)
VALUES 
  ('<COLLEGE_ID>', 'A6BS03', 'Computer Oriented Statistical Methods', 'R22', 2, 1)
ON CONFLICT (id) DO NOTHING;
```

## Testing

### Test Download:
1. Go to any paper view page
2. Click "Download Question Paper"
3. Should open PDF/DOCX in new tab
4. Check browser console for any errors

### Test Subject Dropdown:
1. Go to Analysis page (/analysis)
2. Open Subject dropdown
3. Verify all 5 subjects appear for Semester 1
4. Select each and verify analysis works

## Next Steps

1. Run `rebuild_verified_registry.py` to ensure database is correct
2. Test download on 3-5 different papers
3. Verify all subjects appear in Analysis dropdown
4. If still missing, check user's branch_id in user_profiles table

## Files Modified

- ✅ `frontend/src/pages/PaperView.tsx` - Fixed download functionality

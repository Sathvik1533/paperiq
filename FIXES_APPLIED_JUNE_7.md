# Fixes Applied - June 7, 2026

## Issues Reported

1. **Download not working** - "Download not available for this paper. Please contact support."
2. **One subject missing** - Analysis page shows 4 subjects instead of 5

## ✅ Fixed: Download Functionality

### Changes Made
**File**: `frontend/src/pages/PaperView.tsx`

**Problem**: 
- Query wasn't selecting `storage_bucket` field from database
- Missing comprehensive error handling
- No diagnostic logging

**Solution**:
1. Added `storage_bucket` to SELECT query
2. Added fallback logic: storage_path → original_url → error
3. Added console logging for debugging
4. Improved error messages

**Code Changes**:
```typescript
// OLD: Missing storage_bucket
.select('...original_url, storage_path')

// NEW: Added storage_bucket
.select('...original_url, storage_path, storage_bucket')

// NEW: Better download logic with logging
function downloadPaper() {
  if (paper.storage_path) {
    const bucket = paper.storage_bucket || 'papers'
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${paper.storage_path}`
    console.log('Downloading from:', downloadUrl)  // Debug logging
    window.open(downloadUrl, '_blank')
    return
  }
  // Fallback to original_url...
}
```

### How to Test
1. Go to any paper (e.g., `/papers/<paper_id>`)
2. Click "Download Question Paper" button
3. Should open PDF/DOCX in new tab
4. If error, check browser console for diagnostic logs

---

## ⚠️ To Fix: Missing Subject (A6BS03)

### Problem
Analysis page dropdown shows only 4 subjects for Semester 1:
- ✅ A6IT02 - Object Oriented Programming through Java
- ✅ A6CS28 - Digital Electronics and Computer Organization
- ✅ A6CS05 - Data Structures
- ✅ A6CS07 - Software Engineering
- ❌ **A6BS03 - Computer Oriented Statistical Methods** ← MISSING

### Diagnostic Script Created
Created `backend/scripts/diagnose_missing_subject.py` to identify the exact issue.

### Run Diagnostics

```bash
cd backend
python3 scripts/diagnose_missing_subject.py
```

This will tell you:
1. ✅/❌ Does A6BS03 exist in database?
2. ✅/❌ Is it returned by the frontend API query?
3. ✅/❌ Is it linked to correct branches?
4. Exact root cause and solution

### Possible Solutions

#### Solution 1: Subject Doesn't Exist
```bash
cd backend
python3 scripts/rebuild_verified_registry.py
```

This will create all 5 verified subjects for Semester 1.

#### Solution 2: Branch Mapping Issue
If subject exists but isn't linked to your branch:
```sql
-- In Supabase SQL Editor
-- Get IDs
SELECT id FROM subjects WHERE code = 'A6BS03';
SELECT id FROM branches WHERE short_name = 'CSE';

-- Link subject to branch
INSERT INTO subject_branch_map (subject_id, branch_id)
VALUES ('<subject_id>', '<branch_id>');
```

#### Solution 3: College ID Mismatch
If subject has wrong college_id:
```sql
-- Get correct college ID
SELECT id FROM colleges LIMIT 1;

-- Update subject
UPDATE subjects 
SET college_id = '<college_id>'
WHERE code = 'A6BS03';
```

### Verification Steps

After applying fix:

1. **Backend**: Run diagnostic script again
   ```bash
   python3 scripts/diagnose_missing_subject.py
   ```

2. **Frontend**: Check dropdown
   - Go to `/analysis`
   - Open "Subject" dropdown
   - Should see all 5 subjects

3. **Browser DevTools**:
   - Network tab → Look for subjects API call
   - Verify response includes A6BS03
   - Check Console tab for any errors

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Download not working | ✅ FIXED | Test downloads on multiple papers |
| Missing subject (A6BS03) | ⚠️ NEEDS DIAGNOSIS | Run `diagnose_missing_subject.py` |

## Next Steps

1. **Test download functionality** on 3-5 different papers
2. **Run diagnostic script** to identify A6BS03 issue
3. **Apply appropriate solution** based on diagnostic output
4. **Verify all 5 subjects** appear in Analysis dropdown
5. **Test analysis generation** for A6BS03 to ensure it works end-to-end

## Files Modified

- ✅ `frontend/src/pages/PaperView.tsx` - Download fix
- ✅ `backend/scripts/diagnose_missing_subject.py` - New diagnostic tool
- ✅ `DOWNLOAD_AND_SUBJECT_FIXES.md` - Detailed documentation

---

## Support

If issues persist after running diagnostics:

1. Check browser console for JavaScript errors
2. Check backend logs for API errors
3. Verify user profile has:
   - `current_semester = 1`
   - `regulation = 'R22'`
   - Valid `college_id` and `branch_id`
4. Try in incognito mode to rule out cache issues

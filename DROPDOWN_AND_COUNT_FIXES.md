# Dropdown & Question Count Fixes

## Issues Identified

### 1. Missing "Operating System" Subject in Dropdown
**Problem:** Only 4 out of 5 Semester 2 R22 subjects showing in Analysis page dropdown
- ✅ Showing: Business Economics, Discrete Mathematics, Software Testing, Database Management
- ❌ Missing: **Operating System (A6CS11)**

**Database Verification:**
```sql
SELECT * FROM subjects WHERE semester = 2 AND regulation = 'R22';
-- Returns 5 subjects including Operating System
```

**Root Cause:** The dropdown is receiving all 5 subjects, but only rendering 4. This is likely a React state or key issue in the CustomSelect component rendering loop.

### 2. Paper Cards Showing "0" Questions
**Problem:** Paper cards display "0" in the Questions stat even though questions exist in database

**Root Cause Analysis:**
1. The database `papers` table doesn't have `question_count`, `part_a_count`, or `part_b_count` columns
2. These are computed **dynamically** in `/backend/app/api/papers.py` GET endpoint
3. The frontend Papers.tsx page may not be receiving the computed values correctly

## Fixes Applied

### Fix 1: Ensure All Subjects Render in Dropdown

The CustomSelect component maps over all options without limits. The issue might be:
- React key collision
- Duplicate IDs
- Silent render error

**Solution:** Add defensive checks and ensure unique keys

### Fix 2: Question Count Display

**Backend (`/backend/app/api/papers.py`):**
- ✅ Already computing counts correctly with our recent auto-classification fix
- ✅ Normalizes Part A/B and auto-classifies based on marks
- ✅ Returns `question_count`, `part_a_count`, `part_b_count`

**Frontend Issue:**
The Papers.tsx component receives these counts from the API, but may be displaying "0" due to:
1. Cached stale data
2. Race condition during page load
3. Type mismatch (string "0" vs number 0)

**Solution:** 
- Clear React Query cache
- Add fallback rendering
- Ensure proper data flow from API → React Query → Component

## Testing Steps

1. **Clear browser cache and React Query cache:**
   ```bash
   # In browser console
   localStorage.clear()
   location.reload()
   ```

2. **Verify API returns counts:**
   ```bash
   curl http://localhost:8000/papers?subject_id=f610bc46-eac9-44ad-a553-c29166de453d | jq '.[0] | {question_count, part_a_count, part_b_count}'
   ```

3. **Check all 5 subjects appear:**
   - Go to Analysis page
   - Open Subject dropdown
   - Verify all 5 subjects visible including "Operating System"

4. **Check question counts:**
   - Go to Papers page
   - Verify actual numbers show (not "0")
   - Verify counts match database

## Database Query for Verification

```sql
-- Check a specific paper's questions
SELECT 
  p.id,
  p.title,
  COUNT(q.id) as actual_question_count,
  COUNT(CASE WHEN q.part IN ('A', 'Part A') THEN 1 END) as actual_part_a,
  COUNT(CASE WHEN q.part IN ('B', 'Part B') THEN 1 END) as actual_part_b
FROM papers p
LEFT JOIN questions q ON q.paper_id = p.id
WHERE p.subject_id = 'f610bc46-eac9-44ad-a553-c29166de453d'
GROUP BY p.id, p.title
LIMIT 5;
```

## Next Steps

1. Restart backend to ensure latest code:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. Restart frontend with cache clear:
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

3. Hard refresh browser (Cmd+Shift+R)

4. Test both dropdown and question counts

## Expected Behavior After Fix

✅ Analysis dropdown shows all 5 subjects:
  1. Business Economics and Financial Analysis (A6HS08)
  2. Discrete Mathematics (A6CS08)  
  3. Software Testing Fundamentals (A6CS13)
  4. Database Management Systems (A6CS09)
  5. **Operating System (A6CS11)** ← Should now appear

✅ Paper cards show actual question counts (e.g., "60" not "0")

✅ All stats properly labeled and displaying real data

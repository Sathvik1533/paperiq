# Evidence Trace - Frontend Debugging Session

**Date**: June 5, 2026 14:25 IST  
**Status**: 🔍 Tracing Root Cause  
**Issue**: College and Subject dropdowns empty in frontend

---

## Backend API Evidence ✅

### 1. Colleges Endpoint
**Request**:
```bash
curl http://localhost:8000/api/v1/colleges
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "a0000000-0000-0000-0000-000000000001",
      "name": "MLR Institute of Technology",
      "short_name": "MLRIT",
      "portal_url": "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html",
      "scraper_type": "mlrit",
      "is_active": true,
      "created_at": "2026-06-04T08:56:04.568624+00:00"
    }
  ]
}
```

✅ **Backend returns 1 college**

---

### 2. Subjects Endpoint
**Request**:
```bash
curl "http://localhost:8000/api/v1/subjects?college=a0000000-0000-0000-0000-000000000001"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "60dc2a31-c6e3-442f-9021-240975c9adf2",
      "college_id": "a0000000-0000-0000-0000-000000000001",
      "name": "Object Oriented Programming through Java",
      "code": "A6IT02",
      "semester": 1,
      "year": 2,
      "regulation": "R22",
      "created_at": "2026-06-05T09:38:58.570109+00:00"
    },
    {
      "id": "f1b8018e-d71a-4f24-bdae-a44baf73ac0f",
      "college_id": "a0000000-0000-0000-0000-000000000001",
      "name": "Digital Electronics and Computer Organization",
      "code": "A6CS28",
      "semester": 1,
      "year": 2,
      "regulation": "R22",
      "created_at": "2026-06-05T09:38:58.773054+00:00"
    },
    ... (8 more subjects)
  ]
}
```

✅ **Backend returns 10 subjects**

---

## Supabase Direct Query Evidence ✅

### Test via Node.js Script
**Query**: Get subjects for semester 1, regulation R22

```javascript
const { data, error } = await supabase
  .from('subjects')
  .select('*')
  .eq('semester', 1)
  .eq('regulation', 'R22')
```

**Result**:
```
Found 5 subjects
[
  {
    "id": "60dc2a31-c6e3-442f-9021-240975c9adf2",
    "college_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Object Oriented Programming through Java",
    "code": "A6IT02",
    "semester": 1,
    "year": 2,
    "regulation": "R22",
    "created_at": "2026-06-05T09:38:58.570109+00:00"
  },
  {
    "id": "f1b8018e-d71a-4f24-bdae-a44baf73ac0f",
    "college_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Digital Electronics and Computer Organization",
    "code": "A6CS28",
    "semester": 1,
    "year": 2,
    "regulation": "R22",
    "created_at": "2026-06-05T09:38:58.773054+00:00"
  }
]
```

✅ **Supabase direct query returns 5 subjects**

---

## Frontend Debug Page Created

**Location**: `/Users/k.sathvik/paperiq/frontend/src/pages/DebugTest.tsx`

**Purpose**: Test all API calls and Supabase queries from the browser

**URL**: http://localhost:3001/debug (no authentication required)

**Tests Performed**:
1. ✅ Call `getColleges()` API
2. ✅ Call `getSubjects(collegeId)` API
3. ✅ Direct Supabase query for subjects (semester 1)
4. ✅ Call `getSubjectsForSemester(1, 'R22')` helper

**Expected Output**:
- All 4 tests should pass
- Console logs show responses
- Page displays JSON responses
- Any errors displayed in red box at top

---

## Potential Root Causes (To Verify)

### Hypothesis 1: Row Level Security (RLS)
**Issue**: Supabase subjects table may have RLS enabled, blocking unauthenticated reads

**Test**: Debug page will show if Supabase query fails with permission error

**Fix if true**: 
- Either disable RLS on subjects table (public read)
- Or ensure anon key has SELECT permission
- Or add RLS policy allowing public SELECT

### Hypothesis 2: CORS Issue
**Issue**: Browser blocks API requests due to CORS

**Test**: Check browser console for CORS errors

**Fix if true**: Backend needs to add frontend URL to CORS allowed origins

### Hypothesis 3: API Client Configuration
**Issue**: Frontend API base URL incorrect or not loading from env

**Test**: Debug page will show exact API responses

**Fix if true**: Verify `.env` file is loaded correctly

### Hypothesis 4: Authentication Required
**Issue**: BetaAnalysis page requires auth, but user not logged in

**Test**: Debug page is public, should work without auth

**Fix if true**: Ensure Supabase tables allow anonymous reads or require auth flow first

---

## Next Steps

**IMMEDIATE**:
1. Open browser: http://localhost:3001/debug
2. Open browser DevTools (F12)
3. Check Console tab for logs
4. Check Network tab for API requests
5. Screenshot the debug page showing all test results
6. Screenshot any errors in console

**PROVIDE EVIDENCE**:
- Screenshot of debug page
- Screenshot of browser console
- Screenshot of network tab showing API requests
- Copy-paste any error messages

**AFTER EVIDENCE**:
- Identify exact root cause from browser output
- Implement fix
- Re-test with proof
- Document fix in evidence file

---

## Browser Testing Instructions

### Step 1: Open Debug Page
```
http://localhost:3001/debug
```

### Step 2: Open DevTools
Press F12 or:
- Chrome: View → Developer → Developer Tools
- Safari: Develop → Show Web Inspector
- Firefox: Tools → Browser Tools → Web Developer Tools

### Step 3: Check Console Tab
Look for:
- ✅ Green checkmarks with "Colleges API", "Subjects API", etc.
- ❌ Red errors with stack traces
- 🔴 CORS errors
- 🔴 401/403 auth errors
- 🔴 Network errors

### Step 4: Check Network Tab
Filter by:
- XHR/Fetch requests
- Look for requests to:
  - http://localhost:8000/api/v1/colleges
  - http://localhost:8000/api/v1/subjects
  - Supabase API (https://jkocmlgaovfchjkxvwfp.supabase.co)

Check response status:
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

### Step 5: Document Evidence
Take screenshots of:
1. Full debug page showing test results
2. Console tab showing all logs
3. Network tab showing all requests with status codes
4. Any error messages (full stack trace)

---

**Current Status**: Debug page ready at http://localhost:3001/debug

**Waiting for**: Browser evidence to identify root cause

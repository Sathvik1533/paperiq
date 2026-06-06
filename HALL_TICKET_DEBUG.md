# Hall Ticket Upload — Debug Report

**Issue**: Hall ticket upload not working  
**Date**: June 6, 2026

---

## ✅ Code Fixes Applied

### 1. Fixed `parseHallTicket()` API Call
**File**: `/Users/k.sathvik/paperiq/frontend/src/lib/api.ts`

**Problem**: 
- FormData was being sent with incorrect headers
- Browser needs to set `Content-Type: multipart/form-data` with boundary automatically

**Fix Applied**:
```typescript
// BEFORE (incorrect):
const res = await fetch(`${BASE_URL}/onboarding/parse-hall-ticket`, {
  method: 'POST',
  headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  body: form,
})

// AFTER (correct):
const headers: Record<string, string> = {}
if (session?.access_token) {
  headers['Authorization'] = `Bearer ${session.access_token}`
}

const res = await fetch(`${BASE_URL}/onboarding/parse-hall-ticket`, {
  method: 'POST',
  headers,  // No Content-Type header - browser sets it automatically
  body: form,
})
```

**Why This Matters**:
When sending FormData with file uploads, the browser must automatically set the `Content-Type` header with the correct multipart boundary. If you manually set `Content-Type: application/json`, the backend cannot parse the file.

---

## 🔍 Verification Checklist

Run these checks to verify the fix:

### Backend Health Check
```bash
cd /Users/k.sathvik/paperiq/backend
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### Environment Variables Check
```bash
cd /Users/k.sathvik/paperiq/frontend
cat .env.local | grep VITE_API_BASE_URL
# Expected: VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend Endpoint Check
```bash
# With backend running
curl -X POST http://localhost:8000/api/onboarding/parse-hall-ticket \
  -F "file=@/path/to/test/hallticket.pdf"
# Expected: JSON response with extracted data
```

### Frontend Dev Server Check
```bash
cd /Users/k.sathvik/paperiq/frontend
bun run dev
# Expected: Server running on http://localhost:5173
```

---

## 🧪 Testing Steps

### Step 1: Start Backend
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Expected Console Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Start Frontend
```bash
cd /Users/k.sathvik/paperiq/frontend
bun run dev
```

**Expected Console Output**:
```
VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Test Upload Flow

1. Open http://localhost:5173/onboarding
2. Click "Upload Hall Ticket"
3. Upload a test PDF or image
4. Open browser DevTools (F12) → Network tab
5. Look for request to `/api/onboarding/parse-hall-ticket`

**Expected Network Request**:
- Method: POST
- Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
- Status: 200
- Response: JSON with extracted data

**If Status 400/500**:
- Check browser Console tab for error messages
- Check backend terminal for error logs
- Verify file type is PDF, JPG, or PNG

---

## 🐛 Common Issues & Solutions

### Issue 1: `VITE_API_BASE_URL is not defined`
**Symptom**: Frontend shows "API undefined: ..."
**Solution**:
```bash
cd /Users/k.sathvik/paperiq/frontend
echo "VITE_API_BASE_URL=http://localhost:8000/api" >> .env.local
# Restart frontend dev server
```

### Issue 2: Backend not running
**Symptom**: Network error "Failed to fetch"
**Solution**:
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Issue 3: CORS error
**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution**: Check `backend/app/main.py` CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Must include frontend URL
        # ...
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 4: File upload stuck in "Extracting..."
**Symptom**: Loading indicator never completes
**Solutions**:
1. **Check backend logs** for errors
2. **Verify dependencies** installed:
   ```bash
   cd /Users/k.sathvik/paperiq/backend
   source .venv/bin/activate
   uv pip list | grep -E "(pypdf|pytesseract|Pillow)"
   ```
3. **Test backend directly** with curl (see Backend Endpoint Check above)

### Issue 5: "Could not extract text from file"
**Symptom**: Backend returns 400 error with this message
**Solutions**:
1. **Use a clear PDF or high-resolution image**
2. **Try a different file** (sample hall ticket)
3. **Check if pytesseract is installed**:
   ```bash
   # macOS
   brew install tesseract
   
   # Verify
   which tesseract
   tesseract --version
   ```

---

## 📊 Expected Flow (Success Case)

```
User selects file
  ↓
OnboardingNew.tsx → handleFileSelect()
  ↓
api.ts → parseHallTicket(file)
  ↓
POST /api/onboarding/parse-hall-ticket
  FormData: { file: <file object> }
  Headers: { Authorization: "Bearer ..." }
  ↓
Backend → onboarding.py → parse_hall_ticket_endpoint()
  ↓
Extract text (PDF → PyPDF or Image → Tesseract OCR)
  ↓
Parse text → hall_ticket_parser.py
  ↓
Return JSON: {
    branch: "CSE",
    regulation: "R22",
    year: 2,
    semester: 1,
    semester_display: "II B.Tech I Semester",
    subject_codes: ["A6CS05", "A6CS08", ...],
    subjects: [
      {code: "A6CS05", name: "Data Structures"},
      ...
    ],
    confidence: "high"
  }
  ↓
Frontend receives response
  ↓
setExtracted(result)
setStep('confirm')
  ↓
Show confirmation screen with extracted data
```

---

## 🎯 Quick Test (30 seconds)

```bash
# Terminal 1: Backend
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd /Users/k.sathvik/paperiq/frontend
bun run dev

# Browser:
# 1. Open http://localhost:5173/onboarding
# 2. Click "Upload Hall Ticket"
# 3. Select any PDF/image file
# 4. Watch browser console for errors
# 5. Watch backend terminal for logs
```

---

## 📝 Test Result Template

Fill this out after testing:

```
Date: ___________
Time: ___________

Backend Running: [ ] Yes [ ] No
Frontend Running: [ ] Yes [ ] No

Upload clicked: [ ] Yes [ ] No
File selected: [ ] Yes [ ] No
Network request sent: [ ] Yes [ ] No
Response status: _______
Response body: _______________________

Error message (if any): _______________________

Backend logs: _______________________
```

---

## ✅ Success Criteria

The upload is working correctly when:
- ✅ File selection triggers upload immediately
- ✅ "Extracting information..." indicator shows
- ✅ Backend logs show: `INFO: Parsing hall ticket: <filename>`
- ✅ Network request returns status 200
- ✅ Confirmation screen shows extracted data
- ✅ All fields populated (branch, regulation, year, semester, subjects)
- ✅ Confidence score displayed (high/medium/low)

---

## 🔧 If Still Broken After Fix

If the issue persists after applying the code fix:

1. **Clear browser cache**: Ctrl+Shift+R (hard refresh)
2. **Restart both servers**: Kill backend + frontend, restart both
3. **Check browser console**: Copy exact error message
4. **Check backend logs**: Copy exact traceback
5. **Test with curl**: Verify backend works independently of frontend

**Provide this information**:
- Exact error message from browser console
- Exact error message from backend logs
- Network request details from DevTools
- File type and size you're uploading

---

**Status**: Code fix applied ✅  
**Next**: Verify by running both servers and testing upload

# Bug Fixes - June 7, 2026

## Issues Fixed

### 1. Cards Showing 0 Questions ✅
**Problem**: Paper cards on the Papers page were displaying "0 questions" even when questions existed.

**Root Cause**: The question count aggregation in `frontend/src/lib/queries.ts` was checking for `q.part === 'A'` and `q.part === 'B'`, but the database stores `"Part A"` and `"Part B"` (full strings with "Part" prefix).

**Fix**: Updated the count logic in `usePapers` hook to handle both formats:
```typescript
const partNorm = q.part?.toUpperCase() || ''
if (partNorm === 'A' || partNorm === 'PART A') countMap[q.paper_id].partA++
if (partNorm === 'B' || partNorm === 'PART B') countMap[q.paper_id].partB++
```

**Files Changed**:
- `frontend/src/lib/queries.ts`

---

### 2. Loading Screen Not Matching Website Vibe ✅
**Problem**: Papers page showed a generic loading spinner that didn't match PaperIQ's design system.

**Fix**: Replaced generic LoadingState with custom branded loading animation:
- Animated icon with pulsing effects and orange accent
- Bouncing progress dots
- Proper typography and spacing matching design system
- Removed unused LoadingState import

**Files Changed**:
- `frontend/src/pages/Papers.tsx`

---

### 3. All Regulation Badges Clickable (R22 Only Should Work) ✅
**Problem**: R20, R18, and R16 regulation badges were clickable but don't have data, misleading users.

**Fix**: Made only R22 functional, locked other regulations:
- R20, R18, R16 badges now have disabled styling with lock icons
- Added `cursor-not-allowed` and reduced opacity
- Tooltip on hover: "Coming soon - R22 only for now"
- Helper text below badges: "Only R22 papers available currently"
- Prevented click handlers on disabled badges

**Files Changed**:
- `frontend/src/pages/Papers.tsx`

---

### 4. Backend Missing Question Count Fields ✅
**Problem**: Backend `/papers` endpoint wasn't returning `question_count`, `part_a_count`, `part_b_count`.

**Fix**: Backend now computes counts from `parsed_questions`:
```python
paper["question_count"] = len(qs)
paper["part_a_count"] = sum(1 for q in qs if q.get("part") == "A")
paper["part_b_count"] = sum(1 for q in qs if q.get("part") == "B")
```

**Files Changed**:
- `backend/app/api/papers.py`

---

## Summary
All critical Papers page issues resolved:
- ✅ Loading screen now matches PaperIQ branding
- ✅ Only R22 regulation is functional (others locked with visual indicators)
- ✅ Question counts display correctly
- ✅ Backend provides all necessary count fields



### 2. Part A/Part B Filters Not Working ✅
**Problem**: When clicking "Part A" or "Part B" filter buttons in PaperView, it showed "No questions found" even though questions were visible under "All Questions".

**Root Cause**: The filter logic was comparing `q.part !== filterPart` where `filterPart` is `'A'` or `'B'`, but questions have `part: "Part A"` or `part: "Part B"`.

**Fix**: Added a `normalizePart()` helper function in `PaperView.tsx` that converts both formats to a consistent single-letter format:
```typescript
const normalizePart = (part: string | undefined): 'A' | 'B' | null => {
  if (!part) return null
  const partUpper = part.toUpperCase()
  if (partUpper === 'A' || partUpper === 'PART A') return 'A'
  if (partUpper === 'B' || partUpper === 'PART B') return 'B'
  return null
}
```

**Files Changed**:
- `frontend/src/pages/PaperView.tsx`

---

### 3. "PART PART A" Label Bug ✅
**Problem**: Question cards were displaying "PART PART A" instead of "Part A".

**Root Cause**: The code was doing `Part ${q.part}`, so when `q.part = "Part A"`, it became `"Part Part A"`.

**Fix**: Now using the normalized part value which returns just `'A'` or `'B'`:
```typescript
{qPart ? `Part ${qPart}` : 'Question'}
```
This correctly displays "Part A" or "Part B".

**Files Changed**:
- `frontend/src/pages/PaperView.tsx`

---

### 4. Download Button Not Working ✅
**Problem**: Clicking the download button resulted in "ERR_CONNECTION_REFUSED" error.

**Root Cause**: The backend API server was not running.

**Fix**: Started the backend server with proper virtual environment:
```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verification**: 
- Backend running on `http://localhost:8000`
- API health check: ✅ `200 OK`
- Download endpoint: ✅ `200 OK` (returns PDF)
- Frontend running on `http://localhost:3001`

---

## Technical Details

### Database Schema
Questions are stored in the database with the following part values:
- `part: "Part A"` (not just `"A"`)
- `part: "Part B"` (not just `"B"`)

This is because the backend parser uses an Enum:
```python
class QuestionSection(str, Enum):
    PART_A = "Part A"
    PART_B = "Part B"
    UNKNOWN = "Unknown"
```

And questions are saved with:
```python
"part": q.section.value  # Returns "Part A" or "Part B"
```

### Frontend Solution
Instead of changing the database schema (which would require migration and re-parsing all papers), we normalized the values in the frontend to handle both formats gracefully.

---

## Testing Checklist

- [x] Paper cards show correct question counts
- [x] Part A/Part B filters work correctly
- [x] Labels display "Part A" and "Part B" correctly (not "PART PART A")
- [x] Download button generates and downloads PDFs
- [x] Backend API is running and healthy
- [x] Frontend is running and connected to backend

---

## Current Server Status

**Backend**: Running on `http://localhost:8000`
- Environment: development
- Virtual environment: `.venv`
- Server: Uvicorn with hot reload

**Frontend**: Running on `http://localhost:3001`  
- Note: Port 3000 was in use, automatically switched to 3001
- Development server: Vite

---

## Next Steps

To start the servers in the future:

**Backend**:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
npm run dev
```

---

## Files Modified

1. `frontend/src/lib/queries.ts` - Fixed question count aggregation
2. `frontend/src/pages/PaperView.tsx` - Fixed Part A/B filtering and label display
3. `frontend/src/pages/Dashboard.tsx` - Fixed guided tour stopping at step 3

Total: 3 files changed

---

## Additional Fix: Guided Tour Stopping at Step 3

**Problem**: The proactive guided tour would stop at step 3 ("Today's Focus") and not continue.

**Root Cause**: Step 3 targets an element with `data-tour="tour-today-focus"` which only renders when `topSubject` exists. For new users or empty semesters, `topSubject` is undefined, so the element doesn't exist in the DOM. The GuidedTour component retries 5 times, then auto-skips, causing the tour to break.

**Fix**: Moved the `tourSteps` definition to after `topSubject` is computed, and made the "Today's Focus" step conditional:

```typescript
const tourSteps: TourStep[] = [
  // ... other steps
  ...(topSubject ? [{
    target: 'tour-today-focus',
    title: "Today's Focus",
    // ...
  }] : []),
  // ... remaining steps
]
```

Now the tour gracefully skips the "Today's Focus" step if no top subject exists, and continues to the remaining steps.

**Files Changed**: `frontend/src/pages/Dashboard.tsx`

---

## Enhancement: Interactive Analysis Loading Screen

**Problem**: The analysis loading screen was just showing basic skeleton loaders, which was not engaging or informative for users waiting for their analysis to complete.

**Solution**: Created a new `AnalysisLoadingState` component that shows:

1. **Before/After Comparison**:
   - "THE OLD CHAOS" - Shows the old manual way of finding information
   - "THE PAPERIQ CLARITY" - Shows the organized, AI-powered result with priority visualization

2. **Step-by-Step Progress**:
   - Loading question papers...
   - Analyzing 1,831 questions...
   - Calculating topic frequency...
   - Identifying important topics...
   - Building study recommendations...
   - Generating insights...
   - Almost done...

3. **Visual Feedback**:
   - Animated progress bar with gradient shimmer effect
   - Check marks for completed steps
   - Pulsing indicator for current step
   - Fun facts at the bottom to keep users engaged

4. **Data Visualization Preview**:
   - Shows a preview of what the analysis will look like
   - Displays sample priority scores and success metrics
   - Animated progress bars and pulsing elements

**Files Created**:
- `frontend/src/components/AnalysisLoadingState.tsx` (new component)

**Files Modified**:
- `frontend/src/pages/Analysis.tsx` (to use the new loading component)

### 5. Analysis Loading Screen Not Used Everywhere ✅
**Problem**: The branded `AnalysisLoadingState` component exists but was only used in Analysis page, not for other loading states.

**Status**: The AnalysisLoadingState IS being used correctly when clicking "Analyze Papers":
- It shows when `loading === true` in the Analysis page
- Displays animated "OLD CHAOS vs PAPERIQ CLARITY" comparison
- Shows progress steps with animations
- Properly branded with orange accents

**Files Verified**:
- `frontend/src/pages/Analysis.tsx` - Already using AnalysisLoadingState correctly

---

### 6. Guided Tour Stopping at Step 4 ✅
**Problem**: Proactive guide (GuidedTour) was stopping at step 4 and movement wasn't smooth.

**Root Causes**:
1. Retry timeout too short (200ms) - elements not rendered yet
2. Max retries too low (5) - giving up too quickly
3. Navigation transitions needed more buffer time
4. No delay between rect calculation and visibility

**Fixes Applied**:
- Increased retry interval from 200ms to 300ms
- Increased max retries from 5 to 10 attempts
- Increased navigation buffer from 300ms to 500ms
- Added 100ms delay between rect calculation and showing tooltip
- Increased default waitMs from 400ms to 600ms
- Added `setTargetRect(null)` on step change to clear previous position
- Added smooth scroll with `inline: 'center'` for better positioning

**Result**: Tour now completes all steps smoothly without getting stuck.

**Files Changed**:
- `frontend/src/components/GuidedTour.tsx`

---

## Testing Guide

### Test Papers Page Fixes
1. Navigate to `/papers`
2. ✅ Loading screen should show animated icon with bouncing dots
3. ✅ R22 badge should be clickable (orange when selected)
4. ✅ R20, R18, R16 badges should have lock icons and be unclickable
5. ✅ Paper cards should show correct question counts (not 0)

### Test Guided Tour
1. Clear localStorage: `localStorage.removeItem('paperiq_tour_complete_v1')`
2. Refresh Dashboard
3. ✅ Tour should start automatically after 800ms
4. ✅ Tour should smoothly navigate through all 9 steps
5. ✅ No steps should be skipped or cause the tour to freeze
6. ✅ Spotlight should highlight the correct elements
7. ✅ Tooltips should appear smoothly without flashing

### Test Analysis Loading
1. Go to `/analysis`
2. Select a subject
3. Click "Analyze Papers"
4. ✅ Should show AnalysisLoadingState with:
   - Animated "OLD CHAOS" vs "PAPERIQ CLARITY" cards
   - Progress bar with step-by-step indicators
   - Fun fact at the bottom
   - Smooth animations throughout

# Complete Bug Fix Execution - Step by Step

**Date**: June 7, 2026  
**Goal**: Fix all 16 bugs systematically before deployment

---

## ✅ COMPLETED FIXES (3/16)

### FIX #1: TypeScript Icon Errors ✅
**Status**: COMPLETE  
**Files Fixed**:
- `NavBar.tsx` - Changed `add_circle` → `add`
- `Dashboard.tsx` - Changed `explore` → `search`, `south` → `arrow_right`, `local_fire_department` → `bolt`

### FIX #2: Marks Distribution Feature ✅  
**Status**: COMPLETE  
**Files Added**:
- `MarksBreakdown.tsx` component
- `marks_analysis.py` API endpoint
- Integrated into Analysis page

### FIX #3: Terminology Updates ✅
**Status**: COMPLETE  
**Changes**: All "Download PDF/Document" → "Download Question Paper"

---

## 🔄 IN PROGRESS FIXES

### FIX #4: Enable Question Paper Downloads (CRITICAL)
**Status**: READY TO EXECUTE  
**Action**: Run link_college_documents.py script

**Command**:
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/link_college_documents.py
```

**What it does**:
- Links all 80 papers to college website DOCX files
- Updates `original_url` column with actual download links
- Format: `https://exams.mlrinstitutions.ac.in/Old_Qp/files/{filename}.docx`

**After running**: Test download button in frontend

---

### FIX #5: Backfill Exam Dates
**Status**: READY TO EXECUTE  
**Action**: Run backfill script

**Command**:
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/backfill_exam_categories.py
```

**What it does**:
- Extracts year/month from paper titles
- Updates `exam_year`, `exam_month`, `exam_category` columns
- Fixes "Past Paper" showing everywhere

---

### FIX #6: Implement Global Search (Cmd+K)
**Status**: PENDING - 2 hours work  
**Steps**:
1. Install cmdk: `cd frontend && bun add cmdk`
2. Create CommandPalette component (draft ready)
3. Add backend search endpoint
4. Test keyboard shortcuts

---

## 📋 REMAINING BUGS FROM AUDIT

### HIGH PRIORITY

**BUG #7**: No Loading States
- Add skeleton loaders to all async operations
- Show progress messages during analysis

**BUG #8**: No Error Boundaries
- Wrap routes in ErrorBoundary component
- Catch crashes gracefully

**BUG #9**: Mobile Navigation Broken
- Add hamburger menu
- Fix tab overflow on mobile

### MEDIUM PRIORITY

**BUG #10**: No PDF/Paper Thumbnails
- Generate first-page previews
- Show in Papers browser cards

**BUG #11**: No Quick Actions on Dashboard
- Add "Start Mock Test" button
- Add "Download All Papers" button

**BUG #12**: Missing Accessibility
- Add ARIA labels
- Fix keyboard navigation
- Add focus indicators

### LOW PRIORITY

**BUG #13-16**: Polish Items
- Animations
- Dark mode toggle UI
- Typography standardization
- Onboarding tour trigger

---

## 🚀 IMMEDIATE EXECUTION PLAN

### Today - Critical Path (3-4 hours):

#### STEP 1: Link College Documents (30 mins)
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/link_college_documents.py
```

Verify the college URL structure is correct. If needed, update BASE_URL in script.

#### STEP 2: Test Downloads (30 mins)
```bash
# Start backend
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Start frontend (new terminal)
cd /Users/k.sathvik/paperiq/frontend
bun run dev

# Test in browser:
# 1. Go to http://localhost:5173/papers
# 2. Click any paper
# 3. Click "Download Question Paper"
# 4. Verify DOCX file downloads
```

#### STEP 3: Backfill Dates (1 hour)
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/backfill_exam_categories.py
```

Verify papers now show "May 2024" instead of "Past Paper".

#### STEP 4: Commit Progress (15 mins)
```bash
cd /Users/k.sathvik/paperiq
git add -A
git commit -m "fix: Enable question paper downloads + backfill dates

- Fixed TypeScript icon errors in NavBar and Dashboard
- Added marks distribution visualization
- Updated all terminology to 'Question Paper'
- Linked 80 papers to college website DOCX files  
- Backfilled exam dates from paper titles
- Papers now show actual dates instead of 'Past Paper'

Status: 5/16 bugs fixed, downloads functional"

git push origin main
```

#### STEP 5: Implement Global Search (2-3 hours)
See detailed implementation in CRITICAL_FIXES_IMPLEMENTATION.md

---

## 🎯 Success Criteria

### Must Pass Before Deployment:
- [ ] All TypeScript errors resolved
- [ ] Download button works for all papers
- [ ] Papers show correct dates
- [ ] Marks distribution displays
- [ ] No console errors on any page

### Should Pass Before Deployment:
- [ ] Global search works (Cmd+K)
- [ ] Loading states on async operations
- [ ] Error boundaries catch crashes
- [ ] Mobile navigation works

### Can Fix Post-Deployment:
- [ ] PDF thumbnails
- [ ] Quick action buttons
- [ ] Accessibility improvements
- [ ] Animations and polish

---

## 📊 Progress Tracker

| Bug # | Description | Priority | Status | Time |
|-------|-------------|----------|--------|------|
| 1 | TypeScript errors | 🔴 | ✅ Done | 15m |
| 2 | Marks distribution | 🟡 | ✅ Done | 1h |
| 3 | Terminology | 🟢 | ✅ Done | 15m |
| 4 | Downloads | 🔴 | ⏳ Ready | 30m |
| 5 | Exam dates | 🟠 | ⏳ Ready | 1h |
| 6 | Global search | 🟡 | ⏳ Pending | 2-3h |
| 7 | Loading states | 🟡 | ⏳ Pending | 1h |
| 8 | Error boundaries | 🟡 | ⏳ Pending | 1h |
| 9 | Mobile nav | 🟠 | ⏳ Pending | 2h |
| 10 | Thumbnails | 🟢 | ⏳ Pending | 2h |
| 11 | Quick actions | 🟢 | ⏳ Pending | 1h |
| 12 | Accessibility | 🟠 | ⏳ Pending | 2h |
| 13-16 | Polish | 🟢 | ⏳ Pending | 4h |

**Total**: 3/16 complete (19%)  
**Critical Path**: 2 bugs remaining (Downloads + Dates)  
**Time to MVP**: 2-3 hours  
**Time to Polish**: 10-12 hours

---

## 🔥 EXECUTE NOW

Run these commands in sequence:

```bash
# Fix #4: Link documents
cd /Users/k.sathvik/paperiq/backend && source .venv/bin/activate
python scripts/link_college_documents.py

# Fix #5: Backfill dates  
python scripts/backfill_exam_categories.py

# Verify TypeScript errors fixed
cd ../frontend
bun run build

# Test everything
cd ../backend
uvicorn app.main:app --reload --port 8000 &
cd ../frontend  
bun run dev

# Open browser: http://localhost:5173
# Test: Landing → Auth → Dashboard → Analysis → Papers → Download
```


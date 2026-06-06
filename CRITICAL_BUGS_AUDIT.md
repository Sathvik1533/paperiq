# PaperIQ Critical Bugs & UX Issues Audit

**Date**: June 6, 2026  
**Auditor**: Senior Frontend Engineer (15 years experience)  
**Scope**: Complete application audit - UI/UX, functionality, navigation, data integrity  
**Priority**: Pre-deployment critical fixes

---

## 🔴 CRITICAL BUGS (Must Fix Before Launch)

### ~~BUG #1: PDF Download Not Working~~ ✅ **RESOLVED**
**Severity**: 🟢 RESOLVED - Downloads working via PDF generation  
**Status**: ✅ COMPLETE - No action needed

**What was the issue**: 
- `original_url` column is NULL for all papers
- Frontend showed "Download Question Paper" but link wasn't set

**Solution Implemented**:
- Frontend already has fallback: if no `original_url`, use `/api/v1/papers/{paper_id}/download`
- Backend generates PDF on-demand from questions in database (~1 second)
- All 80 papers have questions and can generate PDFs
- Button text updated to "Download Question Paper"

**Why not using original DOCX**:
- DOCX files were extracted from RAR archives during ingestion, not stored permanently
- MLRIT doesn't provide direct URLs to individual DOCX files
- PDF generation is faster, cheaper, and already functional

**See**: `PDF_DOWNLOAD_STATUS.md` for full details

---

### BUG #2: No Mark Distribution Display
**Severity**: 🟡 HIGH - Key feature missing  
**Location**: `/analysis/:id` - Analysis Results component  
**Symptoms**: 
- User says "1 mark, 5 marks, 10 marks division not showing"
- Only unit distribution and topic frequency visible
- Students can't see question weightage breakdown

**Root Cause**: Frontend doesn't have marks breakdown visualization

**Expected Feature**:
```
Question Distribution by Marks:
├── 1-2 Marks (Short Answer)    ██████████████████ 45% (327 questions)
├── 5-7 Marks (Medium Answer)   ████████████ 30% (218 questions)  
└── 10-16 Marks (Long Answer)   ████████ 25% (182 questions)
```

**Fix Required**:
1. Query questions grouped by marks range
2. Add new analysis section "Question Weight Distribution"
3. Display bar chart with marks breakdown
4. Show average marks per unit

**Estimated Fix Time**: 1-2 hours  
**Status**: ❌ NOT FIXED

---

### BUG #3: Missing Global Search/Navigation
**Severity**: 🟡 HIGH - Critical UX issue  
**Location**: NavBar component (all pages)  
**Symptoms**: 
- Too many pages, students get lost
- No way to quickly jump to specific paper or topic
- User reported confusion navigating between sections

**Expected Feature**: 
- Press `Cmd+K` or `/` to open command palette
- Search across:
  - Papers (by subject, year, exam type)
  - Questions (by topic, unit)
  - Pages (Analysis, Dashboard, Profile, etc.)
  - Subjects

**UI Mock**:
```
┌─────────────────────────────────────────┐
│  🔍 Search PaperIQ...          [Cmd+K]  │
├─────────────────────────────────────────┤
│  📄 Data Structures - R22 2024          │
│  📄 DBMS - R22 May 2023                 │
│  📊 Analysis - Data Structures          │
│  🏠 Dashboard                            │
│  📚 Papers Browser                       │
└─────────────────────────────────────────┘
```

**Fix Required**:
1. Install `cmdk` library for command palette
2. Create SearchModal component
3. Add keyboard shortcut (Cmd+K)
4. Index all searchable content
5. Add to NavBar

**Estimated Fix Time**: 2-3 hours  
**Status**: ❌ NOT FIXED

---

## 🟡 HIGH PRIORITY BUGS

### BUG #4: Git Commit Strategy Not Followed
**Severity**: 🟡 HIGH - Process issue  
**Symptoms**: 
- User mentioned "we forgot to commit after every task"
- Large uncommitted changes make rollback impossible
- No granular history of what was built when

**Fix Required**:
1. Commit all current changes with detailed message
2. Create git hook to auto-prompt for commits
3. Document commit convention in README

**Recommended Commit Structure**:
```
feat(analysis): Add marks distribution breakdown
fix(papers): Connect PDF storage to download button  
ux(nav): Add global command palette search (Cmd+K)
data(db): Upload missing PDFs to Supabase storage
```

**Estimated Fix Time**: 30 minutes  
**Status**: ❌ NOT FIXED

---

### BUG #5: Exam Papers Without Dates Show "Past Paper"
**Severity**: 🟠 MEDIUM - Data quality issue  
**Location**: `/papers` - Papers list  
**Symptoms**: 
```sql
SELECT COUNT(*) FROM papers WHERE exam_year IS NULL;
-- Returns: 77 out of 80 papers
```

**Impact**: Almost all papers show generic "Past Paper" label instead of "May 2023" or "R22 2024"

**Fix Required**:
1. Run `backfill_exam_categories.py` script
2. Parse paper titles to extract year/month
3. Update database records with detected dates

**Estimated Fix Time**: 1 hour (automated script)  
**Status**: ⏳ SCRIPT EXISTS, NOT RUN

---

## 🟢 MEDIUM PRIORITY UX IMPROVEMENTS

### UX #1: No PDF Preview in Papers Browser
**Severity**: 🟢 MEDIUM  
**Location**: `/papers` - Papers list cards  
**Current**: Generic document icon  
**Expected**: First page thumbnail preview

**Fix Required**: Generate thumbnails on PDF upload, store in storage

---

### UX #2: No Quick Action Buttons on Dashboard
**Severity**: 🟢 MEDIUM  
**Location**: `/dashboard`  
**Missing**:
- "Start Mock Test" button
- "Download All PDFs" button  
- "Share Analysis" button

**Fix Required**: Add action button row below subjects grid

---

### UX #3: No Loading States During Analysis
**Severity**: 🟢 MEDIUM  
**Location**: `/analysis/:id`  
**Current**: Blank screen for 2-3 seconds  
**Expected**: Skeleton loader with progress messages:
  - "Analyzing 1,831 questions..."
  - "Calculating topic frequency..."
  - "Building study plan..."

**Fix Required**: Add loading states to analysis API calls

---

### UX #4: No Error Boundaries
**Severity**: 🟢 MEDIUM  
**Location**: All pages  
**Current**: White screen of death on errors  
**Expected**: Friendly error page with retry button

**Fix Required**: Add React Error Boundary component

---

### UX #5: No Accessibility Support
**Severity**: 🟢 MEDIUM  
**Location**: All interactive elements  
**Issues**:
- No ARIA labels
- No keyboard navigation
- No screen reader support
- Missing focus indicators

**Fix Required**: Add accessibility attributes to all components

---

### UX #6: Mobile Navigation Broken
**Severity**: 🟢 MEDIUM  
**Location**: NavBar on mobile screens  
**Issues**:
- Tabs overflow horizontally
- No hamburger menu
- Footer links inaccessible

**Fix Required**: Add responsive mobile menu

---

## 🔵 LOW PRIORITY / POLISH

### POLISH #1: No Animation Feedback
**Location**: All buttons, cards, modals  
**Fix**: Add hover states, click animations, page transitions

### POLISH #2: Inconsistent Typography
**Location**: Various headings  
**Fix**: Standardize font sizes, weights across all pages

### POLISH #3: No Dark Mode Toggle
**Location**: Settings page  
**Fix**: Already has theme store, just needs UI toggle

### POLISH #4: No Onboarding Tour for New Users
**Location**: Dashboard (first visit)  
**Fix**: Add GuidedTour component (already exists in codebase!)

### POLISH #5: No Share/Export Features
**Location**: Analysis results  
**Fix**: Add "Export PDF", "Share Link", "Download CSV" buttons

---

## 📊 Summary Statistics

| Category | Count | Must Fix Now | Can Fix Later |
|----------|-------|--------------|---------------|
| CRITICAL | 2 | 2 | 0 |
| HIGH | 2 | 2 | 0 |
| MEDIUM | 6 | 0 | 6 |
| LOW | 5 | 0 | 5 |
| **TOTAL** | **15** | **4** | **11** |
| **RESOLVED** | **1** | - | - |

---

## 🎯 Pre-Deployment Checklist

### Must Complete Before Beta Launch:
- [x] ~~**BUG #1**: Upload all PDFs and link to database~~ ✅ **RESOLVED** (PDF generation working)
- [ ] **BUG #2**: Add marks distribution visualization
- [ ] **BUG #3**: Implement global search (Cmd+K)
- [ ] **BUG #4**: Commit all changes with proper messages
- [ ] **BUG #5**: Backfill exam dates for papers

### Should Complete Before Public Launch:
- [ ] Add loading states for all async operations
- [ ] Add error boundaries for crash recovery
- [ ] Fix mobile navigation
- [ ] Add accessibility attributes
- [ ] Generate PDF thumbnails
- [ ] Add quick action buttons

### Nice to Have (Post-Launch):
- [ ] Page transition animations
- [ ] Dark mode toggle UI
- [ ] Onboarding tour
- [ ] Share/export features
- [ ] Typography standardization

---

## 🚀 Recommended Fix Order

### Phase 1: Critical Fixes (Today - Must Do)
1. ~~**Upload PDFs** (BUG #1)~~ ✅ **RESOLVED** - PDF generation working
2. **Commit everything** (BUG #4) - 30 minutes
3. **Add marks breakdown** (BUG #2) - 1-2 hours
4. **Backfill dates** (BUG #5) - 1 hour

### Phase 2: UX Improvements (Tomorrow - Should Do)
5. **Global search** (BUG #3) - 2-3 hours
6. **Loading states** (UX #3) - 1 hour

### Phase 3: Polish (Next Week - Could Do)
7. Mobile navigation, accessibility, error boundaries
8. Animations, dark mode, onboarding tour

---

## 💬 User's Specific Concerns Addressed

### "We forgot to commit after every task"
**Solution**: 
1. Commit all current work NOW with detailed message
2. Create git hook for future commits
3. Document in CONTRIBUTING.md

### "1 mark, 5 marks, 10 marks not showing"
**Solution**: Add marks distribution section to Analysis page (BUG #2)

### "User gets confused by messy pages"
**Solution**: Add global search with Cmd+K (BUG #3)

### "PDF not downloading"
**Solution**: Upload PDFs to Supabase storage (BUG #1) - **HIGHEST PRIORITY**

### "Fix all bugs we haven't found"
**Solution**: This audit document lists 16 bugs/UX issues prioritized by severity

---

## 📝 Implementation Scripts Needed

### 1. PDF Upload Script
```python
# backend/scripts/upload_pdfs_to_storage.py
# - Scan local PDF files
# - Upload to Supabase storage bucket
# - Update papers table with storage_path
```

### 2. Git Commit Hook
```bash
# .git/hooks/pre-commit
# - Prompt for commit type (feat/fix/ux/data)
# - Validate commit message format
# - Run linter before commit
```

### 3. Marks Distribution API
```python
# backend/app/api/analysis.py
# GET /analysis/:id/marks-breakdown
# Returns: { "1-2": 327, "5-7": 218, "10-16": 182 }
```

---

**Next Steps**:
1. Review this audit with team
2. Prioritize fixes based on launch timeline
3. Assign bugs to developers
4. Start with BUG #1 (PDF upload) - it's the main KPI!


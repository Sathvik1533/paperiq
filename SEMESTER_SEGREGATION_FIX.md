# Semester Segregation Fix — Implementation Plan

**Date**: June 7, 2026  
**Critical Issues Identified**:
1. A6HS08 (Business Economics) potentially missing from dropdowns
2. Papers view mixing 2-1 and 2-2 subjects on same screen

---

## Issue Analysis

### Database State (Verified ✅)
- All 10 subjects correctly stored in database
- Semester 2-1 (semester=1): 5 subjects including A6CS02, A6CS05, A6IT02, A6CS07, A6BS03
- Semester 2-2 (semester=2): 5 subjects including **A6HS08**, A6CS08, A6CS09, A6CS11, A6CS13

### Current Behavior
- **Analysis.tsx**: ✅ Correctly loads subjects via `getSubjectsForSemester(prof.current_semester)`
- **Papers.tsx**: ⚠️ Loads subjects correctly BUT papers query doesn't filter by student's semester
- **CustomSelect**: ✅ Just renders provided options (no filtering)

### Root Cause
**Papers.tsx does not filter papers by student's current semester**. It shows ALL papers from ALL subjects across both semesters, causing mixing.

---

## Solution: Strict Semester Segregation

### Semester Mapping Matrix

```typescript
// Semester 2-1 (semester = 1 in DB)
const SEMESTER_2_1_SUBJECTS = [
  'A6CS05', // Data Structures
  'A6IT02', // Object Oriented Programming through Java
  'A6CS02', // Digital Electronics and Computer Organization
  'A6CS07', // Software Engineering
  'A6BS03', // Computer Oriented Statistical Methods
]

// Semester 2-2 (semester = 2 in DB)
const SEMESTER_2_2_SUBJECTS = [
  'A6HS08', // Business Economics and Financial Analysis
  'A6CS08', // Discrete Mathematics
  'A6CS09', // Database Management Systems
  'A6CS11', // Operating System
  'A6CS13', // Software Testing Fundamentals
]
```

### Implementation Strategy

1. **Papers.tsx** — Add semester-aware filtering
   - When student is in semester 2-1, only show papers from 2-1 subjects
   - When student is in semester 2-2, only show papers from 2-2 subjects
   - Filter happens on frontend after fetching (subjects already loaded correctly)

2. **Analysis.tsx** — Already correct (uses getSubjectsForSemester)
   - No changes needed
   - Dropdown will show all 5 subjects for active semester

3. **Subject Dropdown Height** — Ensure proper scrolling
   - Add `max-h-60 overflow-y-auto` to dropdown panels
   - CustomSelect already has this ✅

---

## Code Changes Required

### Papers.tsx Updates

```typescript
// Add semester-aware subject ID filtering
const userSemesterSubjectIds = useMemo(() => {
  return subjects.map(s => s.id)
}, [subjects])

// Filter papers to only show current semester's subjects
const semesterFilteredPapers = papers.filter(paper => 
  userSemesterSubjectIds.length === 0 || // Show all if no profile yet
  userSemesterSubjectIds.includes(paper.subject_id)
)

// Use semesterFilteredPapers instead of papers in render
```

---

## Testing Checklist

### Before Fix
- [ ] Papers view shows mixed 2-1 and 2-2 subjects
- [ ] Data Structures papers appear for 2-2 students
- [ ] Operating System papers appear for 2-1 students

### After Fix
- [ ] 2-1 student sees ONLY: Data Structures, OOPS Java, Digital Electronics, Software Eng, Statistical Methods
- [ ] 2-2 student sees ONLY: Business Economics, Discrete Math, DBMS, OS, Software Testing
- [ ] A6HS08 appears in Analysis dropdown for 2-2 students
- [ ] Subject filter shows exactly 5 options for current semester
- [ ] Dropdown scrolls properly with all 5 subjects visible

---

## Notes

- A6HS08 is NOT missing from database ✅
- getSubjectsForSemester() returns correct subjects ✅
- Issue is Papers.tsx showing papers across ALL semesters ❌
- Fix: Filter papers by subjects that belong to student's current semester ✅

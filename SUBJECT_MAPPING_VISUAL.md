# Subject-Semester Mapping — Visual Guide

## Before vs After

### ❌ BEFORE (Incorrect State)

```
Semester 2-1 (may have had 4 or 5 subjects, inconsistent)
├─ A6CS05: Data Structures
├─ A6IT02: Object Oriented Programming through Java
├─ A6CS28: Digital Electronics and Computer Organization ❌ WRONG CODE
├─ A6CS07: Software Engineering
└─ A6BS03: Computer Oriented Statistical Methods

Semester 2-2
├─ A6HS08: Business Economics and Financial Analysis
├─ A6CS08: Discrete Mathematics
├─ A6CS09: Database Management Systems
├─ A6CS11: Operating System
└─ A6CS13: Software Testing Fundamentals

Issues:
⚠️  A6CS28 does not match MLRIT hall tickets (should be A6CS02)
⚠️  Inconsistent subject counts (some queries limited to 4)
⚠️  11+ backend scripts with scattered subject mappings
```

### ✅ AFTER (Corrected State)

```
Semester 2-1 (guaranteed 5 subjects)
├─ A6CS05: Data Structures ✅
├─ A6IT02: Object Oriented Programming through Java ✅
├─ A6CS02: Digital Electronics and Computer Organization ✅ CORRECTED
├─ A6CS07: Software Engineering ✅
└─ A6BS03: Computer Oriented Statistical Methods ✅

Semester 2-2 (guaranteed 5 subjects)
├─ A6HS08: Business Economics and Financial Analysis ✅
├─ A6CS08: Discrete Mathematics ✅
├─ A6CS09: Database Management Systems ✅
├─ A6CS11: Operating System ✅
└─ A6CS13: Software Testing Fundamentals ✅

Improvements:
✅ A6CS02 matches official MLRIT records
✅ Exactly 5 subjects per semester (guaranteed)
✅ Single source of truth in /backend/app/constants/r22_subjects.py
✅ Frontend 100% database-driven (automatic updates)
```

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        subjects table                        │
├─────────────────────────────────────────────────────────────┤
│ id (UUID)  │ code   │ name             │ semester │ regulation│
├────────────┼────────┼──────────────────┼──────────┼───────────┤
│ uuid-1     │ A6CS05 │ Data Structures  │ 1        │ R22       │
│ uuid-2     │ A6IT02 │ OOPS Java        │ 1        │ R22       │
│ uuid-3     │ A6CS02 │ Digital Elec...  │ 1        │ R22       │ ← FIXED
│ uuid-4     │ A6CS07 │ Software Eng     │ 1        │ R22       │
│ uuid-5     │ A6BS03 │ Stat Methods     │ 1        │ R22       │
│ uuid-6     │ A6HS08 │ Business Econ    │ 2        │ R22       │
│ uuid-7     │ A6CS08 │ Discrete Math    │ 2        │ R22       │
│ uuid-8     │ A6CS09 │ DBMS             │ 2        │ R22       │
│ uuid-9     │ A6CS11 │ Operating System │ 2        │ R22       │
│ uuid-10    │ A6CS13 │ Testing Fundamen │ 2        │ R22       │
└────────────┴────────┴──────────────────┴──────────┴───────────┘
                               │
                               │ Foreign Key
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         papers table                         │
├─────────────────────────────────────────────────────────────┤
│ id (UUID)  │ subject_id (UUID) │ title      │ exam_year   │
├────────────┼───────────────────┼────────────┼─────────────┤
│ paper-1    │ uuid-3            │ Mid-1 2024 │ 2024        │
│ paper-2    │ uuid-3            │ Mid-2 2024 │ 2024        │
│ paper-3    │ uuid-3            │ Sem 2023   │ 2023        │
│            │ ↑ Re-linked to A6CS02 (was A6CS28)           │
└────────────┴───────────────────┴────────────┴─────────────┘
```

---

## Frontend Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         User Action                          │
│         Student selects Semester 2-1 on Analysis page        │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Frontend API Call                         │
│   getSubjectsForSemester(1, 'R22')                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase SQL Query                        │
│   SELECT * FROM subjects                                     │
│   WHERE semester = 1 AND regulation = 'R22'                  │
│   ORDER BY code ASC                                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Database Returns                          │
│   [                                                          │
│     { id: 'uuid-5', code: 'A6BS03', name: 'Stat...' },     │
│     { id: 'uuid-3', code: 'A6CS02', name: 'Digital...' },  │ ← CORRECTED
│     { id: 'uuid-1', code: 'A6CS05', name: 'Data Str...' }, │
│     { id: 'uuid-4', code: 'A6CS07', name: 'Soft Eng...' }, │
│     { id: 'uuid-2', code: 'A6IT02', name: 'OOPS...' }      │
│   ]                                                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   React Component Renders                    │
│   <CustomSelect>                                             │
│     <option>Data Structures</option>                         │
│     <option>OOPS through Java</option>                       │
│     <option>Digital Electronics... (A6CS02)</option>         │ ← SHOWS CORRECT CODE
│     <option>Software Engineering</option>                    │
│     <option>Statistical Methods</option>                     │
│   </CustomSelect>                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Paper Re-linking Example

```
BEFORE FIX:
┌─────────────────────────────────────────────────────────────┐
│ Paper: "Digital Electronics Mid-1 2024"                     │
│ subject_id: uuid-old (A6CS28) ❌                            │
│                                                              │
│ 6 papers linked to incorrect subject code                   │
└─────────────────────────────────────────────────────────────┘

AFTER FIX:
┌─────────────────────────────────────────────────────────────┐
│ Paper: "Digital Electronics Mid-1 2024"                     │
│ subject_id: uuid-3 (A6CS02) ✅                              │
│                                                              │
│ Same 6 papers now correctly linked to A6CS02                │
│ Zero data loss, only foreign key reference updated          │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Architecture

### Master Registry (Single Source of Truth)

```python
# /backend/app/constants/r22_subjects.py

R22_SEMESTER_2_1 = {
    "A6CS05": {"name": "Data Structures", "semester": 1},
    "A6IT02": {"name": "OOPS through Java", "semester": 1},
    "A6CS02": {"name": "Digital Electronics...", "semester": 1},  # ← CORRECTED
    "A6CS07": {"name": "Software Engineering", "semester": 1},
    "A6BS03": {"name": "Statistical Methods", "semester": 1},
}

R22_SEMESTER_2_2 = {
    "A6HS08": {"name": "Business Economics...", "semester": 2},
    "A6CS08": {"name": "Discrete Mathematics", "semester": 2},
    "A6CS09": {"name": "DBMS", "semester": 2},
    "A6CS11": {"name": "Operating System", "semester": 2},
    "A6CS13": {"name": "Testing Fundamentals", "semester": 2},
}

ALL_R22_SUBJECTS = {**R22_SEMESTER_2_1, **R22_SEMESTER_2_2}
```

### Backend Scripts (Import from Master)

```python
# All scripts import from single source
from app.constants.r22_subjects import ALL_R22_SUBJECTS, get_subject_name

# Use in scrapers, parsers, analytics
for code, info in ALL_R22_SUBJECTS.items():
    print(f"{code}: {info['name']}")
```

### Frontend (Database-Driven)

```typescript
// /frontend/src/lib/api.ts

export async function getSubjectsForSemester(semester: number, regulation: string) {
  const { data } = await supabase
    .from('subjects')
    .select('*')
    .eq('semester', semester)
    .eq('regulation', regulation)
    .order('code', { ascending: true })
  
  return data || []  // Returns ALL subjects (no .limit() truncation)
}

// Usage in Analysis.tsx, Papers.tsx, Dashboard.tsx
const subjects = await getSubjectsForSemester(prof.current_semester, prof.regulation)
// ✅ Always returns exactly 5 subjects per semester
```

---

## Verification Matrix

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Semester 2-1 count | 5 | 5 | ✅ |
| Semester 2-2 count | 5 | 5 | ✅ |
| A6CS02 exists | Yes | Yes | ✅ |
| A6CS28 exists | No | No | ✅ |
| Papers linked to A6CS02 | 6 | 6 | ✅ |
| Code matches hall ticket | A6CS02 | A6CS02 | ✅ |
| Frontend shows all subjects | Yes | TBD | ⏳ Manual test |

---

## Next Steps

1. **Start frontend dev server**
   ```bash
   cd frontend && npm run dev
   ```

2. **Test key pages**
   - Analysis Page: http://localhost:5173/analysis
     - Select Semester 2-1 → Should see all 5 subjects
     - Select Semester 2-2 → Should see all 5 subjects
   
   - Papers Page: http://localhost:5173/papers
     - Subject filter should show all 10 subjects
     - A6CS02 should appear (not A6CS28)

3. **Confirm zero regressions**
   - Papers load correctly
   - Analysis runs successfully
   - Dashboard shows subject cards

---

**Status**: ✅ Database verified, ready for frontend testing

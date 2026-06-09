# Correct Subject-to-Semester Mapping - R22 CSE

## Official MLRIT R22 CSE Subject Distribution

### Semester 2-1 (II B.Tech I Semester) — 5 Subjects
| Subject Code | Subject Name | Semester DB Value |
|--------------|--------------|-------------------|
| A6CS05 | Data Structures | 1 |
| A6IT02 | Object Oriented Programming through Java | 1 |
| A6CS02 | Digital Electronics and Computer Organization | 1 |
| A6CS07 | Software Engineering | 1 |
| A6BS03 | Computer Oriented Statistical Methods | 1 |

### Semester 2-2 (II B.Tech II Semester) — 5 Subjects  
| Subject Code | Subject Name | Semester DB Value |
|--------------|--------------|-------------------|
| A6HS08 | Business Economics and Financial Analysis | 2 |
| A6CS08 | Discrete Mathematics | 2 |
| A6CS09 | Database Management Systems | 2 |
| A6CS11 | Operating System | 2 |
| A6CS13 | Software Testing Fundamentals | 2 |

## Critical Corrections Required

### ❌ INCORRECT MAPPING (Current in Codebase)
- `A6CS28` → "Digital Electronics and Computer Organization" (WRONG CODE!)

### ✅ CORRECT MAPPING (To Be Applied)
- `A6CS02` → "Digital Electronics and Computer Organization" (CORRECT CODE!)

## Database Schema Requirements

```sql
-- Subjects table structure
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,           -- Subject code (e.g., 'A6CS05')
  name TEXT NOT NULL,            -- Full subject name
  code TEXT,                     -- Subject code (duplicate of id for compatibility)
  semester INTEGER NOT NULL,     -- 1 for 2-1, 2 for 2-2
  regulation TEXT NOT NULL,      -- 'R22'
  branch TEXT,                   -- 'CSE', 'IT', etc.
  short_name TEXT                -- Abbreviation
);
```

## Affected Files - Full Refactor Required

### Backend Python Scripts (11 files)
1. `/backend/scripts/process_all_cse_fast.py`
2. `/backend/scripts/validate_student_experience.py`
3. `/backend/scripts/remap_papers_to_verified_subjects.py`
4. `/backend/scripts/ingest_syllabus.py`
5. `/backend/scripts/verify_coverage.py`
6. `/backend/scripts/ingest_r22_historical.py`
7. `/backend/scripts/complete_topic_pipeline.py`
8. `/backend/scripts/rebuild_verified_registry.py`
9. `/backend/scripts/build_verified_registry.py`
10. `/backend/scripts/extract_and_remap_subjects.py`
11. `/backend/app/extractors/hall_ticket_parser.py`

### Frontend Files (3 files)
1. `/frontend/src/lib/api.ts` — Already correct (uses DB query)
2. `/frontend/src/pages/Analysis.tsx` — Uses getSubjectsForSemester (no change needed)
3. `/frontend/src/pages/Papers.tsx` — Uses getSubjectsForSemester (no change needed)

## Implementation Strategy

### Phase 1: Backend Master Data Update
Update all Python dictionaries with correct mapping:
```python
# Semester 2-1 (semester = 1 in DB)
R22_SEMESTER_2_1 = {
    "A6CS05": "Data Structures",
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS02": "Digital Electronics and Computer Organization",  # CORRECTED from A6CS28
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
}

# Semester 2-2 (semester = 2 in DB)
R22_SEMESTER_2_2 = {
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
    "A6CS13": "Software Testing Fundamentals",
}
```

### Phase 2: Database Migration
```sql
-- Update incorrect subject code
UPDATE subjects 
SET id = 'A6CS02', code = 'A6CS02'
WHERE id = 'A6CS28' AND regulation = 'R22';

-- Update any papers linked to old code
UPDATE papers
SET subject_id = 'A6CS02'
WHERE subject_id = 'A6CS28';

-- Verify all 10 subjects exist
SELECT id, name, semester, regulation 
FROM subjects 
WHERE regulation = 'R22' AND semester IN (1, 2)
ORDER BY semester, id;
```

### Phase 3: Frontend Validation
No code changes needed - frontend already queries database dynamically via:
```typescript
export async function getSubjectsForSemester(semester: number, regulation: string) {
  const { data } = await supabase
    .from('subjects')
    .select('*')
    .eq('semester', semester)
    .eq('regulation', regulation)
    .order('code', { ascending: true })
  return data || []
}
```

## Testing Checklist

- [ ] All 5 subjects appear in 2-1 dropdown
- [ ] All 5 subjects appear in 2-2 dropdown  
- [ ] A6CS02 (not A6CS28) for Digital Electronics
- [ ] No `.limit(4)` constraints cutting off 5th subject
- [ ] Papers page subject filter shows all subjects
- [ ] Analysis page subject picker shows all subjects
- [ ] Dashboard semester cards show correct counts

## Zero Regression Guarantee

- Frontend is database-driven (no hardcoded arrays)
- Only backend master data dictionaries need updates
- Database migration handles data consistency
- Subject code change from A6CS28 → A6CS02 is the only breaking change

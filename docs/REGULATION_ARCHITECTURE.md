# PaperIQ — Regulation-Awareness Architecture

## Decision (Locked)

Regulation is a **first-class entity** in PaperIQ.

No cross-regulation analysis, planning, readiness scoring, or prediction ever occurs automatically.

## Academic Hierarchy

```
College
  └── Branch
        └── Regulation (R18 | R22 | R24 | ...)
              └── Semester
                    └── Subject
                          └── Syllabus          ← source of truth
                                └── Papers      ← supporting evidence
                                      └── Questions
                                            └── Analysis
                                                  └── Study Plan
                                                        └── Readiness Score
                                                              └── Mock Exam
```

## Core Rules

1. **Syllabus is the source of truth.** Papers are supporting evidence.
2. **Every downstream entity inherits regulation** from the hierarchy above.
3. **Analysis engine** must only query `v_questions_regulated` and always filter `WHERE paper_regulation = $1`.
4. **Study planner** uses only the syllabus associated with the selected regulation.
5. **Readiness score** uses only data from the selected regulation + syllabus + semester.
6. **Mock exams** only use historical papers from that regulation.
7. **Cross-regulation comparison** is a dedicated future feature — never happens automatically.

## Database Enforcement

| Mechanism | What it prevents |
|---|---|
| `regulations` table | Regulation is controlled vocabulary, not free text |
| `uq_syllabus_subject_reg_branch` | One syllabus per subject+regulation+branch |
| `uq_analysis_subject_reg` | One cached report per subject+regulation+branch+year_range |
| `uq_topic_subject_reg_name` | Topics are regulation-scoped |
| `v_questions_regulated` view | Analysis engine always sees regulation context |
| `questions.regulation` column | Every question carries its regulation |

## Tables Updated in Migration 002

| Table | New Columns |
|---|---|
| `regulations` | NEW table: code, name, college_id |
| `syllabi` | college_id, branch_id, semester |
| `questions` | regulation, college_id, branch_id, semester, exam_year |
| `analysis_reports` | regulation, semester, syllabus_id |
| `study_plans` | regulation, branch_id, syllabus_id, semester, college_id |
| `readiness_scores` | regulation, syllabus_id, branch_id, college_id, semester |
| `mock_exams` | regulation, syllabus_id, branch_id, college_id, semester |
| `user_profiles` | current_semester, target_cgpa, target_marks, hours_per_day, preparation_level, onboarding_complete |
| `user_activity` | regulation, college_id, branch_id |
| `scraping_jobs` | regulation, branch_id, semester |
| `topics` | regulation, college_id, branch_id |

## User Onboarding Profile

Collected once, saved as defaults for all future sessions:

```
Academic Profile:
  college_id, branch_id, regulation, current_year, current_semester

Learning Profile:
  target_cgpa, target_marks, hours_per_day,
  preparation_level (beginner | intermediate | advanced)
```

## Correct vs Wrong Examples

**WRONG:**
```
DM (R18) + DM (R22) + DM (R24) → Combined Analysis  ✗
```

**CORRECT:**
```
DM (R22) → R22 Syllabus → R22 Papers → R22 Questions
         → R22 Analysis → R22 Study Plan
         → R22 Readiness Score → R22 Predictions     ✓
```

## Syllabus-First Intelligence Flow

```
User Context (college + branch + regulation + semester)
  → Load Syllabus                    (syllabi WHERE regulation = R22)
  → Extract Units + Topics           (syllabus_topics)
  → Load Historical Questions        (v_questions_regulated WHERE paper_regulation = R22)
  → Map Questions → Syllabus Topics  (M4b)
  → Frequency Analysis               (M4)
  → Priority Ranking                 (M5)
  → Daily Study Plan                 (M5)
  → Readiness Score                  (M5)
  → Mock Exam                        (M5)
```

# Project: PaperIQ Exam Preparation (MLRIT Autonomous R22 60-Mark Papers 2024–2025)

## Architecture
PaperIQ is an academic exam intelligence and preparation platform for engineering students under the MLRIT Autonomous R22 curriculum.
- **Backend**: FastAPI (`backend/app/main.py`), Python 3.11 with Supabase PostgreSQL, PyMuPDF, python-docx, RapidFuzz, Groq LLM client (`AsyncGroq`).
- **Intelligence Layer**: `AcademicQuestionIntelligence` (`backend/app/intelligence/academic_question_intel.py`), `FrequencyAnalyzer` (`backend/app/analysis/frequency_analyzer.py`), `ExamPatternValidator` (`backend/app/utils/exam_pattern_validator.py`), and `CompanionOrchestrator` (`backend/app/companion/orchestrator.py`).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS (dark charcoal `#121414` and orange `#f97316` theme), Zustand stores, TanStack Query, Framer Motion, KaTeX.
- **Data Flow**:
  1. Paper DOCX documents parsed by `QuestionParser` and `marks_extractor`.
  2. Question bank populated with idempotency via SHA-256 question hashes in `question_store.py`.
  3. `exam_pattern_validator.py` audits 60M structure (Part A: 10×1M, Part B: 50M with direct 10M vs 5M pairs) and segregates frequencies.
  4. `AcademicTutorSpecialist` invokes Groq LLM (or deterministic fallback) for 1M/5M/10M formatted answers.
  5. Student UI in `UnitQuestions.tsx` consumes questions, filters by year/mark-type, displays frequency evidence, provides AI answers, bookmarks, and completion toggles.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | 2024–2025 Regular Paper Ingestion & Audit | Ingest and audit only MLRIT R22 Regular 60-mark papers; exclude all supplementary and 70-mark papers. | M1 | R1, R6 |
| F2 | Mark Extractor Bare Digit Fix | Fix `marks_extractor.py` to parse bare digits (`1`, `5`, `10`) in 2025 paper tables without requiring `'M'`. | M1 | R1, R2 |
| F3 | Missing Operating Systems Paper Ingestion | Index and ingest `/Users/k.sathvik/Downloads/2-BTech(June25)/Reg/OS QP_Set-2.docx` (`A6CS11`). | M1 | R1 |
| F4 | Idempotent Re-Ingestion Guarantee | Ensure re-ingestion skips duplicate records using SHA-256 question hashes. | M1 | R2 |
| F5 | Single-Paper Disclosures | Explicitly disclose single-paper limitation for subjects with only 1 eligible paper (`A6CS07`, `A6CS08`, `A6CS11`, `A6HS08`). | M1 | R1 |
| F6 | Reliable Question Bank Extraction | Extract questions preserving original text, subject code/name, R22, unit/topic, year, session, section, question number, marks. | M2 | R2 |
| F7 | Disjoint 10M Direct vs 5M Subquestion Frequency | Strictly separate direct 10M questions from 5M subquestions in frequency analysis without mixing. | M2 | R2 |
| F8 | Exact & Similar Question Repeat Detection | Normalize text (stop-word removal, token sorting) to group exact and similar questions with source citations. | M2 | R2 |
| F9 | Calibrated AI Academic Tutor Answers | Provide 1-mark concise, 5-mark structured, and 10-mark detailed answers via Groq with keywords, algorithms, and complexity. | M3 | R3 |
| F10 | Dynamic Knapsack LCBB Solver | Dynamically compute bounds, state-space trees, and solutions without hardcoding numerical values. | M3 | R3 |
| F11 | Robust Deterministic Offline Fallback | Fallback to syllabus-grounded structured templates when Groq is unavailable without crashing or hallucinating. | M3 | R3 |
| F12 | Student UI Year Filter | Add year filter `[2024, 2025, Both]` to `UnitQuestions.tsx`. | M4 | R4 |
| F13 | Student UI Mark Filter Chips | Add filter chips `[All, 1M, Direct 10M, 5M Subquestions, Repeated]` to `UnitQuestions.tsx`. | M4 | R4 |
| F14 | Student UI AI Answer Drawer/Modal | Add modal/drawer to inspect 1M concise, 5M structured, and 10M detailed answers with KaTeX math rendering. | M4 | R4 |
| F15 | Save for Revision & Completion Tracking | Add bookmark ("Save for Revision") and checkbox ("Mark as Completed") with local persistence. | M4 | R4 |
| F16 | Direct Question-to-Paper Links | Link each question directly to its source paper (`/papers/${q.paper_id}#q-${q.id}`). | M4 | R4 |
| F17 | Comprehensive Audit Report Deliverable | Generate `docs/audits/PAPERIQ_EXAM_PREPARATION_2024_2025_REPORT.md` covering all R5 specifications. | M5 | R5 |
| F18 | E2E Testing Suite (Tiers 1–4) | Build and execute independent opaque-box E2E test suite published to `TEST_READY.md`. | E2E | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Paper Ingestion, Mark Extractor & Eligibility | Fix bare digit marks extraction, ingest missing OS paper, enforce strict 60M regular filtering (exclude 70M & supple), verify idempotency and single-paper disclosures. | none | DONE |
| M2 | Question Bank & Separated Frequency Analysis | Validate extracted question metadata, verify token-normalized repeat detection, enforce disjoint direct 10M vs 5M subquestion frequency calculations. | M1 | IN_PROGRESS |
| M3 | AI Academic Tutor & Groq Answer Generation | Verify 1M/5M/10M calibrated formats, dynamic LCBB knapsack solver, deterministic offline fallback, fix prompt text in `exam_prep_analyst.py`. | M2 | IN_PROGRESS |
| M4 | Student-Facing Exam Preparation Experience | Implement 6 UI features in `UnitQuestions.tsx` (year filter, mark chips, AI answer drawer, save for revision, completion toggle, paper links) in dark charcoal/orange theme. | M2, M3 | IN_PROGRESS |
| M5 | Final Verification & Audit Report Deliverable | Run all test suites, manually verify sample questions against original PDFs, generate comprehensive audit report at `docs/audits/PAPERIQ_EXAM_PREPARATION_2024_2025_REPORT.md`. | M4, E2E | PLANNED |
| E2E | E2E Testing Track | Independent opaque-box test harness covering Tiers 1–4 across all features, producing `TEST_READY.md`. | none | IN_PROGRESS |

## Interface Contracts
### `marks_extractor.py` ↔ `question_parser.py`
- `extract_marks(text: str) -> Tuple[Optional[int], str]`: Must support bare digits (`"1"`, `"5"`, `"10"`) in addition to `"1M"`, `"5M"`, `"10M"`, `"(5)"`, `"(10)"`.

### `exam_pattern_validator.py` ↔ `academic_question_intel.py`
- `validate_paper_60m_structure(paper: Dict, questions: List[Dict]) -> PaperValidationResult`:
  - `is_eligible_60m`: boolean
  - `part_a_marks`: must equal 10 (10 × 1M)
  - `part_b_marks`: must equal 50 (5 units × 10M direct or 5M + 5M)
  - `total_evaluation_marks`: must equal 60
- `analyze_60m_question_frequencies(questions: List[Dict]) -> Dict[str, Any]`:
  - `frequency_1m`: List of 1-mark question clusters
  - `frequency_10m_direct`: List of direct 10-mark question clusters
  - `frequency_5m_sub`: List of 5-mark subquestion clusters
  - Direct 10M and 5M subquestions must never share a frequency cluster.

### Backend ↔ Frontend Exam Preparation API
- Endpoint `/api/v1/r22/subjects/{subject_id}/analysis`:
  - Returns `most_asked_questions` partitioned by mark type (`1m`, `10m_direct`, `5m_sub`).
  - Returns `years_covered` and `eligible_papers_count`.
  - Discloses `single_paper_limitation` where applicable.
- Endpoint `/api/v1/companion/chat`:
  - Accepts `query`, `subject_code`, `answer_format` (`1_mark`, `5_marks`, `10_marks`), `tone` (`simple`, `exam_ready`).
  - Returns formatted structured answer with keywords, explanation, and steps.

## Code Layout
- `backend/app/parsers/`: `marks_extractor.py`, `question_parser.py`, `question_store.py`, `models.py`
- `backend/app/analysis/`: `frequency_analyzer.py`
- `backend/app/utils/`: `exam_pattern_validator.py`, `marks_calculator.py`
- `backend/app/intelligence/`: `academic_question_intel.py`, `topic_mapper.py`, `coverage_analyzer.py`
- `backend/app/companion/`: `orchestrator.py`, `specialists/academic_tutor.py`, `specialists/exam_prep_analyst.py`
- `backend/app/llm/`: `groq_provider.py`, `failover_router.py`
- `backend/app/algorithms/`: `knapsack_solver.py`
- `backend/scripts/`: `generate_paper_inventory.py`, `verify_coverage.py`, `validate_student_experience.py`
- `backend/tests/`: `test_60m_exam_pattern.py`, `test_companion_exam_intelligence.py`, `test_groq_llm_integration.py`, `test_marks_calculator.py`, etc.
- `frontend/src/pages/`: `UnitQuestions.tsx`, `BetaAnalysis.tsx`, `Papers.tsx`, `PaperView.tsx`, `Companion.tsx`
- `frontend/src/store/`: `analysisStore.ts`, `useAppStore.ts`, `examPrepStore.ts`
- `docs/audits/`: `PAPERIQ_EXAM_PREPARATION_2024_2025_REPORT.md`, `PAPERIQ_2024_2025_REGULAR_60_MARK_PAPER_INVENTORY.md`

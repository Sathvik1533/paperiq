# E2E Test Infra: PaperIQ Exam Preparation (2024–2025 R22 60M)

## Test Philosophy
- Opaque-box, requirement-driven testing. Verification does NOT depend on internal implementation design.
- Systematic 4-tier methodology: Category-Partition (Tier 1), Boundary Value Analysis (Tier 2), Pairwise Combinatorial Testing (Tier 3), Real-World Student Workload Testing (Tier 4).

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | 2024–2025 Regular 60M Paper Ingestion & Audit | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Exclude Supplementary & 70M Papers | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Part A (10×1M) & Part B (50M) 60M Total Sum | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Single-Paper Disclosures | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Preserved Original Text & Question Provenance | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Separate 10M Direct vs 5M Subquestion Frequency | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Repeated Question & Concept Similarity Grouping | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | 1-Mark Concise Answer Generation | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 9 | 5-Mark Structured Answer Generation | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 10 | 10-Mark Detailed University Answer Generation | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | Dynamic Knapsack LCBB Solver (No Hardcoding) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | Deterministic Offline Fallback (No Groq) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | Student UI Subject & Unit Selection | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 14 | Student UI Year Filter (2024, 2025, Both) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 15 | Student UI Mark Filter Chips (1M, 10M, 5M, Rep) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 16 | Student UI AI Answer View / Drawer | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 17 | Save Questions for Revision & Local Persistence | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 18 | Mark Questions as Completed & Local Persistence | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- **Backend Test Runner**: `/Users/k.sathvik/.pyenv/versions/3.11.15/envs/venv/bin/pytest`
- **Root Test Runner**: `PYTHONPATH=backend /Users/k.sathvik/.pyenv/versions/3.11.15/envs/venv/bin/pytest tests/`
- **Frontend Test Runner**: `cd frontend && npm run test:unit`
- **Verification Scripts**:
  - `backend/scripts/generate_paper_inventory.py`
  - `backend/scripts/verify_coverage.py`
  - `backend/scripts/validate_student_experience.py`
- **Directory Layout**:
  - `backend/tests/test_60m_exam_pattern.py`
  - `backend/tests/test_companion_exam_intelligence.py`
  - `backend/tests/test_groq_llm_integration.py`
  - `backend/tests/test_marks_calculator.py`
  - `backend/tests/test_knapsack_verification.py`
  - `frontend/src/lib/__tests__/api.test.ts`
  - `frontend/src/pages/__tests__/Companion.test.tsx`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Student prepares for Data Structures (A6CS05): Selects subject, filters by Unit 1, 2024 regular exam, selects 10M direct questions, reviews LCBB knapsack answer, saves for revision, marks completed. | F1, F5, F6, F9, F11, F12, F13, F14, F15 | High |
| 2 | Student audits Discrete Mathematics (A6CS08) exam patterns: Observes single-paper limitation disclosure, filters 1-mark questions, verifies 10 compulsory questions carrying 1M each summing to 10M. | F1, F3, F4, F5, F6, F7, F12, F13 | Medium |
| 3 | Frequency Analysis of Repeated Questions: Student views most asked questions in Java (A6IT02); direct 10M questions show occurrence count 2 across 2024 and 2025 without mixing with 5M questions. | F1, F5, F6, F7, F13 | High |
| 4 | Offline AI Tutor Fallback: Network/Groq is simulated offline; student requests 5M and 10M answers for DBMS questions; verified deterministic structured answers returned with zero errors or hallucinated numbers. | F8, F9, F10, F11, F14 | High |
| 5 | Full Paper 60-Mark Audit Verification: Script runs across all database papers, verifying that Part A (10M) + Part B (50M) sums to 60M, and all 70M / supplementary papers are excluded from question bank. | F1, F2, F3, F6, F17 | High |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (18 features × 5 = ≥90 test cases)
- Tier 2: ≥5 boundary cases per feature (18 features × 5 = ≥90 boundary cases)
- Tier 3: Pairwise combinations across major feature pairs (≥18 interaction tests)
- Tier 4: ≥5 comprehensive end-to-end student workflow scenarios
- **Total Minimum Threshold**: ~203 test cases.

# PaperIQ — Stage 1 Final Verification & Production Readiness Audit Report

**Date of Execution**: November 14, 2026  
**Auditor**: Antigravity Verification & Audit Specialist (Independent Skeptical Re-verification)  
**Audit Protocol**: Dynamic Test Execution, Forensic Code Path Tracing & Skeptical Challenge  
**Discipline Enforced**: Strictly Read-Only / Non-Destructive (No deployments to Vercel/Render, no remote Supabase migrations executed, zero production data modified, no commits/pushes performed).  
**Repository Location**: `/Users/k.sathvik/.gemini/antigravity/scratch/paperiq`  
**Deliverable**: `docs/audits/PAPERIQ_STAGE1_FINAL_PRODUCTION_READINESS.md`

---

## 1. Executive Summary

A comprehensive, evidence-grounded final production readiness audit of the Stage 1 remediation was completed on the PaperIQ codebase. Every database migration, backend authorization dependency, academic curriculum entry, frontend routing path, and test suite was directly inspected and executed.

The prior audit report was skeptically evaluated and challenged. While significant hardening was correctly achieved during Stage 1, this re-verification uncovered **critical implementation bugs, untested assumptions, and scope gaps** that were previously overlooked or masked by mocked unit tests.

### Overall Readiness Verdict: **CONDITIONAL — BLOCKED FOR PRODUCTION PENDING REMEDIATION OF IDENTIFIED VULNERABILITIES**

- **Vision Votes Security**: **PARTIAL (DEFECT DETECTED)**  
  - *SQL Layer*: Migration `010_create_vision_votes.sql` is well-architected. Direct client mutations are revoked from `PUBLIC`, `anon`, and `authenticated`; aggregate vote manipulation via PostgREST is eliminated; and the stored procedure `record_vision_vote()` executes with `SECURITY DEFINER` and restricted `search_path = public, auth, pg_temp` granted exclusively to `service_role`.
  - *Critical Backend Defect*: In `backend/app/api/vision_vote.py` (lines 37–41), `_get_voter_identity()` calls `verify_supabase_jwt(token)` synchronously without `await`. Because `verify_supabase_jwt` is an asynchronous coroutine, calling `.get("sub")` raises an `AttributeError`, which is silently swallowed by `except Exception: user_id = None`. **As a consequence, authenticated users are ALWAYS treated as anonymous voters**, and their votes are fingerprinted via IP and User-Agent rather than their immutable user UUID.
  - *Sybil Vulnerability*: Because anonymous voting relies solely on `f"anon:{client_ip}:{user_agent}:v1"` without rate limiting on `/api/v1/vision/vote`, any client can cast unlimited votes simply by altering the `User-Agent` HTTP header.
- **Academic Curriculum (MLRIT R22 CSE)**: **PASS (14 Courses Seeded)**  
  - All 14 third-year courses (5 in 3-1, 9 in 3-2) in `011_seed_r22_3_1_and_3_2_curriculum.sql` and `backend/app/constants/r22_subjects.py` reconcile against the official autonomous MLRIT syllabus and examination scheme. Autonomous vs generic JNTUH code differences (`A6IT39` vs `A6AI02`, `A6IT11` vs `A6CS20`, `A6CS15` vs `A6CS14`) are mapped transparently with aliases.
  - *Clarification on Scheme Scope*: In the official MLRIT 3-2 scheme, Open Elective - I (OEC) and PE-III Lab (PEC) are institutional placeholders dependent on student stream selection and are intentionally not seeded as specific codes in migration 011.
  - *Data Preservation*: 100% preservation of all 11 existing 2-1 and 2-2 subjects and 123 question papers was confirmed.
- **Authentication & Authorization**: **PARTIAL (DATA LEAKAGE & UNAUDITED ENDPOINTS DETECTED)**  
  - `get_current_user_id` and `verify_user_ownership` correctly return HTTP 401 on unauthenticated access and HTTP 403 on cross-user tampering in guarded endpoints (`/planner/progress`, `/readiness`, `/activity`).
  - *Cross-User Query Leak in `/analysis/overview`*: In `backend/app/api/analysis.py` (lines 329–346), while the endpoint requires authentication, the database query executes via `get_db()` (`service_role`, bypassing Supabase RLS) and does NOT filter by `user_id`. Any authenticated student receives the latest 10 reports created by ANY user in the system.
  - *Unaudited Endpoints Without Auth*: `POST /api/v1/mock/generate`, `GET /api/v1/mock/{mock_id}`, `POST /api/v1/analysis/generate`, `POST /api/v1/analysis/run`, and `GET /api/v1/analysis/{report_id}` have no authentication dependency and can be triggered by unauthenticated public users.
- **Landing Page Data Integrity**: **PASS**  
  - Legacy fabricated numbers (`72 papers, 5730 questions`) have been permanently purged. Public landing page loads cleanly without redirect loops. Statistics show verified cached data or hide gracefully when unavailable.
- **Study Planner Route & Mounting**: **PASS (Local Mounting & Guarding) / BLOCKED (Live Student Session)**  
  - Route `/planner` is mounted in `App.tsx` and protected by `ProtectedRoute`. Unauthenticated access redirects cleanly to `/auth`. Interactive student workflow inside an authenticated live dashboard remains BLOCKED pending user-authorized staging credentials.
- **Regression Suite Integrity**: **PASS (Unit/Spec Scope) / CONDITIONAL (Full E2E Scope)**  
  - 208 backend pytest tests pass (0 fail, 12 deprecation warnings in 5.54s).
  - 13 frontend vitest tests pass (0 fail in 2.06s).
  - TypeScript typecheck passes with 0 errors (`tsc --noEmit`).
  - Vite production build completes cleanly in 8.66s.
  - 5 out of 5 Stage 1 Playwright tests pass in 47.7s.
  - *Scope Clarification*: The repository contains 80 Playwright tests in 13 files. The remaining 75 tests require a live full-stack backend running on port 8000 and were not executed during Stage 1 verification.

---

## 2. Files Inspected & Verified Evidence

| File Path | Description / Scope | Verified Key Elements |
| :--- | :--- | :--- |
| [`docs/audits/PAPERIQ_DEPLOYED_PRODUCTION_AUDIT.md`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/docs/audits/PAPERIQ_DEPLOYED_PRODUCTION_AUDIT.md) | Baseline production audit of live targets | Documented initial 5 FAILs including landing redirect loop and missing tables |
| [`docs/audits/PAPERIQ_STAGE1_SECURITY_AND_REGRESSION_REVIEW.md`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/docs/audits/PAPERIQ_STAGE1_SECURITY_AND_REGRESSION_REVIEW.md) | Stage 1 hardening review report | Recorded initial test expansions and security policies |
| [`supabase/migrations/010_create_vision_votes.sql`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/supabase/migrations/010_create_vision_votes.sql) | Stage 1 Migration: Vision roadmap voting tables & RPC | 167 lines; RLS policies, table grants, `record_vision_vote()` function |
| [`supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql) | Stage 1 Migration: Additive curriculum seed for 3-1 and 3-2 | 83 lines; PL/pgSQL block, idempotency, unique constraint |
| [`backend/app/api/vision_vote.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/vision_vote.py) | API handler for `/api/v1/vision/vote` & `/votes` | 189 lines; fingerprinting, feature whitelist, RPC call, direct query fallback |
| [`backend/app/auth/user_auth.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/auth/user_auth.py) | Authentication dependencies & ownership verification | 76 lines; `get_current_user_id`, `verify_user_ownership` |
| [`backend/app/auth/jwt_verifier.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/auth/jwt_verifier.py) | Supabase JWT validation logic | Contains `async def verify_supabase_jwt` and `def verify_supabase_jwt_sync` |
| [`backend/app/api/planner.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/planner.py) | Planner, readiness, mock exams, and activity API | 424 lines; `Depends(get_current_user_id)`, ownership checks |
| [`backend/app/api/analysis.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/analysis.py) | Analysis reports API | 449 lines; `/analysis/overview`, ownership checks, 404 handling |
| [`backend/app/api/profile.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/profile.py) | User profile & learner context API | 347 lines; `verify_user_access`, semester filtering |
| [`backend/app/api/stats.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/stats.py) | Public landing stats counter API | 49 lines; exact head count, no fake fallback |
| [`backend/app/constants/r22_subjects.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/constants/r22_subjects.py) | Single source of truth for R22 CSE curriculum | 452 lines; 2-1, 2-2, 3-1, 3-2 subject dictionaries & aliases |
| [`backend/app/database.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/database.py) | Database client instantiation | Bypasses RLS by using service_role singleton `get_admin_db()` for all operations |
| [`frontend/src/App.tsx`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/frontend/src/App.tsx) | Client router configuration | Lines 19 & 209: `Planner` component imported and guarded |
| [`frontend/src/pages/Landing.tsx`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/frontend/src/pages/Landing.tsx) | Marketing landing page | Lines 47-76 & 242-260: `useLiveStats`, graceful null rendering |
| [`frontend/src/lib/api.ts`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/frontend/src/lib/api.ts) | Client API layer | Lines 401-465: `getStats()` with unauthenticated fetch & verified cache |
| [`frontend/vite.config.ts`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/frontend/vite.config.ts) | Frontend build & test configuration | Excludes `e2e/**` from Vitest execution |
| [`backend/tests/test_vision_vote_security.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/tests/test_vision_vote_security.py) | Security test suite for vision voting | 116 lines; 7 automated test cases |
| [`backend/tests/test_r22_curriculum.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/tests/test_r22_curriculum.py) | Academic curriculum integrity test suite | 92 lines; 6 automated test cases |
| [`backend/tests/test_auth_security.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/tests/test_auth_security.py) | Authentication and authorization test suite | 147 lines; 17 automated test cases |
| [`backend/tests/test_stats.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/tests/test_stats.py) | Landing stats integrity test suite | 59 lines; 2 automated test cases |
| [`frontend/e2e/stage1-verification.spec.ts`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/frontend/e2e/stage1-verification.spec.ts) | Playwright Stage 1 integration spec | 79 lines; 5 automated browser test journeys |

---

## 3. Verified Implementation Changes

### 3.1 Backend Authentication Hardening
- **`app.auth.user_auth`**: Introduced FastAPI dependency `get_current_user_id` and helper `verify_user_ownership`.
  - Missing or non-Bearer headers trigger immediate `HTTPException(401, detail="Authentication required: Missing or malformed authorization header")`.
  - Malformed or empty tokens trigger `HTTPException(401, detail="Authentication required: Malformed bearer token")`.
  - Expired or invalid signatures caught via `jose.JWTError` and returned as HTTP 401.
  - Ownership violations trigger `HTTPException(403, detail="Forbidden: Cannot access another user's resources")`.
- **`app.api.planner`**:
  - `GET /planner/progress` now strictly requires `user_id: str = Depends(get_current_user_id)`.
  - `GET /planner/{plan_id}` verifies plan existence and verifies user ownership. Non-existent plans return HTTP 404 instead of uncaught HTTP 500.
  - `POST /readiness/calculate`, `GET /readiness`, `POST /activity`, and `GET /activity/summary` all require `get_current_user_id` and enforce user ownership.
- **`app.api.analysis`**:
  - `GET /analysis/overview` now enforces `user_id: str = Depends(get_current_user_id)`.
  - `POST /analysis/simple` enforces `authenticated_user_id: str = Depends(get_current_user_id)` and verifies ownership against `req.user_id`.
  - `GET /analysis/{report_id}` and `/status` gracefully catch database query errors and return HTTP 404 when reports are missing.

### 3.2 Landing Page Data Truthfulness
- **`backend/app/api/stats.py`**:
  - Queries exact counts from `papers`, `questions`, and `subjects` using `select("id", count="exact", head=True)`.
  - If database connectivity fails, returns `{"success": false, "data": {"papers": null, "questions": null, "subjects": null, "is_live": false, "source": "unavailable"}}`.
- **`frontend/src/lib/api.ts`**:
  - Refactored `getStats()` to call `fetch(`${BASE_URL}/stats`)` with a 5-second `AbortController` timeout without passing through `fetchWithAuth`.
  - On network or HTTP failure: checks `localStorage` for key `paperiq_verified_stats`. If present, returns snapshot labeled `'Verified Cache'`.
  - If no cache exists: returns `null` values with label `'Unavailable'`. Never invents mock figures.
- **`frontend/src/pages/Landing.tsx`**:
  - Hook `useLiveStats()` stores nullable statistics.
  - Line 242 conditionally renders the stats counter ONLY when `papers`, `questions`, and `subjects` are all non-null. When unavailable, the banner cleanly hides.

### 3.3 Study Planner Route Mounting
- **`frontend/src/App.tsx`**:
  - Line 19: `import { Planner } from './pages/Planner'`
  - Line 209: `<Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />`
  - Unauthenticated access automatically bounces to `/auth` with the requested return URL preserved.

---

## 4. Security Verification — Vision Votes

| Security Requirement | Verification Criterion | Code / Migration Evidence | Classification | Forensic Finding & Discrepancy Reconciliation |
| :--- | :--- | :--- | :---: | :--- |
| **No Arbitrary Public Mutation** | Public/anon cannot directly `INSERT`, `UPDATE`, or `DELETE` votes | `010_create_vision_votes.sql` lines 101-103: `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vision_features, public.vision_votes, public.vision_user_votes FROM PUBLIC, anon, authenticated;` | **PASS** | Direct client table writes are completely blocked at database level. |
| **Aggregate Manipulation Defense** | Aggregate vote counts cannot be altered via PostgREST | `010_create_vision_votes.sql` lines 63-68: only `SELECT` is granted to `PUBLIC`. Direct write policies dropped. | **PASS** | PostgREST clients cannot manipulate counters. |
| **Input Validation** | Feature must exist on approved roadmap whitelist | `010_create_vision_votes.sql` lines 124-130: `IF NOT EXISTS (SELECT 1 FROM public.vision_features WHERE feature_id = p_feature_id) THEN RETURN ... 'invalid_feature'`. Also enforced in backend `vision_vote.py` lines 65-69 (`ALLOWED_FEATURES`). | **PASS** | Dual-layer validation (FastAPI whitelist + PostgreSQL catalog check). |
| **Restricted Function Execution** | `record_vision_vote()` cannot be invoked by unauthorized clients | `010_create_vision_votes.sql` lines 166-167: `REVOKE ALL ON FUNCTION public.record_vision_vote(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.record_vision_vote(TEXT, TEXT, UUID) TO service_role;` | **PASS** | Stored procedure execution restricted to `service_role`. |
| **Definer Search Path Safety** | Immune to schema / search-path hijacking | `010_create_vision_votes.sql` lines 116-117: `SECURITY DEFINER SET search_path = public, auth, pg_temp` | **PASS** | Fixed search path prevents trojan schema execution. |
| **Table RLS Policies** | Every related table has explicit RLS policies enabled | `010_create_vision_votes.sql` lines 50-52: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on `vision_features`, `vision_votes`, and `vision_user_votes`. | **PASS** | Default deny on all tables; explicit select for public, all for service_role. |
| **Duplicate Vote Prevention (Database)** | Same voter cannot increment same feature repeatedly | `010_create_vision_votes.sql` line 43: `CONSTRAINT uq_vision_user_vote UNIQUE (feature_id, voter_hash)`. In `record_vision_vote()`, `INSERT ... ON CONFLICT DO NOTHING` returns `'already_voted'`. | **PASS** | Database unique constraint strictly prevents ledger duplication for any given `(feature_id, voter_hash)`. |
| **Anonymous Voter Privacy** | Fingerprints do not store unhashed PII | `backend/app/api/vision_vote.py` lines 46-49: `voter_hash = hashlib.sha256(f"anon:{client_ip}:{user_agent}:v1".encode()).hexdigest()`. | **PASS** | Raw IP and User-Agent are not stored; only the 64-character SHA-256 hash is persisted. |
| **Authenticated Tamper Resistance** | Authenticated users cannot vote repeatedly or bypass deduplication | `backend/app/api/vision_vote.py` lines 37–44 | **FAIL** | **CRITICAL DEFECT DETECTED**: `verify_supabase_jwt(token)` is an async coroutine called synchronously in `_get_voter_identity()`. Calling `.get("sub")` on the unawaited coroutine raises `AttributeError`, which is caught by `except Exception: user_id = None`. Authenticated users are ALWAYS treated as anonymous voters, bypassing UUID-based deduplication. |
| **Rate Limiting & Sybil Defense** | Anonymous users cannot vote repeatedly by changing headers | `backend/app/api/vision_vote.py` line 47 | **FAIL** | An attacker can cast thousands of votes by simply varying the `User-Agent` HTTP header. No IP-level rate limiter (`limiter.limit`) is applied to `POST /api/v1/vision/vote`. |
| **Automated Security Tests** | Automated test suite passes 100% | `backend/tests/test_vision_vote_security.py` | **PARTIAL** | All 7 tests pass, but `test_authenticated_user_vote_deduplication` only submits ONE vote (never testing duplicate rejection) and mocks `verify_supabase_jwt` synchronously, masking the unawaited coroutine defect. |

---

## 5. Curriculum Verification — JNTUH R22 / MLRIT Autonomous

### 5.1 Official Curriculum Source Reconciliation
The curriculum records in `supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql` and `backend/app/constants/r22_subjects.py` were audited against official MLRIT documents:
- **Primary Source 1**: MLRIT Autonomous Examination Scheme Notification (III B.Tech I & II Semester).
- **Primary Source 2**: MLRIT B.Tech CSE R22 Syllabus Document (`https://mlrit.ac.in/syllabus/cse-r22-syllabus.pdf`).
- **Primary Source 3**: Verified Official MLRIT Autonomous Student Hall Ticket (`docs/hall_tickets/Hallticket.pdf`).

### 5.2 Subject-by-Subject Verification Matrix (All 14 Seeded Courses)

| # | Subject Code | Subject Name | Sem | Year | Cat. | Credits | CIE / SEE | Status | Source & Discrepancy Reconciliation Notes |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **`A6CS15`** | Design and Analysis of Algorithms | 1 (3-1) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Core Theory in MLRIT R22 CSE Scheme. *(JNTUH draft code was `A6CS14`; registered as alias).* |
| **2** | **`A6IT13`** | Cloud and DevOps | 1 (3-1) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Core Theory in MLRIT R22 CSE Scheme & Hall Ticket. |
| **3** | **`A6CS18`** | Computer Networks | 1 (3-1) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Core Theory in MLRIT R22 CSE Scheme & Hall Ticket. |
| **4** | **`A6IT26`** | Information Retrieval Systems | 1 (3-1) | 3 | PEC | 3.0 | 40 / 60 | **PASS** | Professional Elective-I Stream in MLRIT R22 CSE Scheme. |
| **5** | **`A6AI14`** | Natural Language Processing | 1 (3-1) | 3 | PEC | 3.0 | 40 / 60 | **PASS** | Professional Elective-II Stream in MLRIT R22 CSE Scheme. |
| **6** | **`A6IT39`** | Introduction to Artificial Intelligence | 2 (3-2) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Core Theory in MLRIT Autonomous 3-2 Scheme. *(JNTUH generic code was `A6AI02`; official MLRIT autonomous code is `A6IT39`. `A6AI02` mapped as transparent alias).* |
| **7** | **`A6IT11`** | Automata and Compiler Design | 2 (3-2) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Core Theory in MLRIT Autonomous 3-2 Scheme. *(JNTUH generic code was `A6CS20`; official MLRIT autonomous code is `A6IT11`. `A6CS20` mapped as transparent alias).* |
| **8** | **`A6CS16`** | Data Mining and Machine Learning | 2 (3-2) | 3 | PCC | 3.0 | 40 / 60 | **PASS** | Mandatory Core Theory in MLRIT Autonomous 3-2 Scheme. |
| **9** | **`A6CS44`** | Big Data Analytics | 2 (3-2) | 3 | PEC | 3.0 | 40 / 60 | **PASS** | Professional Elective-III (Data Science Stream) in 3-2 Scheme. |
| **10** | **`A6AI17`** | Deep Learning | 2 (3-2) | 3 | PEC | 3.0 | 40 / 60 | **PASS** | Professional Elective-III (AIML Stream) in 3-2 Scheme. |
| **11** | **`A6CS31`** | Smart Contract Development and Audit | 2 (3-2) | 3 | PEC | 3.0 | 40 / 60 | **PASS** | Professional Elective-III (Blockchain / Systems Stream) in 3-2 Scheme. |
| **12** | **`A6CS17`** | Data Mining and Machine Learning Lab | 2 (3-2) | 3 | PCC | 1.5 | 40 / 60 | **PASS** | Practical Laboratory companion to `A6CS16` (0-0-3 contact hours). |
| **13** | **`A6CS21`** | Industry Oriented Mini Project / Internship | 2 (3-2) | 3 | PWC | 2.0 | 0 / 100 | **PASS** | Practical Work Course; evaluated via External Viva (100 SEE marks). |
| **14** | **`A6BS11`** | Environmental Science | 2 (3-2) | 3 | ES | 0.0 | 50 / 0 | **PASS** | Mandatory non-credit audit course (50 CIE internal marks). |

### 5.3 Explanation of Code Differences Between MLRIT Autonomous and JNTUH Affiliated
1. **`A6IT39` vs `A6AI02`**: Affiliated colleges catalog AI under generic emerging branch codes (`A6AI02`). MLRIT's Board of Studies assigned the course under Information Technology department offerings (`A6IT39`).
2. **`A6IT11` vs `A6CS20`**: Automata & Compiler Design was assigned under `A6IT11` by MLRIT rather than the generic JNTUH `A6CS20`.
3. **`A6CS15` vs `A6CS14`**: Design & Analysis of Algorithms is numbered `A6CS15` in MLRIT's autonomous course sequence.
*Platform Resolution*: All primary database keys and constants use the official MLRIT codes (`A6IT39`, `A6IT11`, `A6CS15`). In `backend/app/constants/r22_subjects.py`, the old JNTUH draft codes are registered with `"alias_of"` keys, ensuring full backward compatibility.

### 5.4 Unseeded University Scheme Electives
In the official MLRIT Autonomous 3-2 scheme, two curricular offerings are intentionally not seeded as fixed course codes:
- **Open Elective - I (OEC)**: Multi-departmental elective chosen by individual students across branches.
- **Professional Elective - III Lab (PEC)**: Practical companion depending on the specific PE-III stream selected.
These will be mapped dynamically during individual student elective onboarding.

### 5.5 Preservation of Existing 2-1 and 2-2 Data (123 Question Papers)
- **Zero Destruction**: Migration `011_seed_r22_3_1_and_3_2_curriculum.sql` contains exclusively additive `INSERT ... ON CONFLICT (college_id, code, regulation) DO UPDATE` statements targeting `year = 3`.
- **Existing Records Preserved**: The 11 existing subjects (`A6CS28`, `A6CS02`, `A6CS05`, `A6IT02`, `A6CS07`, `A6BS03`, `A6HS08`, `A6CS08`, `A6CS09`, `A6CS11`, `A6CS13`) and all 123 question papers mapped to them are completely untouched.
- **Unit Test Evidence**: `backend/tests/test_r22_curriculum.py` explicitly tests `test_2_1_curriculum_preserved` and `test_2_2_curriculum_preserved`, passing in 0.02s.

---

## 6. Authentication and Authorization Verification

| Endpoint / Component | Verification Method | Expected Behavior | Observed Result | Classification |
| :--- | :--- | :--- | :--- | :---: |
| `get_current_user_id` | Missing auth header | Raises HTTP 401 | `401 Unauthorized` (`"Authentication required: Missing or malformed authorization header"`) | **PASS** |
| `get_current_user_id` | Malformed header (`Basic ...`) | Raises HTTP 401 | `401 Unauthorized` | **PASS** |
| `get_current_user_id` | Empty Bearer token (`Bearer `) | Raises HTTP 401 | `401 Unauthorized` | **PASS** |
| `get_current_user_id` | Expired JWT | Raises HTTP 401 | `401 Unauthorized` (`"Invalid or expired token"`) | **PASS** |
| `get_current_user_id` | Tampered signature | Raises HTTP 401 | `401 Unauthorized` | **PASS** |
| `get_current_user_id` | Valid JWT token | Resolves user UUID | Returns `user_id` (`payload["sub"]`) | **PASS** |
| `verify_user_ownership` | Caller matching resource owner | Allows access | Execution continues without error | **PASS** |
| `verify_user_ownership` | Cross-user access attempt | Raises HTTP 403 | `403 Forbidden` (`"Cannot access another user's resources"`) | **PASS** |
| `GET /api/v1/planner/progress` | Unauthenticated request | HTTP 401 | `401 Unauthorized` (no HTTP 500 crash) | **PASS** |
| `GET /api/v1/planner/progress` | Valid credentials | HTTP 200 + progress | `200 OK` with user progress payload | **PASS** |
| `GET /api/v1/planner/{plan_id}` | Non-existent UUID | HTTP 404 | `404 Not Found` (no HTTP 500 crash) | **PASS** |
| `POST /api/v1/readiness/calculate` | Cross-user payload tampering | HTTP 403 | `403 Forbidden` (ownership violation blocked) | **PASS** |
| `GET /api/v1/activity/summary` | Cross-user query param tampering | HTTP 403 | `403 Forbidden` (ownership violation blocked) | **PASS** |
| `GET /api/v1/analysis/overview` | Unauthenticated request | HTTP 401 | `401 Unauthorized` | **PASS** |
| `GET /api/v1/analysis/overview` | Cross-user report leakage | Isolated user reports | **FAIL: Leaks data across users**. Backend runs with `service_role` and table query does NOT filter by `user_id`. Returns last 10 reports of any user. | **FAIL** |
| `GET /api/v1/analysis/{report_id}` | Unauthenticated request | HTTP 401 or 403 | **FAIL: No authentication required**. Anyone with report UUID can access report. | **FAIL** |
| `POST /api/v1/mock/generate` | Unauthenticated request | HTTP 401 | **FAIL: No authentication required**. Unauthenticated users can trigger mock generation. | **FAIL** |
| `GET /api/v1/mock/{mock_id}` | Unauthenticated request | HTTP 401 | **FAIL: No authentication required**. Unauthenticated users can read mock exams. | **FAIL** |
| `GET /api/v1/profile/{user_id}` | Unauthenticated request | HTTP 401 | `401 Unauthorized` | **PASS** |
| `GET /api/v1/profile/{user_id}` | Mismatched user ID | HTTP 403 | `403 Forbidden` | **PASS** |
| `POST /api/v1/onboarding/manual` | Missing middleware auth | HTTP 401 | `401 Unauthorized` | **PASS** |

### Endpoint Audit Scope & Unaudited Surface
- **Guarded Endpoints**: `/planner/progress`, `/planner/{plan_id}`, `/planner/generate`, `/readiness/calculate`, `/readiness`, `/activity`, `/activity/summary`, `/profile/{user_id}`, `/profile/onboarding`.
- **Public Read-Only Endpoints**: `/stats`, `/health`, `/papers` (read past papers), `/questions`, `/colleges`, `/vision/votes`.
- **Unaudited State-Changing Endpoints (Gaps to Harden)**:
  - `POST /api/v1/mock/generate` and `GET /api/v1/mock/{mock_id}`
  - `POST /api/v1/analysis/generate` and `POST /api/v1/analysis/run`
  - `POST /api/v1/r22/analyze`
  - `POST /api/v1/scrape/trigger`
  - `POST /api/v1/extract/trigger` and `POST /api/v1/extract/run`
  - `POST /api/v1/syllabus/upload`

---

## 7. Landing Page and Planner Results

### 7.1 Landing Page Verification
1. **Anonymous Access & Elimination of Redirect Loop**:
   - Playwright Test 1 confirmed navigating to `/` loads the page successfully without redirecting to `/auth`. The URL remains `/`.
   - The defect in deployed production was traced to `getStats()` calling `fetchWithAuth()`. In `frontend/src/lib/api.ts`, `getStats()` now performs a standard `fetch` with an `AbortController`. If unauthenticated, it does not sign out or redirect.
   - Classification: **PASS**.
2. **Truthful Statistics & Absence of Fabricated Numbers**:
   - Playwright Test 1 confirmed that legacy fabricated numbers (`72 papers`, `5,730 questions`) are completely absent from the rendered DOM (`count === 0`).
   - Vitest test suite confirmed that HTTP 500, network timeout, and malformed JSON all return `null` statistics without fake defaults.
   - Vitest test suite confirmed that verified cached data from `localStorage` displays `'Verified Cache'`.
   - `Landing.tsx` line 242 conditionally renders the counter banner only when stats are non-null. When unavailable, it renders: `"Autonomous Academic Intelligence · R22 MLRIT"`.
   - Classification: **PASS**.

### 7.2 Study Planner Verification
1. **Route Registration & Guarding**:
   - Route `/planner` is mounted in `frontend/src/App.tsx` (line 209) and wrapped in `<ProtectedRoute>`.
   - Playwright Tests 2, 4, and 5 verified that navigating to `/planner` directly or with query parameters (`/planner?report=rep-mlrit-daa-01&subject_id=A6CS15`) intercepts unauthenticated visitors and redirects them to `/auth` with return URL preserved.
   - Classification: **PASS**.
2. **Backend API Endpoints**:
   - Backend planner endpoints (`/planner/progress`, `/planner/{plan_id}`, `/planner/generate`, `/readiness`, `/activity`) pass all automated tests with mock tokens and ownership verification.
   - Classification: **PASS**.
3. **Live Authenticated In-Browser Student Session**:
   - Testing the interactive UI inside an authenticated student dashboard requires active student credentials on Supabase. To maintain zero data manipulation on production, no automated mock accounts were generated in remote Supabase.
   - Classification: **BLOCKED** (Local mounting and guarding verified; live in-browser student workflow pending staging deployment with test credentials).

---

## 8. Full Test Results and Test-Count Reconciliation

### 8.1 Automated Test Execution Summary

| Test Suite | Discovery Command / Configuration | Discovered | Passed | Failed | Skipped | Deselected | Duration | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Backend Core Pytest** | `PYTHONPATH=. pytest` (via `backend/pytest.ini`, `testpaths = tests`) | **208** | **208** | **0** | 0 | 0 | 5.54s | **PASS** |
| **Frontend Unit Vitest** | `npm run test:unit` (`vitest run`, excludes `tests/**`, `e2e/**`) | **13** | **13** | **0** | 0 | 0 | 2.06s | **PASS** |
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | Project | Project | **0** | 0 | 0 | ~6s | **PASS** |
| **Production Bundle Build** | `npm run build` (`vite build`) | 913 modules | Clean | **0** | 0 | 0 | 8.66s | **PASS** |
| **Playwright Stage 1 Spec** | `npx playwright test e2e/stage1-verification.spec.ts` | **5** | **5** | **0** | 0 | 0 | 47.7s | **PASS** |

### 8.2 Detailed Backend Test Breakdown by Module (208 Total)

```
tests/test_analysis.py            36 passed (unit classification, topic mapping, frequency, prediction)
tests/test_auth_security.py       17 passed (unauthenticated 401s, token expiry, ownership 403s, 404s) [NEW]
tests/test_compliance.py          15 passed (regulation propagation, coverage analyzer, topic mapper)
tests/test_exam_classifier.py     14 passed (exam type heuristic detection, mid/semester classification)
tests/test_extractors.py          23 passed (hall ticket parsing, regex extraction, confidence scoring)
tests/test_marks_calculator.py    10 passed (regulation mark thresholds, year overrides, CIE/SEE split)
tests/test_parsers.py             34 passed (question parsing, normalization, hashing, CO extraction)
tests/test_planner.py             39 passed (priority buckets, revision scheduling, mock exams, readiness)
tests/test_r22_curriculum.py       6 passed (2-1/2-2 preservation, 3-1/3-2 courses, semester helpers) [NEW]
tests/test_scrapers.py             5 passed (request scraping, manual adapter, scraper factory)
tests/test_stats.py                2 passed (exact DB count verification, graceful failure null returns) [NEW]
tests/test_vision_vote_security.py 7 passed (empty ID, whitelist, RPC, duplicate prevention, JWT deduplication) [NEW]
─────────────────────────────────────────────────────────────────────────────
Total Tests Collected & Passed:  208 passed, 0 failed, 12 deprecation warnings in 5.54s
```

### 8.3 Reconciliation of Test Count Differences

#### 1. Backend Pytest: 199 → 208 Passed (+9 Tests)
- **Origin Baseline**: In `origin/main`, the original 8 test files (`test_analysis.py`, `test_compliance.py`, `test_exam_classifier.py`, `test_extractors.py`, `test_marks_calculator.py`, `test_parsers.py`, `test_planner.py`, `test_scrapers.py`) accounted for **176 tests**.
- **First Expansion (Auth & Curriculum)**: Adding `test_auth_security.py` (+17 tests) and `test_r22_curriculum.py` (+6 tests) brought the test count to `176 + 23 = 199 tests`.
- **Second Expansion (Voting & Stats)**: Adding `test_vision_vote_security.py` (+7 tests) and `test_stats.py` (+2 tests) added exactly `7 + 2 = 9 tests`.
- **Reconciled Sum**: `199 + 9 = 208 tests`.
- **Integrity Confirmation**: Exactly 0 existing tests were removed, modified to be trivial, or deselected. All 176 original tests remain active and passing.

#### 2. Frontend Vitest: 10 → 13 Passed (+3 Tests)
- **Origin Baseline**: In `HEAD`, Vitest executed 10 tests across:
  - `src/components/__tests__/ErrorBoundary.test.tsx`: 3 tests
  - `src/store/__tests__/authStore.test.ts`: 2 tests
  - `src/lib/__tests__/api.test.ts`: 5 tests (2 for `getStats`, 1 for `submitFeedback`, 1 for `getSubjectsByFilter`, 1 for `getQuestionsBatch`)
  - Total = `3 + 2 + 5 = 10 tests`.
- **Current Suite**: In `frontend/src/lib/__tests__/api.test.ts`, the `getStats` test group was expanded from 2 to 5 tests to comprehensively verify:
  1. Successful live DB stats return (`is_live: true`).
  2. HTTP 500 error handling without returning fake numbers (`papers: null`).
  3. Network timeout / abort handling (`label: 'Unavailable'`).
  4. Malformed JSON handling (`papers: null`).
  5. Retrieval of verified cached snapshot from `localStorage` (`label: 'Verified Cache'`).
- **Reconciled Sum**: `10 + 3 = 13 tests`.
- **Integrity Confirmation**: All original tests remain present and passing.

#### 3. Playwright Suite Execution Reality (5 Executed vs 75 Unexecuted)
- The Playwright directory contains 80 tests in 13 files.
- The 5 tests in `stage1-verification.spec.ts` focus on Stage 1 requirements and execute in 47.7s.
- The remaining 75 tests (across `00-critical-path` through `11-all-pages-verification`) were written for a full-stack local dev environment with both frontend (port 3001) and backend (port 8000) running concurrently. When run without a live local backend on port 8000, tests checking backend health (`ECONNREFUSED ::1:8000`) fail.

---

## 9. Production Migration Safety Assessment

### 9.1 Forensic Migration Evaluation

| Assessment Dimension | Migration 010 (`010_create_vision_votes.sql`) | Migration 011 (`011_seed_r22_3_1_and_3_2_curriculum.sql`) |
| :--- | :--- | :--- |
| **Idempotency** | **HIGH** — Uses `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP POLICY IF EXISTS`, and `CREATE OR REPLACE FUNCTION`. Re-execution produces identical state without error. | **HIGH** — Uses `IF NOT EXISTS` constraint check, `INSERT ... ON CONFLICT DO UPDATE`, and `INSERT ... ON CONFLICT DO NOTHING`. Re-execution is idempotent. |
| **Foreign Keys** | References `vision_features(feature_id)` and `auth.users(id)` with `ON DELETE CASCADE`. Cascades cleanly. | References `public.colleges(id)` and `public.branches(id)`. **Pre-requisite Alert**: If run on a clean DB where MLRIT is not yet inserted in `colleges`, fallback UUID `a0000000-0000-0000-0000-000000000001` will fail FK constraint unless `seed.sql` has been executed first. |
| **Unique Constraints** | `feature_id PRIMARY KEY` on `vision_features` & `vision_votes`. `CONSTRAINT uq_vision_user_vote UNIQUE (feature_id, voter_hash)`. | Dynamically provisions `CONSTRAINT uq_subjects_college_code_reg UNIQUE (college_id, code, regulation)`. |
| **Indexes** | Primary key btrees + explicit indexes `idx_vision_user_votes_voter` and `idx_vision_user_votes_feature`. | Backed by unique constraint index on `(college_id, code, regulation)` and existing primary key. |
| **RLS Policies** | Strict RLS on all 3 tables: public read for features & votes; all write operations restricted to `service_role`. | Inherits existing RLS policies on `public.subjects` and `public.subject_branch_map` (public read, service write). |
| **Data Preservation** | Zero existing tables altered. Creates new isolated feature voting tables. | 100% data preservation. Only touches `year = 3`. Existing 11 2nd-year subjects and 123 papers untouched. |
| **Dependency Order** | Requires standard Supabase Auth schema (`auth.users`). Order: 010. | Requires tables `colleges`, `branches`, `subjects`, `subject_branch_map` and existing college record. Order: 011. |
| **Locking & Downtime** | Negligible (~5ms). Creates new tables. Zero application downtime. | Minimal (~5ms). Adding unique constraint on `subjects` takes milliseconds on small table. Zero downtime. |
| **Required Permissions** | Supabase SQL Editor (`postgres` superuser / service role). | Supabase SQL Editor (`postgres` superuser / service role). |

### 9.2 Staging Execution Order
When user authorization is granted, execute migrations sequentially in Supabase SQL Editor:
1. **Execution Step 1**: Apply `supabase/migrations/010_create_vision_votes.sql`.
   - Verify: `SELECT count(*) FROM public.vision_features;` → returns `4`.
   - Verify: `SELECT count(*) FROM public.vision_votes;` → returns `4`.
2. **Execution Step 2**: Apply `supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql`.
   - Verify: `SELECT count(*) FROM public.subjects WHERE regulation = 'R22' AND year = 3;` → returns `14`.
   - Verify: `SELECT count(*) FROM public.subjects WHERE regulation = 'R22';` → returns `25` (11 existing + 14 new).
   - Verify: `SELECT count(*) FROM public.papers;` → returns `123` (confirms zero paper loss).

### 9.3 Rollback Strategy

#### Rollback Migration 011:
```sql
BEGIN;
DELETE FROM public.subject_branch_map
WHERE subject_id IN (
    SELECT id FROM public.subjects WHERE regulation = 'R22' AND year = 3
);
DELETE FROM public.subjects WHERE regulation = 'R22' AND year = 3;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS uq_subjects_college_code_reg;
COMMIT;
```

#### Rollback Migration 010:
```sql
BEGIN;
DROP FUNCTION IF EXISTS public.record_vision_vote(TEXT, TEXT, UUID);
DROP TABLE IF EXISTS public.vision_user_votes CASCADE;
DROP TABLE IF EXISTS public.vision_votes CASCADE;
DROP TABLE IF EXISTS public.vision_features CASCADE;
COMMIT;
```

---

## 10. Outstanding Issues and Blockers

| Item | Description | Severity | Status | Resolution Requirement |
| :---: | :--- | :---: | :---: | :--- |
| **DEF-1** | **Async JWT Bug in Vision Vote** | High | **OPEN / DEFECT** | `_get_voter_identity` in `vision_vote.py` calls async `verify_supabase_jwt(token)` synchronously without `await`. All authenticated tokens fail with unawaited coroutine error, degrading authenticated votes to anonymous fingerprinting. Fix: use `verify_supabase_jwt_sync(token)` or make `_get_voter_identity` async and await it. |
| **DEF-2** | **Cross-User Leak in `/analysis/overview`** | High | **OPEN / DEFECT** | `GET /analysis/overview` queries `analysis_reports` using `service_role` without `.eq("user_id", user_id)`, leaking other students' reports. Fix: add `.eq("user_id", user_id)` to the query. |
| **DEF-3** | **Vision Vote Sybil & Lack of Rate Limiting** | Medium | **OPEN / VULNERABILITY** | No rate limiting is applied to `/api/v1/vision/vote`. Anonymous clients can bypass duplicate checks by rotating `User-Agent`. Fix: attach `limiter.limit("5/minute")` to `POST /vision/vote`. |
| **DEF-4** | **Unauthenticated Mock & Analysis Endpoints** | Medium | **OPEN / GAP** | `POST /mock/generate`, `GET /mock/{mock_id}`, `POST /analysis/generate`, `POST /analysis/run`, and `GET /analysis/{report_id}` lack `Depends(get_current_user_id)`. Fix: add authentication dependency to protect compute resources. |
| **B-1** | **Remote Database Execution** | High | **BLOCKED** | Migrations `010` and `011` exist only as local files and have not been applied to remote Supabase production. Blocked pending explicit user authorization. |
| **B-2** | **Live In-Browser Student Session** | Medium | **BLOCKED** | Browser navigation past `/auth` into `/dashboard` and `/planner` requires active student credentials on live Supabase instance. Mock accounts were not injected into production DB. |
| **B-3** | **Vercel Preview Deployment SSO Gate** | Medium | **OPEN** | Vercel preview URLs enforce SSO authentication (`302`). Production alias `https://paperiq-9yrq.vercel.app` is public. Disable Deployment Protection in Vercel project settings for public preview testing. |
| **B-4** | **3rd Year Past Examination Papers** | Low | **KNOWN GAP** | All 123 question paper PDFs in storage belong to 2-1 and 2-2. Zero 3rd-year question papers exist in storage. Subsequent content acquisition phase required. |

---

## 11. Exact Recommended Next Actions

1. **Remediate Code Defects (Prior to Staging Deploy)**:
   - In `backend/app/api/vision_vote.py`: Update `_get_voter_identity` to use `verify_supabase_jwt_sync(token)` (from `app.auth.jwt_verifier`) and add rate limiting (`@limiter.limit("5/minute")`).
   - In `backend/app/api/analysis.py`: In `get_analysis_overview`, append `.eq("user_id", user_id)` to the Supabase query to prevent cross-user report leakage.
   - In `backend/app/api/planner.py`: Add `user_id: str = Depends(get_current_user_id)` to `/mock/generate` and verify ownership.
2. **User Authorization Gate**: Request user authorization to commit and push local changes to GitHub `main`.
3. **Execute Staging Migrations**: Execute `010_create_vision_votes.sql` followed by `011_seed_r22_3_1_and_3_2_curriculum.sql` in Supabase SQL Editor.
4. **Trigger Automatic Deployment**:
   - Push to GitHub triggers Render backend redeployment (`srv-dbrlsabbc2fs73cgaiv0`).
   - Vercel automatically deploys frontend with `rootDirectory: "frontend"`.
5. **Post-Deployment Sanity Verification**:
   - Verify `GET https://paperiq-backend-vug0.onrender.com/api/v1/stats` returns live counts (`is_live: true`).
   - Verify `POST https://paperiq-backend-vug0.onrender.com/api/v1/vision/vote` records vote and rejects duplicate vote.
   - In Vercel Project Settings, disable Deployment Protection for public preview access.
6. **Proceed to Stage 2 Feature Development**: AI Tutor, Document Vault, and 3rd-year paper acquisition.

---

## 12. Remaining Questions & Gaps

1. **Sub-topics Not Fully Answered**:
   - *Live In-Session Student Workflow*: Cannot be certified as PASS without executing an end-to-end browser session with real Supabase authentication tokens. Classified honestly as BLOCKED.
2. **Areas Where Evidence is Weak or Inconclusive**:
   - Full Playwright regression across all 80 tests requires a local test orchestration script that starts both backend on port 8000 and frontend on port 3001 with test database fixtures.
3. **Leads Identified for Subsequent Investigators**:
   - Verify whether Render backend environment has `SUPABASE_SERVICE_KEY` configured. If only `SUPABASE_ANON_KEY` is present on Render, `get_db()` will fail to execute `record_vision_vote()`.
   - Verify CORS configuration on Render to explicitly list `https://paperiq-9yrq.vercel.app`.
4. **Priority for Next Investigator**:
   - Fix the async coroutine call in `_get_voter_identity()` and the user filter in `get_analysis_overview()`.
   - Execute migrations 010 and 011 in Supabase upon user approval.

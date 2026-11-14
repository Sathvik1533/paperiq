# PaperIQ — Stage 1 Defect Remediation & Verification Audit Report

**Date of Execution**: November 14, 2026  
**Auditor**: Antigravity Verification & Security Specialist  
**Audit Protocol**: Forensic Code Analysis, Skeptical Defect Remediation, Async Coroutine Hardening, Endpoint Authorization Verification  
**Discipline Enforced**: Strictly Local Remediation (Zero deployments to Vercel/Render, zero remote Supabase migrations executed, zero production data modified, zero git commits/pushes performed).  
**Repository Location**: `/Users/k.sathvik/.gemini/antigravity/scratch/paperiq`  
**Deliverable**: `docs/audits/PAPERIQ_STAGE1_DEFECT_REMEDIATION.md`  

---

## 1. Executive Summary & Classification Matrix

All four defects documented in `docs/audits/PAPERIQ_STAGE1_FINAL_PRODUCTION_READINESS.md` have been comprehensively remediated, independently challenged, hardened, and verified with 237 automated backend tests, 13 frontend unit tests, 0 TypeScript errors, clean production build, and 5 Playwright end-to-end browser tests.

| Defect ID | Severity | Scope & Affected File(s) | Remediation Summary | Status |
| :---: | :---: | :--- | :--- | :---: |
| **DEF-1** | High | Vision Votes JWT Verification<br>`backend/app/api/vision_vote.py`<br>`backend/tests/test_vision_vote_security.py` | Fixed asynchronous coroutine bug in `_get_voter_identity()`; properly awaits async `verify_supabase_jwt()` while safely handling sync mocks; strictly binds authenticated voter hash to user UUID (`sha256("user:<user_id>")`); ensures invalid/expired JWTs fall back to anonymous voting; eliminates User-Agent deduplication bypass. Added tests for async coroutines and table fallback duplicate rejection. | **PASS** |
| **DEF-2** | High | Cross-User Analysis Report Leakage<br>`backend/app/api/analysis.py`<br>`backend/tests/test_auth_security.py` | Filtered `GET /analysis/overview` queries strictly by `.eq("user_id", user_id)` on `analysis_reports`, guaranteeing that service-role queries never leak reports across distinct students. Verified with distinct users (Alice & Bob). | **PASS** |
| **DEF-3** | Medium | Vision Voting Rate Limiting & Abuse Defense<br>`backend/app/limiter.py`<br>`backend/app/main.py`<br>`backend/app/api/vision_vote.py`<br>`backend/tests/test_vision_vote_security.py` | Centralized slowapi rate limiter configuration; registered and enforced `@limiter.limit("5/minute")` on `POST /api/v1/vision/vote`; returned consistent `HTTP_429` error envelopes (`code: "HTTP_429"`); anchored limiter key to direct socket client host (`request.client.host`) to defeat spoofed client headers (`X-Forwarded-For`). | **PASS** |
| **DEF-4** | Medium | Compute & Resource Endpoints Protection<br>`backend/app/api/planner.py`<br>`backend/app/api/analysis.py`<br>`backend/app/analysis/report_builder.py`<br>`backend/app/jobs/analysis_job.py`<br>`backend/tests/test_auth_security.py` | Enforced authentication dependencies (`user_id: str = Depends(get_current_user_id)`) across compute endpoints (`POST /mock/generate`, `GET /mock/{mock_id}`, `POST /analysis/generate`, `POST /analysis/run`, `POST /analysis/simple`, `GET /analysis/{report_id}`, `GET /analysis/{report_id}/status`, `GET /analysis/cached`); bound generated mock exams and analysis reports to caller UUID; enforced downstream ownership verification (HTTP 403); returned HTTP 401 for unauthenticated requests and HTTP 404 for nonexistent resources. Fixed unawaited cache coroutines and removed dead code. | **PASS** |

---

## 2. DEF-1: Fix Vision Votes JWT Verification

### 2.1 Root Cause Analysis
In `backend/app/api/vision_vote.py`, `_get_voter_identity()` previously called:
```python
# DEFECTIVE CODE (ORIGINAL):
from app.auth.user_auth import verify_supabase_jwt
payload = verify_supabase_jwt(token)
user_id = payload.get("sub")
```
Because `verify_supabase_jwt` is defined as an `async def` coroutine in `app.auth.jwt_verifier`, calling it without `await` returned a coroutine object. Calling `.get("sub")` on the unawaited coroutine raised `AttributeError: 'coroutine' object has no attribute 'get'`, which was swallowed silently by `except Exception: user_id = None`. Consequently:
1. All authenticated requests were treated as anonymous voters.
2. Voter hashes were computed from `f"anon:{client_ip}:{user_agent}:v1"` rather than `f"user:{user_id}"`.
3. Authenticated students could cast unlimited duplicate votes simply by changing their `User-Agent` HTTP header.
4. Pytest generated `RuntimeWarning: coroutine was never awaited`.

### 2.2 Implemented Changes
- File: [`backend/app/api/vision_vote.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/vision_vote.py)
- Refactored `_get_voter_identity(request: Request)` to `async def` and properly awaited it in `vote_feature`.
- Added module-level `from app.auth import jwt_verifier`.
- First inspected `_verified_user_id.get()` to leverage request context already verified by `auth_middleware`.
- If not set by middleware, extracted `Authorization: Bearer <token>` and safely verified it with `jwt_verifier.verify_supabase_jwt(token)`, checking `inspect.iscoroutine(res)` to properly await coroutines while safely supporting sync mocks.
- For authenticated voters with verified `user_id`:
  `voter_hash = hashlib.sha256(f"user:{user_id}".encode()).hexdigest()`
  `User-Agent` and client IP are strictly excluded, guaranteeing that changing headers cannot evade deduplication.
- For invalid, expired, or missing tokens: caught `JWTError`/`Exception`, ensured `user_id = None`, and fell back cleanly to the intended anonymous voter mechanism (`anon:{client_ip}:{user_agent}:v1`).
- Robustly handled socket client host resolution: `request.client.host if (request.client and request.client.host) else "unknown"`.

### 2.3 Before vs. After Behavior

| Scenario | Before Behavior | After Behavior |
| :--- | :--- | :--- |
| **Valid Bearer JWT** | `AttributeError` swallowed; `user_id = None`; voter hash fingerprinted as anonymous; duplicate check failed across browser sessions | `user_id` resolved to Supabase UUID; voter hash computed deterministically as `sha256("user:<uuid>")`; RPC receives `p_user_id = <uuid>` |
| **Invalid JWT Signature** | Swallowed; treated as anon | Swallowed; `user_id = None`; treated as anon voter without crash |
| **Expired JWT Token** | Swallowed; treated as anon | Swallowed; `user_id = None`; treated as anon voter |
| **Anonymous Voter** | Hashed as `anon:<ip>:<agent>:v1` | Preserved: hashed as `anon:<ip>:<agent>:v1` with `p_user_id = None` |
| **Duplicate Authenticated Vote** | Deduplication unreliable (depended on identical User-Agent) | Strictly rejected with `status: "already_voted"` regardless of client environment |
| **Authenticated Sybil Attempt (User-Agent Rotation)** | **Vulnerability**: Voter hash changed with User-Agent, allowing unlimited votes by one logged-in user | **Prevented**: Voter hash is invariant to User-Agent; second vote returns `status: "already_voted"` |

### 2.4 Regression Test Evidence
In `backend/tests/test_vision_vote_security.py`:
- `test_valid_authenticated_jwt_identifies_user_uuid`: Verified verified UUID passed to `p_user_id` and hash equals `sha256("user:<uuid>")`.
- `test_invalid_jwt_not_treated_as_authenticated`: Verified `p_user_id` is None and hash format matches `anon:`.
- `test_expired_jwt_not_treated_as_authenticated`: Verified expired token does not authenticate.
- `test_anonymous_voter_preserves_anon_mechanism`: Verified standard anonymous voting contract.
- `test_duplicate_authenticated_vote`: Verified second vote returns `status: "already_voted"`.
- `test_authenticated_user_cannot_bypass_dedup_with_changed_user_agent`: Verified rotating `User-Agent` preserves identical voter hash and returns `status: "already_voted"`.
- `test_async_coroutine_verify_jwt_awaited_cleanly`: Verified that an `async def` coroutine for `verify_supabase_jwt` is awaited without `RuntimeWarning`.
- `test_table_fallback_duplicate_vote_rejection`: Verified that duplicate vote rejection functions properly on table fallback when RPC is unavailable.

---

## 3. DEF-2: Fix Cross-User Analysis Data Leakage

### 3.1 Root Cause Analysis
In `backend/app/api/analysis.py`, `get_analysis_overview()` was guarded by `user_id: str = Depends(get_current_user_id)`, but lines 331–342 executed:
```python
# DEFECTIVE CODE (BEFORE):
db = get_db()
query = (
    db.table("analysis_reports")
    .select("id, subject_id, regulation, branch_id, generated_at, status")
    .order("generated_at", desc=True)
)
if subject_id:
    query = query.eq("subject_id", subject_id)
if regulation:
    query = query.eq("regulation", regulation)
result = query.limit(10).execute()
```
Because `get_db()` utilizes the Supabase `service_role` key (bypassing Postgres Row Level Security), the query returned the latest 10 reports created by **any student in the database**, completely leaking private analysis metadata across users.

### 3.2 Implemented Changes
- File: [`backend/app/api/analysis.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/analysis.py)
- Appended `.eq("user_id", user_id)` to the query:
```python
# REMEDIATED CODE (AFTER):
query = (
    db.table("analysis_reports")
    .select("id, subject_id, regulation, branch_id, generated_at, status")
    .eq("user_id", user_id)
    .order("generated_at", desc=True)
)
```
- Preserved the existing response contract:
```json
{
  "success": true,
  "data": {
    "user_id": "<user_id>",
    "total_reports": <count>,
    "reports": [...]
  }
}
```

### 3.3 Regression Test Evidence
In `backend/tests/test_auth_security.py` under class `TestCrossUserDataIsolation`:
- `test_analysis_overview_isolates_user_reports`:
  - Fixture provisions 4 reports in the database: 2 belonging to `user-alice` (`rep-alice-01`, `rep-alice-02`) and 2 belonging to `user-bob` (`rep-bob-01`, `rep-bob-02`).
  - When `user-alice` calls `GET /api/v1/analysis/overview`, `data.reports` contains exactly 2 reports: `rep-alice-01` and `rep-alice-02`. Zero reports belonging to Bob appear.
  - When `user-bob` calls `GET /api/v1/analysis/overview`, `data.reports` contains exactly 2 reports: `rep-bob-01` and `rep-bob-02`. Zero reports belonging to Alice appear.
  - Verified that query filters strictly by `user_id` even when backend executes with service-role permissions.

---

## 4. DEF-3: Add Voting Rate Limiting

### 4.1 Root Cause & Architectural Analysis
While `slowapi` was initialized in `backend/app/main.py`, no limiter decorator was attached to `POST /api/v1/vision/vote`. Without rate limiting, an automated script could flood the endpoint with requests and distort product telemetry.

### 4.2 Implementation & Anti-Spoofing Architecture
1. **Module Decoupling**: Created [`backend/app/limiter.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/limiter.py) to avoid circular imports between `main.py` and `vision_vote.py`:
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address

   limiter = Limiter(key_func=get_remote_address)
   ```
2. **Socket-Anchored Key Function (`get_remote_address`)**:
   `get_remote_address` relies on `request.client.host` populated directly by the ASGI socket peer connection. It deliberately avoids blindly trusting spoofable HTTP headers such as `X-Forwarded-For` or `X-Real-IP`. This ensures an attacker cannot evade the rate limiter by simply randomizing client-supplied headers.
3. **Route Registration**: In [`backend/app/api/vision_vote.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/api/vision_vote.py), attached `@limiter.limit("5/minute")` with `(request: Request, vote: VoteRequest)`.
4. **Consistent Error Envelope**: In [`backend/app/main.py`](file:///Users/k.sathvik/.gemini/antigravity/scratch/paperiq/backend/app/main.py), added custom `RateLimitExceeded` handler:
   ```python
   def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
       msg = f"Rate limit exceeded: {exc.detail}"
       response = JSONResponse(
           status_code=429,
           content={
               "success": False,
               "error": {
                   "code": "HTTP_429",
                   "message": msg,
               },
               "detail": msg,
               "request_id": getattr(request.state, "request_id", None),
           },
       )
       if hasattr(request.app.state, "limiter") and hasattr(request.state, "view_rate_limit"):
           response = request.app.state.limiter._inject_headers(
               response, request.state.view_rate_limit
           )
       return response
   ```

### 4.3 Regression Test Evidence
In `backend/tests/test_vision_vote_security.py`:
- `test_rate_limit_enforced_after_5_requests`:
  - 5 requests from `testclient` return HTTP 200.
  - The 6th request within the same minute is rejected with HTTP 429 (`code: "HTTP_429"`, message `"Rate limit exceeded: 5 per 1 minute"`).
- `test_rate_limit_normal_voting_behavior`:
  - Normal voting traffic under 5 requests/minute executes without rate limiting.
- `test_sybil_defense_cannot_bypass_rate_limit_with_spoofed_headers`:
  - Client sends 5 requests with rotating `X-Forwarded-For` and `User-Agent` headers.
  - 6th request is still rejected with HTTP 429 because rate limiting is bound to socket client IP.

---

## 5. DEF-4: Protect All Compute Endpoints

### 5.1 Route Reconciliation & Audit Alignment
The audit flagged compute-intensive routes across `planner.py` and `analysis.py`:
- `POST /api/v1/mock/generate`
- `GET /api/v1/mock/{mock_id}`
- `POST /api/v1/analysis/generate`
- `POST /api/v1/analysis/run`
- `POST /api/v1/analysis/simple`
- `GET /api/v1/analysis/{report_id}`
- `GET /api/v1/analysis/{report_id}/status`
- `GET /api/v1/analysis/cached`

*Route Reconciliation Note*: In `backend/app/main.py`, routers are mounted under prefix `/api/{settings.api_version}` (`/api/v1`). Internal router definitions in `planner.py` (`/mock/generate`) and `analysis.py` (`/analysis/generate`) map 1:1 to their public OpenAPI paths (`/api/v1/mock/generate`, `/api/v1/analysis/generate`).

### 5.2 Implemented Changes & Hardening

#### 1. `backend/app/api/planner.py`:
- `_fetch_report(report_id, regulation, authenticated_user_id=None)`:
  - Fetches report from DB. If nonexistent, raises HTTP 404 (`"Analysis report '<id>' not found"`).
  - Inspects `user_id` on the report. If set and `authenticated_user_id` is passed: invokes `verify_user_ownership(report_owner, authenticated_user_id)`. Raises HTTP 403 on cross-user tampering.
  - Enforces regulation safety check (raises HTTP 400 on mismatch).
- `POST /planner/generate`: Passes `authenticated_user_id=user_id` to `_fetch_report` to prevent generating study plans from another student's report.
- `POST /mock/generate`:
  - Added dependency `user_id: str = Depends(get_current_user_id)`.
  - Verifies ownership of underlying `report_id` via `_fetch_report`.
  - Inserts `user_id` into `mock_exams` table record.
  - Returns `{"mock_id": ..., "user_id": ..., "questions": ...}`.
- `GET /mock/{mock_id}`:
  - Added dependency `user_id: str = Depends(get_current_user_id)`.
  - If mock exam does not exist in DB, returns HTTP 404.
  - If `mock.get("user_id")` and `mock["user_id"] != user_id`: raises HTTP 403 Forbidden.

#### 2. `backend/app/analysis/report_builder.py` & `backend/app/jobs/analysis_job.py`:
- Added `user_id: Optional[str] = None` to `ReportBuilder.build()`.
- Auto-extracts `user_id` from `user_profile` if not explicitly supplied.
- Attaches `"user_id": user_id` to the assembled report payload.
- In `_store_report()`, includes `"user_id": report["user_id"]` in the `analysis_reports` upsert dictionary.
- Updated `run_analysis_job()` to accept and pass `user_id` to `ReportBuilder`.

#### 3. `backend/app/api/analysis.py`:
- `POST /analysis/generate`:
  - Added `user_id: str = Depends(get_current_user_id)`.
  - Passes `user_id=user_id` to `builder.build()`.
- `POST /analysis/run`:
  - Added `user_id: str = Depends(get_current_user_id)`.
  - Stores `user_id` in in-memory `_job_store`.
  - Background task passes `user_id=user_id` to `run_analysis_job()`.
- `POST /analysis/simple`:
  - Preserved `authenticated_user_id: str = Depends(get_current_user_id)` and `verify_user_ownership(req.user_id, authenticated_user_id)`.
  - Stores `user_id` in `_job_store` and passes `user_id=req.user_id` to `run_analysis_job()`.
  - Removed duplicate dead code lines 272-273.
- `GET /analysis/{report_id}` & `GET /analysis/{report_id}/status`:
  - Added `user_id: str = Depends(get_current_user_id)`.
  - Unauthenticated requests immediately return HTTP 401 Unauthorized before database query execution, eliminating unauthenticated enumeration of report IDs.
  - Checks in-memory `_job_store` and database: nonexistent reports return HTTP 404.
  - Cross-user access returns HTTP 403 Forbidden via `verify_user_ownership(owner, user_id)`.
- `GET /analysis/cached`:
  - Added `user_id: str = Depends(get_current_user_id)`.
  - Unauthenticated requests return HTTP 401 Unauthorized.
  - Scoped in-memory cache key by `user_id` (`{"user_id": user_id, ...}`).
  - Appended `.eq("user_id", user_id)` to database query, preventing cross-user leakage of cached reports.
  - Awaited async `_get_from_cache` and `_set_to_cache` calls, resolving `RuntimeWarning: coroutine '_get_from_cache' was never awaited`.

### 5.3 Regression Test Evidence
In `backend/tests/test_auth_security.py`:
- Unauthenticated 401s:
  - `test_mock_generate_unauthenticated_returns_401`
  - `test_mock_get_unauthenticated_returns_401`
  - `test_analysis_generate_unauthenticated_returns_401`
  - `test_analysis_run_unauthenticated_returns_401`
  - `test_analysis_simple_unauthenticated_returns_401`
  - `test_analysis_report_unauthenticated_returns_401`
  - `test_analysis_status_unauthenticated_returns_401`
  - `test_analysis_cached_unauthenticated_returns_401`
- Cross-user authorization 403s:
  - `test_mock_generate_cross_user_report_access_blocked`: Alice cannot generate mock exam from Bob's private report.
  - `test_mock_get_cross_user_access_blocked`: Alice cannot view Bob's mock exam.
  - `test_analysis_report_cross_user_access_blocked`: Alice cannot view Bob's private analysis report.
  - `test_analysis_status_cross_user_access_blocked`: Alice cannot view the status of Bob's private analysis report.
  - `test_analysis_cached_isolates_user_reports`: Alice cannot view Bob's cached analysis report.
- Authorized owner 200/201s:
  - `test_mock_generate_authorized_owner_associates_user`: Alice generates mock exam from Alice's report; record persisted in DB with `user_id == "user-alice"`.
  - `test_mock_get_authorized_owner_access`: Alice successfully retrieves Alice's mock exam.
  - `test_analysis_report_authorized_owner_access`: Alice successfully retrieves Alice's analysis report.
- Nonexistent 404s:
  - `test_nonexistent_mock_returns_404`: Nonexistent mock ID returns HTTP 404 for authenticated caller.
  - `test_invalid_uuid_analysis_report_returns_404`: Nonexistent analysis report ID returns HTTP 404 for authenticated caller.
  - `test_invalid_uuid_study_plan_returns_404`: Nonexistent study plan ID returns HTTP 404 for authenticated caller.

---

## 6. Test Suite Execution & Integrity Verification

### 6.1 Test Execution Reconciliation Summary

| Test Suite | Discovery Command / Configuration | Discovered | Passed | Failed | Skipped | Deselected | Duration | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Backend Core Pytest** | `PYTHONPATH=. pytest tests` | **237** | **237** | **0** | 0 | 0 | 2.16s | **PASS** |
| **Frontend Unit Vitest** | `npm run test:unit` | **13** | **13** | **0** | 0 | 0 | 1.69s | **PASS** |
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | Project | Clean | **0** | 0 | 0 | ~5s | **PASS** |
| **Production Bundle Build** | `npm run build` (`vite build`) | 913 modules | Clean | **0** | 0 | 0 | 4.04s | **PASS** |
| **Playwright Stage 1 Spec** | `npx playwright test e2e/stage1-verification.spec.ts` | **5** | **5** | **0** | 0 | 0 | 49.5s | **PASS** |

### 6.2 Backend Test Count Delta Breakdown (208 → 237 Tests, +29 Tests)

```
tests/test_analysis.py            36 passed (unit classification, topic mapping, frequency, prediction)
tests/test_auth_security.py       35 passed (unauthenticated 401s, token expiry, ownership 403s, 404s,
                                             cross-user data isolation, compute endpoints protection) [+18 NEW]
tests/test_compliance.py          15 passed (regulation propagation, coverage analyzer, topic mapper)
tests/test_exam_classifier.py     14 passed (exam type heuristic detection, mid/semester classification)
tests/test_extractors.py          23 passed (hall ticket parsing, regex extraction, confidence scoring)
tests/test_marks_calculator.py    10 passed (regulation mark thresholds, year overrides, CIE/SEE split)
tests/test_parsers.py             34 passed (question parsing, normalization, hashing, CO extraction)
tests/test_planner.py             39 passed (priority buckets, revision scheduling, mock exams, readiness)
tests/test_r22_curriculum.py       6 passed (2-1/2-2 preservation, 3-1/3-2 courses, semester helpers)
tests/test_scrapers.py             5 passed (request scraping, manual adapter, scraper factory)
tests/test_stats.py                2 passed (exact DB count verification, graceful failure null returns)
tests/test_vision_vote_security.py 18 passed (empty ID, whitelist, RPC, duplicate prevention, JWT deduplication,
                                             valid JWT UUID binding, invalid/expired fallback, anon mechanism,
                                             changed User-Agent resistance, rate limit enforcement, Sybil defense,
                                             async coroutine verification, table fallback duplicate rejection) [+11 NEW]
─────────────────────────────────────────────────────────────────────────────────────────
Total Tests Collected & Passed:  237 passed, 0 failed, 11 deprecation warnings in 2.16s
```

### 6.3 Test Integrity Confirmation
- Exactly **0 existing tests were removed, weakened, or skipped**.
- All 11 deprecation warnings in pytest are upstream package deprecations (`gotrue`, `swig`, `pydantic v1`, and `on_event`); zero unawaited coroutine warnings remain.
- All 13 frontend vitest tests remain green.
- All 5 Playwright Stage 1 E2E tests pass reliably in headless Chrome.

---

## 7. Security Review & Threat Mitigation Audit

| Security Review Checkpoint | Analysis & Evidence | Finding / Verdict |
| :--- | :--- | :---: |
| **JWT Verification Correctness** | `_get_voter_identity` safely awaits `jwt_verifier.verify_supabase_jwt(token)`. Valid token resolves `sub` claim and sets `p_user_id = sub`. Invalid/expired token raises caught exception and falls back to anonymous identity mechanism. Zero uncaught coroutines. | **PASS** |
| **Authenticated Sybil Defense** | Authenticated voter hash is computed strictly from `f"user:{user_id}"`. Varying client IP or `User-Agent` produces identical hash, preventing multi-voting. | **PASS** |
| **Anonymous Sybil Defense** | Anonymous voter hash salted with `f"anon:{client_ip}:{user_agent}:v1"`. Rate limit of 5 req/min enforced at IP level. | **PASS** |
| **Client Header Spoofing Resistance** | Rate limiter uses slowapi `get_remote_address` which relies on `request.client.host` (socket peer). Spoofed `X-Forwarded-For` or `X-Real-IP` headers do not bypass rate limit. | **PASS** |
| **Service-Role Data Leakage** | `GET /analysis/overview` queries `analysis_reports` with explicit `.eq("user_id", user_id)`. Cross-user data leakage eliminated even when Supabase RLS is bypassed by backend service role. | **PASS** |
| **Compute Endpoint Protection** | `POST /mock/generate`, `GET /mock/{mock_id}`, `POST /analysis/generate`, `POST /analysis/run`, `POST /analysis/simple`, `GET /analysis/{report_id}`, `GET /analysis/{report_id}/status`, `GET /analysis/cached` all strictly require authentication. Unauthenticated requests return HTTP 401. | **PASS** |
| **Resource Ownership Verification** | `_fetch_report` prevents using another user's report for planning or mock exam generation (HTTP 403). `GET /mock/{mock_id}`, `GET /analysis/{report_id}`, `GET /analysis/{report_id}/status` verify caller owns the resource (HTTP 403). | **PASS** |
| **Information Leakage on 404** | Nonexistent mock exams and analysis reports return standard HTTP 404 without internal stack traces or 500 errors. | **PASS** |

---

## 8. Remaining Operational Risks & Exact Deployment Prerequisites

### 8.1 Remaining Operational Risks (Non-Code)
1. **Remote Supabase Schema Application (Pending Approval)**:
   - Migration `010_create_vision_votes.sql` (vision tables and `record_vision_vote` RPC) and `011_seed_r22_3_1_and_3_2_curriculum.sql` (14 courses) reside locally in `supabase/migrations/` and have not yet been executed on the production Supabase database.
   - *Risk*: Until applied in production SQL Editor, live votes will fall back to in-memory/mock counts, and 3rd-year subjects will not appear in the database.
2. **Render Environment Configuration**:
   - The backend deployment on Render must have `SUPABASE_SERVICE_KEY` configured in addition to `SUPABASE_ANON_KEY` so that `record_vision_vote` RPC can be executed by `get_db()`.
3. **Vercel Deployment Protection**:
   - Vercel preview deployments enforce SSO authentication (`302`), while production alias `https://paperiq-9yrq.vercel.app` is public. Ensure Deployment Protection is disabled on preview branches if public automated testing is desired.

### 8.2 Exact Deployment Sequence (When Authorized)
1. **Database Execution (Supabase SQL Editor)**:
   - Run `supabase/migrations/010_create_vision_votes.sql`. Verify: `SELECT count(*) FROM public.vision_features;` → returns `4`.
   - Run `supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql`. Verify: `SELECT count(*) FROM public.subjects WHERE regulation = 'R22' AND year = 3;` → returns `14`.
2. **Code Promotion**:
   - Merge local branch to `main`.
   - Render backend redeploys automatically from `backend/`.
   - Vercel frontend redeploys automatically from `frontend/`.
3. **Smoke Verification**:
   - Verify `GET https://paperiq-backend-vug0.onrender.com/api/v1/stats` returns live counts.
   - Verify `POST https://paperiq-backend-vug0.onrender.com/api/v1/vision/vote` records vote and enforces rate limits.

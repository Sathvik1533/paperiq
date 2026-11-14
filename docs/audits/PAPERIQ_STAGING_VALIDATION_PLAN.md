# PaperIQ — Staging Deployment & Validation Protocol

**Document Version**: 1.0.0  
**Target Environment**: Isolated Staging Environment (Render Staging + Supabase Staging Branch)  
**Strict Environment Boundary**: This document applies **exclusively to the Staging Environment**. Zero actions may be executed against Production (`paperiq.org` or production Supabase project `xotbxnxdrwbbubgyjvhc`) without explicit administrative gate sign-off.

---

## 1. Pre-Staging Checklist

Before deploying any artifact to the Staging environment, the deployment steward must verify:

1. **Staging Environment Isolation**:
   - Staging Render Service (`paperiq-backend-staging`) must point to an independent Staging Supabase project (or Supabase branch).
   - Staging Vercel project (`paperiq-frontend-staging.vercel.app`) must point strictly to the Staging Render backend URL.
   - Zero staging traffic or credentials must touch production buckets or production database instances.

2. **Repository & Build Integrity**:
   - Git working tree must be in clean, verified state (`git status`).
   - Backend test suite passes locally (`PYTHONPATH=. pytest` -> 237/237 passed).
   - Frontend unit suite passes (`npm run test:unit` -> 13/13 passed).
   - TypeScript compiler passes with 0 diagnostics (`npm run typecheck`).
   - Production Vite bundle builds cleanly (`npm run build` -> 913 modules transformed).

3. **Database Pre-Flight Checks**:
   - Full baseline snapshot / dump taken of staging database before applying any schema modification.
   - Confirm connection to staging Supabase with service-role credentials.

---

## 2. Migration Execution Order

Migrations must be executed strictly sequentially against the Staging Supabase database. Do not skip or reorder migrations.

| Sequence | File | Type | Safety / Idempotency Gate | Description |
| :---: | :--- | :---: | :---: | :--- |
| **Step 1** | `supabase/migrations/010_create_vision_votes.sql` | Schema DDL & RPC | `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, idempotent RLS policy drops | Creates `vision_features`, `vision_votes`, and `vision_user_votes`. Enables RLS, configures read-only public access on counts, and installs `record_vision_vote` stored procedure. |
| **Step 2** | `supabase/migrations/011_seed_r22_3_1_and_3_2_curriculum.sql` | Seed DML | Idempotent `uq_subjects_college_code_reg` check, `ON CONFLICT DO UPDATE` | Adds constraint on `(college_id, code, regulation)` and upserts official MLRIT R22 CSE 3-1 and 3-2 curriculum subjects. |

---

## 3. Backup and Rollback Requirements

### 3.1 Pre-Migration Backup Protocol
Execute via Supabase CLI or pg_dump prior to running migration 010:
```bash
# Export staging schema & data snapshot
pg_dump --clean --if-exists --quote-all-identifiers \
  -h db.<staging-ref>.supabase.co \
  -U postgres \
  -d postgres > staging_pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3.2 Rollback Scripts
If migration 010 or 011 introduces schema instability or failed constraints:

#### Rollback 011 (Curriculum):
```sql
BEGIN;
DELETE FROM public.subjects 
WHERE regulation = 'R22' 
  AND code IN ('A6CS15', 'A6IT13', 'A6CS18', 'A6IT26', 'A6AI14', 
               'A6IT39', 'A6IT11', 'A6CS16', 'A6CS44', 'A6AI17', 
               'A6CS31', 'A6CS17', 'A6MC05');
COMMIT;
```

#### Rollback 010 (Vision Votes):
```sql
BEGIN;
DROP FUNCTION IF EXISTS public.record_vision_vote(TEXT, TEXT, UUID);
DROP TABLE IF EXISTS public.vision_user_votes CASCADE;
DROP TABLE IF EXISTS public.vision_votes CASCADE;
DROP TABLE IF EXISTS public.vision_features CASCADE;
COMMIT;
```

---

## 4. Required Staging Environment Variables

Both Render and Vercel environments require explicit variable configuration. **Secret values must never be checked into git or printed in logs.**

### Backend (Render Staging Service)

| Variable Name | Required | Description / Target |
| :--- | :---: | :--- |
| `ENVIRONMENT` | Yes | Set to `staging` (enables verbose Sentry, non-production flags) |
| `PORT` | Yes | `8000` |
| `SUPABASE_URL` | Yes | Staging Supabase URL (`https://<staging-ref>.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Yes | Staging Supabase `service_role` key (bypasses RLS for backend operations) |
| `SUPABASE_ANON_KEY` | Yes | Staging Supabase `anon` public key (used for JWKS and user verification) |
| `SUPABASE_STORAGE_BUCKET`| Yes | `papers` (staging bucket) |
| `SECRET_KEY` | Yes | Cryptographic secret for signing session state |
| `CORS_ORIGINS` | Yes | Comma-separated allowed staging domains (e.g. `https://paperiq-staging.vercel.app,http://localhost:5173`) |
| `WEB_CONCURRENCY` | Yes | Set to `2` for staging testing (verifies multi-worker behavior) |
| `UVICORN_WORKERS` | Yes | Set to `2` for staging testing |
| `SENTRY_DSN` | Optional| Staging Sentry DSN for error telemetry |
| `GROQ_API_KEY` | Optional| API key for LLM analysis / inference |
| `OPENROUTER_API_KEY` | Optional| Failover LLM provider key |

### Frontend (Vercel Staging Deployment)

| Variable Name | Required | Description / Target |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | Points to Staging Render backend (`https://paperiq-backend-staging.onrender.com/api/v1`) |
| `VITE_SUPABASE_URL` | Yes | Staging Supabase URL (`https://<staging-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Staging Supabase `anon` public key |
| `VITE_ENVIRONMENT` | Yes | Set to `staging` |

---

## 5. Post-Migration Database Checks

Run the following SQL sanity checks in the Staging Supabase SQL Editor immediately after executing migrations:

```sql
-- 1. Verify vision tables exist and RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('vision_features', 'vision_votes', 'vision_user_votes');
-- Expected: 3 rows, all with rowsecurity = true

-- 2. Verify vision_features seed count
SELECT count(*) FROM public.vision_features;
-- Expected: 4 rows (exam_intelligence, exam_mentor, academic_os, the_future)

-- 3. Verify vision_votes initialized with 0 counts
SELECT feature_id, count FROM public.vision_votes;
-- Expected: 4 rows, all count = 0

-- 4. Verify record_vision_vote function exists
SELECT proname, prorettype::regtype, proargtypes 
FROM pg_proc 
WHERE proname = 'record_vision_vote';
-- Expected: 1 function returning json

-- 5. Verify R22 3-1 and 3-2 subjects seeded in subjects table
SELECT code, name, semester, year, regulation 
FROM public.subjects 
WHERE regulation = 'R22' AND year = 3 
ORDER BY semester, code;
-- Expected: 13 subjects (5 in 3-1, 8 in 3-2)
```

---

## 6. Authentication and Ownership Test Cases (Staging Test Matrix)

Execute automated or manual curl validation using two test user accounts in Staging:
- **User A (Alice)**: `alice.staging@mlrit.ac.in` (UUID: `uuid-alice`)
- **User B (Bob)**: `bob.staging@mlrit.ac.in` (UUID: `uuid-bob`)

| Test Case ID | Action | Expected Status | Evidence Required |
| :--- | :--- | :---: | :--- |
| **STG-AUTH-01** | Alice generates analysis (`POST /api/v1/analysis/generate`) | `200 OK` | `data.user_id == uuid-alice` |
| **STG-AUTH-02** | Unauthenticated request to `GET /api/v1/analysis/overview` | `401 Unauthorized` | Error envelope with `HTTP_401` |
| **STG-AUTH-03** | Bob requests Alice's report (`GET /api/v1/analysis/{alice_report_id}`) | `403 Forbidden` | Access blocked across tenants |
| **STG-AUTH-04** | Bob requests status of Alice's job (`GET /api/v1/analysis/{alice_report_id}/status`) | `403 Forbidden` | Status blocked across tenants |
| **STG-AUTH-05** | Bob generates mock from Alice's report (`POST /api/v1/mock/generate` with Alice's `report_id`) | `403 Forbidden` | Mock generation blocked |
| **STG-AUTH-06** | Bob retrieves Alice's mock exam (`GET /api/v1/mock/{alice_mock_id}`) | `403 Forbidden` | Mock retrieval blocked |
| **STG-AUTH-07** | Alice requests `GET /api/v1/planner/progress` | `200 OK` | Contains only Alice's study plans |
| **STG-AUTH-08** | Bob requests `GET /api/v1/planner/{alice_plan_id}` | `403 Forbidden` | Plan retrieval blocked |
| **STG-AUTH-09** | Alice requests `GET /api/v1/readiness?user_id=uuid-bob` | `403 Forbidden` | Tampered query param blocked |

---

## 7. Vision Vote Verification

Validate the `/vision/vote` endpoint on Staging:

1. **Anonymous Vote**:
   - Send `POST /api/v1/vision/vote` with `{"feature_id": "exam_intelligence"}` without `Authorization` header.
   - Verify `200 OK`, `status: "ok"`.
2. **Duplicate Anonymous Vote**:
   - Send identical request from same IP/User-Agent immediately.
   - Verify `200 OK`, `status: "already_voted"`.
3. **Authenticated Vote**:
   - Send `POST /api/v1/vision/vote` with Alice's valid Bearer token.
   - Verify `200 OK`, `status: "ok"`.
4. **Duplicate Authenticated Vote with User-Agent Rotation**:
   - Send identical request with Alice's Bearer token with a changed `User-Agent` header (`Mobile/Safari`).
   - Verify `200 OK`, `status: "already_voted"`. Hash invariance confirmed.
5. **Invalid / Corrupt Bearer Token**:
   - Send `Authorization: Bearer invalid_or_garbage_token`.
   - **Current Implementation Behavior**: Silently downgrades to anonymous vote (`200 OK`).
   - **Security Specification Target**: Verify whether HTTP 401 rejection is enforced prior to promotion.
6. **Rate Limiting**:
   - Send 6 rapid vote requests within 60 seconds from the same client IP.
   - 6th request must return `HTTP 429 Too Many Requests` with envelope:
     `{"success": false, "error": {"code": "HTTP_429", "message": "Rate limit exceeded: 5 per 1 minute"}}`.

---

## 8. Landing Page Verification

1. **Clean Initial Load**:
   - Navigate to `https://paperiq-staging.vercel.app/`.
   - Confirm no automatic redirect loop to `/auth`.
2. **Truthful Statistics Counter**:
   - If database is connected: Verify live paper, question, and subject counts appear without hardcoded numbers (72 / 5730).
   - If database is disconnected or cold-starting: Verify fallback snapshot displays explicit non-live indicator (`[Demo Snapshot]` or `[Verified Cache]`), never presenting stale or simulated numbers as live telemetry.
3. **Navigation & Interactive Links**:
   - Verify Hero CTA buttons link to `/auth` or `/papers`.
   - Verify Footer, Roadmap, and Developer links function without console errors.

---

## 9. Planner and Analysis Workflow Verification

1. **Student Onboarding Flow**:
   - Sign in as Alice -> Complete onboarding with Semester 2-1 or 3-1.
   - Verify `user_profiles` record is saved in staging database.
2. **Analysis Report Generation**:
   - Select Subject `A6CS05` (Data Structures) or `A6CS15` (Design and Analysis of Algorithms).
   - Click "Run Analysis".
   - Verify report generates, binds `user_id = uuid-alice`, and stores in `analysis_reports`.
3. **Study Plan Generation**:
   - From report, generate a study plan.
   - Verify schedule creates daily study breakdown and persists to `study_plans`.
4. **Mock Exam Generation**:
   - Click "Generate Mock Exam".
   - Verify mock exam generates Part A and Part B questions conforming to R22 schema and persists to `mock_exams`.

---

## 10. Known Limitations & Unresolved Risks

1. **In-Memory Rate Limiting Across Multi-Worker Render Instances**:
   - `Limiter` uses in-memory storage (`limits.storage.MemoryStorage`).
   - Behind Render with `WEB_CONCURRENCY=2` or `4`, each worker maintains an independent rate-limit counter in RAM.
   - Distributed rate limiting via Redis is **NOT** configured in the current codebase.
2. **Proxy Header / Real IP Ambiguity Behind Render**:
   - `get_remote_address` extracts `request.client.host` directly from the socket connection.
   - Render reverse proxies forward requests with `X-Forwarded-For`. Without trusted proxy middleware or `--forwarded-allow-ips`, the socket client host may represent Render's internal proxy IP.
3. **Vision Vote Silent Downgrade on Invalid Token**:
   - `_get_voter_identity()` catches JWT verification exceptions and silently falls back to anonymous voting. An explicitly supplied corrupt or expired Bearer token is not rejected with HTTP 401.
4. **Unauthenticated Compute Endpoints**:
   - `POST /api/v1/r22/analyze`, `POST /api/v1/analysis/{subject_id}/cross-reference`, and `POST /api/v1/onboarding/parse-hall-ticket` do not currently enforce user authentication or rate limits, posing compute exhaustion risks.
5. **Null-Owner Resource Access**:
   - Resources with `user_id IS NULL` (legacy rows) bypass ownership verification in `get_report` and `get_mock`.

---

## 11. Staging vs Production Gate Protocol

| Gate Requirement | Staging Verification | Production Promotion |
| :--- | :---: | :---: |
| Database Migrations Applied | **Staging Supabase ONLY** | STRICTLY FORBIDDEN until Staging Sign-Off |
| Vercel Deployment | Staging preview branch | Production `main` branch locked |
| Render Web Service | `paperiq-backend-staging` | `paperiq-backend` locked |
| Test Accounts | Permitted in staging | Zero synthetic accounts in production |
| Sign-Off Authority | Security & QA Auditors | Platform Lead / User Approval |

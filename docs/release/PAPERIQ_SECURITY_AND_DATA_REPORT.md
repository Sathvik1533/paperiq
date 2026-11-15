# PaperIQ Security, Privacy & Data Isolation Report
**Target Environment**: Production Beta Deployment  
**Security Standard**: Least Privilege, Tenant Isolation, Zero Secrets Leakage  
**Date**: November 15, 2026

---

## 1. Authentication & Token Verification

PaperIQ implements a stateless, cryptographically verified authentication architecture using Supabase GoTrue Auth and FastAPI JWT verification middleware.

```
┌─────────────────┐             ┌───────────────────┐             ┌─────────────────┐
│ Frontend Client │ ──(Auth)──> │  Supabase Auth    │ ──(Token)─> │ Frontend Store  │
└─────────────────┘             └───────────────────┘             └────────┬────────┘
                                                                           │
                                 Bearer JWT in Authorization Header        │
                                                                           ▼
                                ┌───────────────────────────────────────────────────┐
                                │              FastAPI Backend Middleware           │
                                │ • Extracts Bearer token                           │
                                │ • Verifies signature with Supabase JWT Secret     │
                                │ • Validates expiry (`exp`) & audience (`aud`)     │
                                │ • Injects verified `user_id` into Request Context  │
                                └───────────────────────────────────────────────────┘
```

### Authentication Invariants:
1. **Public vs. Protected Endpoints**: Endpoints like `/api/v1/health`, `/api/v1/stats`, and OpenAPI docs are accessible without tokens. Endpoints handling student data (`/api/v1/planner`, `/api/v1/profile`, `/api/v1/companion`) require a valid Bearer JWT.
2. **Context-Safe Token Validation**: `backend/app/auth/jwt_verifier.py` uses python-jose to decode and verify JWTs against `SUPABASE_JWT_SECRET`. Tampered, forged, or expired tokens immediately trigger `401 Unauthorized` with structured JSON errors.

---

## 2. Row Level Security (RLS) & Tenant Isolation

User privacy and data isolation are enforced at both the database level via PostgreSQL Row Level Security (RLS) and the application layer.

### Database Policies:
- **`profiles`**: Students can only `SELECT` and `UPDATE` records where `profiles.id = auth.uid()`.
- **`study_plans`**: Student study plans are strictly tied to `study_plans.user_id = auth.uid()`. Cross-tenant reading or modifying is rejected by database constraints.
- **`companion_conversations` & `companion_messages`**: Conversations are private to the owning user.
- **`papers` & `questions`**: Public academic catalogue tables permit read-only (`SELECT`) access to authenticated and anonymous students, while `INSERT`/`UPDATE` operations require administrative service privileges.

---

## 3. Secrets Hygiene & Environment Security

1. **Zero Secret Leakage in Frontend**:
   - The Vite build was audited; only public identifiers prefixed with `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`) are bundled into client assets.
   - Private secrets (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SENTRY_DSN`) reside strictly on the server in `backend/.env`.
2. **Key Fallback Protection**:
   - `backend/app/database.py` includes validation logic that prevents crashes or undefined behavior when running against local stubs, automatically utilizing the valid anonymous JWT when service role operations are unneeded.
3. **No Unencrypted Storage of Student Identifiers**:
   - Hall ticket numbers, roll numbers, and personal details are processed with standard data protection controls and are never broadcast to public logs.

---

## 4. API Rate Limiting & Denial-of-Service Defense

- **Limiter Engine**: SlowAPI (Python port of Flask-Limiter) configured on FastAPI endpoints.
- **Throttling Policies**:
  - General API endpoints: 60 requests per minute per IP.
  - LLM Completion endpoints (`/api/v1/companion`): 15 requests per minute per authenticated user to prevent API quota exhaustion and runaway costs.
- **Error Contract**: When rate limits are tripped, the server responds with a standardized HTTP 429 response:
  ```json
  {
    "success": false,
    "error": {
      "code": "HTTP_429",
      "message": "Rate limit exceeded: 15 per 1 minute"
    },
    "detail": "Rate limit exceeded: 15 per 1 minute",
    "request_id": "req-uuid"
  }
  ```

---

## 5. Network & CORS Policy

- **Allowed Origins**: Strict allowlist in `backend/app/config.py`:
  - `http://localhost:3005` (Local development & test suite)
  - `http://127.0.0.1:3005`
  - `https://paperiq.vercel.app` (Production frontend)
- Requests from unauthorized origins are rejected by CORSMiddleware before reaching route handlers.

---

## 6. Audit Verdict
All security, data isolation, and secrets hygiene checks are satisfied. No credentials or unisolated endpoints exist in the PaperIQ codebase.

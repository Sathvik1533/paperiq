# PaperIQ — Final Blocker Fixes & AI Companion Implementation Report

**Document Date:** November 14, 2026  
**Implementation Phase:** Product Transition & Vertical Slice Delivery  
**Target Workspace:** `/Users/k.sathvik/.gemini/antigravity/scratch/paperiq`

---

## 1. Security Blockers Fixed & Regression Evidence

### 1.1 Rate Limiting Behind Render Reverse Proxy
* **Root Cause & Vulnerability:**  
  Render's edge architecture terminates TLS at a multi-tenant reverse proxy, adding or appending the client IP address to the *end* (rightmost element) of the `X-Forwarded-For` header before routing to the application container. Previously, the limiter either inspected the leftmost `X-Forwarded-For` IP (allowing clients to spoof arbitrary IPs and evade rate limiting or spoof victim IP addresses) or relied purely on the raw TCP remote socket (which on Render corresponds to the internal proxy host `10.x.x.x` or loopback, leading to global starvation where one student exhausted rate limits for all students on campus or behind the proxy).
* **Fix Implemented in `backend/app/limiter.py`:**
  1. **Server-Governed Trusted Proxy Detection:** Proxy trust is established strictly by server environment variables (`RENDER=true` set by the Render container runtime) or validated against `settings.trusted_proxies` CIDR ranges (`127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`). Client-injected HTTP headers (`render-proxy-server`, `x-render-origin-server`) are strictly ignored and never used to determine proxy trustworthiness.
  2. **Anti-Spoofing Client Identification:** Extracts the true remote client IP by prioritizing Cloudflare's verified `CF-Connecting-IP`, or reading the rightmost valid entry of `X-Forwarded-For`. Arbitrary user-injected client headers are ignored unless forwarded by the trusted edge.
  3. **Per-Student Rate Limit Isolation:** For all authenticated endpoints, the rate limiting key function extracts the student's JWT ID (`user:<uuid>`). This completely isolates quotas: even if hundreds of students share a university Wi-Fi NAT or Render container proxy IP, one student's heavy traffic cannot exhaust rate limits for another.
  4. **Shared Redis Storage Support:** Replaced hardcoded process-local in-memory storage with configurable `storage_uri` (`settings.redis_url`). If Redis is unavailable or unconfigured in local development, it gracefully defaults to thread-safe in-memory storage with diagnostic logging.

### 1.2 Null-Owner Authorization Hardening
* **Root Cause & Vulnerability:**  
  In `backend/app/api/analysis.py` and `backend/app/api/planner.py`, access checks were previously gated behind `if owner:` conditions. When a resource had `user_id = NULL` (unowned, legacy, or orphaned records), the check evaluated to falsy, bypassing ownership validation and allowing unauthenticated or cross-tenant callers to view or mutate private reports, study plans, or mock exams.
* **Fix Implemented in `backend/app/auth/user_auth.py`:**
  - Implemented `verify_resource_access(resource_owner_id, authenticated_user_id, is_public=False, resource_type="resource")`.
  - **Explicit Null-Owner Rejection:** If `resource_owner_id is None`, access is rejected immediately with `HTTP 403 Forbidden` (`Private resource has no owner assigned`), unless the resource was deliberately flagged as public/system-generated (`is_public=True` or `generated_by="system"`).
  - Applied consistently across:
    - `backend/app/api/analysis.py`: Report retrieval and job status checks.
    - `backend/app/api/planner.py`: Report generation dependencies, study plan retrieval, and mock exam generation.
    - `backend/app/api/marks_analysis.py`: Marks breakdown and student performance history.

### 1.3 Protection of Expensive Compute Endpoints
Authentication, per-user rate limits, and resource ownership checks were instituted on resource-intensive endpoints:
1. `POST /api/v1/r22/analyze`: Protected with `Depends(get_current_user_id)` and `@limiter.limit("5/minute")`. Job records are bound to the requester's `user_id`.
2. `GET /api/v1/r22/job/{job_id}`: Protected with `Depends(get_current_user_id)` and `verify_resource_access` ensuring students can only monitor their own OCR/LLM analysis jobs.
3. `POST /api/v1/analysis/{subject_id}/cross-reference`: Protected with `Depends(get_current_user_id)` and `@limiter.limit("5/minute")` to prevent compute exhaustion on matrix cross-referencing.
4. `POST /api/v1/onboarding/parse-hall-ticket`: Protected with `Depends(get_current_user_id)` and `@limiter.limit("5/minute")` to prevent unauthenticated abuse of the Gemini/OpenAI vision parser.
5. `GET /api/v1/analysis/{analysis_id}/marks-breakdown`: Protected with `Depends(get_current_user_id)`, `verify_resource_access`, and `@limiter.limit("20/minute")`.

### 1.4 Backfill Script Verification & Hardening
- Confirmed `backend/scripts/backfill_exam_dates.py` imports cleanly without circular dependencies.
- Added full `argparse` CLI handling supporting `--dry-run`, `--batch-size`, and `--help`.
- Verified that running `python scripts/backfill_exam_dates.py --help` and `--dry-run` exits with code 0 without crashing when Supabase credentials are not configured in local or CI environments.

### 1.5 Regression Test Evidence
A dedicated security regression suite `backend/tests/test_blocker_fixes_regression.py` was created containing 26 tests:
- Rate limit enforcement under direct, spoofed, and trusted Render proxy headers (tests 1–7).
- Attacker proxy-spoofing rejection with fake headers from untrusted hosts (test 8).
- Cross-student quota isolation under shared IP (tests 9–11).
- Null-owner authorization rejection and public resource preservation (tests 12–17).
- Authentication and rate limiting on expensive endpoints (tests 18–24).
- Backfill script import, date estimation accuracy, and CLI dry-run execution (tests 25–26).
*Result:* **26 passed in 1.49s** (100% pass rate).

---

## 2. Remaining Known Limitations

1. **Shared Distributed Redis Deployment:**  
   In single-instance Render environments, the fallback memory limiter functions correctly. In horizontal multi-pod Render deployments, setting `REDIS_URL` in Render environment secrets is required to maintain synchronous counter state across instances.
2. **Remote Supabase DDL Execution:**  
   The migration file `supabase/migrations/012_create_companion_conversations.sql` has been created locally with full RLS policies. It has not been applied to production Supabase, strictly adhering to the directive forbidding production database mutations during this phase. Local test environments operate with an in-memory fallback layer.
3. **Third-Party LLM API Quotas:**  
   When `OPENAI_API_KEY` is not provided in test or offline environments, the AI Companion specialists gracefully use grounded curriculum knowledge bases and fallback synthesis engines. Real-time GPT-4o inference requires an active API key with available quota.

---

## 3. AI Companion Architecture Actually Implemented

```
                                      ┌─────────────────────────────────────────────────────────┐
                                      │              PaperIQ Frontend (/companion)             │
                                      │   - Session History Sidebar   - Markdown Chat Stream    │
                                      │   - Subject Selector (R22)    - Specialist Badges       │
                                      │   - Starter Query Cards       - Verified Citation Pills │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │ Authenticated POST /chat
                                                                   ▼
                                      ┌─────────────────────────────────────────────────────────┐
                                      │              FastAPI Companion Router                   │
                                      │   - JWT Bearer Authentication (get_current_user_id)     │
                                      │   - Per-User Rate Limiting (user:<id>, 30/minute)       │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │
                                                                   ▼
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                 CompanionOrchestrator                   │
                                      │   - State Graph / Execution Pipeline                    │
                                      │   - Pattern-Based & Semantic Intent Classifier          │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │
                       ┌───────────────────────┬───────────────────┼───────────────────┬───────────────────────┐
                       ▼                       ▼                   ▼                   ▼                       ▼
            ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
            │   Academic Tutor    │ │Syllabus Intelligence│ │  Exam Prep  │ │Study Planner Coach  │ │ Document Retriever  │
            │   - Exam-grade      │ │ - Unit 1 to 5 breakdown│ │ - Frequency │ │ - 7-Day Masterplan  │ │ - Authentic past    │
            │     structure       │ │ - Course Outcomes   │ │   trends    │ │ - Daily targets     │ │   exam paper links  │
            │   - Part A vs Part B│ │   (CO1 to CO5)      │ │ - Repeated  │ │ - Readiness metrics │ │ - Section & year    │
            │   - Numerical traces│ │ - Credit structure  │ │   patterns  │ │ - Pace tracking     │ │   citations         │
            └──────────┬──────────┘ └──────────┬──────────┘ └──────┬──────┘ └──────────┬──────────┘ └──────────┬──────────┘
                       │                       │                   │                   │                       │
                       └───────────────────────┴───────────────────┼───────────────────┴───────────────────────┘
                                                                   │ Grounded Response + Citations + Action Pills
                                                                   ▼
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                     CompanionStore                      │
                                      │   - Safe Supabase CRUD (multi-tenant user_id isolation) │
                                      │   - Thread-safe Memory Store fallback for testing       │
                                      └─────────────────────────────────────────────────────────┘
```

### Specialist Modules Implemented:
1. **AI Academic Tutor (`AcademicTutorSpecialist`):** Delivers university exam-focused answers formatted into Definition, Key Concepts, Step-by-Step Algorithm Traces, and Comparison Matrices, explicitly demarcating 2-Mark (Part A) and 10-Mark (Part B) expectations.
2. **Syllabus Intelligence Specialist (`SyllabusIntelligenceSpecialist`):** R22 curriculum specialist providing unit-by-unit syllabus breakdowns, Course Outcome (CO1–CO5) mappings, and prerequisite guidance.
3. **Exam Pattern Analyst (`ExamPrepAnalystSpecialist`):** Analyzes historical question appearance frequencies across past papers, detects repeat question patterns, and calculates topic probability scores.
4. **Study Planner Coach (`PlannerCoachSpecialist`):** Formulates adaptive 7-day study masterplans with daily milestones, time allocations, and readiness tracking.
5. **Academic Document Retriever (`DocumentRetrieverSpecialist`):** Queries university exam paper archives, returns authentic past paper metadata, and generates direct clickable `/papers/{id}` viewing links.
6. **General Guidance Specialist (`GeneralGuidanceSpecialist`):** Onboards students and routes ambiguous queries to the appropriate capability.

---

## 4. Frontend Components & Backend Endpoints Created

### Backend Endpoints (`backend/app/api/companion.py`):
* `POST /api/v1/companion/chat`: Main conversational endpoint. Accepts `{ message, conversation_id?, subject_code?, regulation? }`, invokes orchestrator, persists conversation, and returns full specialist response with citations and suggested action pills.
* `GET /api/v1/companion/conversations`: Lists student's active and past study sessions with last message previews and timestamps.
* `GET /api/v1/companion/conversations/{conversation_id}`: Retrieves complete message history for a conversation after verifying user ownership.
* `DELETE /api/v1/companion/conversations/{conversation_id}`: Securely removes a conversation owned by the authenticated student.
* `GET /api/v1/companion/specialists`: Exposes capability metadata, descriptions, and starter queries for client-side rendering.

### Frontend Components & Files:
* `frontend/src/pages/Companion.tsx`: Unified conversational UI matching Stitch design system (neutral-900 glassmorphism, accent badges, responsive collapsible sidebar, starter query cards, citation chips, and suggested action pills). Integrated custom `MarkdownContent` renderer for headings, lists, bold text, inline code, and responsive markdown tables, plus defensive `scrollIntoView` DOM handling.
* `frontend/src/pages/__tests__/Companion.test.tsx`: Vitest component tests verifying header rendering, course target selection, starter cards, and recent session loading in the sidebar.
* `frontend/src/lib/api.ts`: Added TypeScript interfaces (`CompanionMessage`, `ChatResponse`, `ConversationSummary`, `SuggestedAction`, `SpecialistCapabilityInfo`) and client methods (`sendCompanionMessage`, `getCompanionConversations`, `getCompanionConversation`, `deleteCompanionConversation`, `getCompanionSpecialists`).
* `frontend/src/App.tsx`: Registered `<Route path="/companion" element={<ProtectedRoute><Companion /></ProtectedRoute>} />`.
* `frontend/src/components/NavBar.tsx`: Added `Companion` navigation item and active route highlighting.
* `frontend/src/components/CommandPalette.tsx`: Registered `AI Companion` in Cmd+K quick navigation.

---

## 5. Database Changes & Migration Requirements

### Migration Script: `supabase/migrations/012_create_companion_conversations.sql`
* **Tables Created:**
  ```sql
  CREATE TABLE IF NOT EXISTS companion_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject_id TEXT,
      regulation TEXT DEFAULT 'R22',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS companion_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES companion_conversations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('student', 'assistant', 'system')),
      content TEXT NOT NULL,
      intent TEXT,
      specialist TEXT,
      confidence REAL DEFAULT 1.0,
      citations JSONB DEFAULT '[]'::jsonb,
      suggested_actions JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
* **Performance Indexes:**
  - `idx_companion_conversations_user_updated` on `companion_conversations(user_id, updated_at DESC)`
  - `idx_companion_messages_conv_created` on `companion_messages(conversation_id, created_at ASC)`
* **Row-Level Security (RLS):**
  - Enabled on both tables with strict `auth.uid() = user_id` policies for SELECT, INSERT, UPDATE, and DELETE.
* **Migration Execution Plan:** Apply via Supabase CLI (`supabase db push`) during the next planned database maintenance window. The backend automatically operates via isolated fallback memory stores until the migration is executed.

---

## 6. Working End-to-End User Journey

1. **Discovery & Navigation:**  
   Student logs in and clicks "AI Companion" on the navigation bar or hits `Cmd+K` and selects "AI Companion".
2. **Subject Selection & Onboarding:**  
   The page loads with course options (e.g., `A6CS09 - Operating Systems`). The empty chat view renders 4 starter prompt cards corresponding to different capabilities:
   - "Explain Banker's Algorithm" (Academic Tutor)
   - "Unit 3 Syllabus Deep Dive" (Syllabus Intelligence)
   - "Repeated Question Patterns" (Exam Pattern Analyst)
   - "7-Day Study Masterplan" (Study Planner Coach)
3. **Message Dispatch:**  
   Student clicks a starter card or types a question. Frontend issues an authenticated `POST /api/v1/companion/chat` request with the Supabase JWT access token.
4. **Rate Limit & Identity Verification:**  
   Backend validates the JWT, identifies the student as `user:<uuid>`, and ensures the per-user limit of 30 req/min is respected.
5. **Intent Routing:**  
   The `CompanionOrchestrator` classifies the query and routes it to the designated specialist (e.g. `AcademicTutorSpecialist`).
6. **Grounded Synthesis:**  
   The specialist extracts relevant curriculum parameters and produces an exam-structured response accompanied by verified citation links (e.g., `JNTUH R22 OS Syllabus Unit 3`) and interactive suggested action pills (e.g., `View Past Questions`, `Generate Study Plan`).
7. **Multi-Tenant Persistence:**  
   The conversation and response are persisted with the student's `user_id`.
8. **Client Rendering:**  
   The message stream updates in real-time displaying the specialist badge, markdown-rendered response, evidence chips, and clickable action pills that automatically navigate to relevant app views or dispatch follow-up queries.

---

## 7. Test Results & Exact Unverified Tests

### Automated Test Execution Results:
| Test Category | Target Suite | Tests Run | Passed | Failed | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Security Regression** | `tests/test_blocker_fixes_regression.py` | 26 | 26 | 0 | 1.49s |
| **Companion Slice** | `tests/test_companion_vertical_slice.py` | 16 | 16 | 0 | 0.88s |
| **Full Backend Suite** | `backend/tests/` | 280 | 280 | 0 | 2.15s |
| **Frontend Unit Tests** | `frontend/src/**/__tests__/*.test.ts(x)` | 20 | 20 | 0 | 1.42s |
| **TypeScript Typecheck** | `frontend/tsc --noEmit` | Clean | Pass | 0 | 4.80s |
| **Frontend Production Build** | `frontend/vite build` | Clean | Pass | 0 | 2.62s |

### Exact Unverified Aspects:
1. **Multi-Pod Distributed Redis Sync:** Tested with single-instance Redis and memory fallback. Real-world multi-pod synchronisation across multiple Render containers requires deploying to a multi-instance staging environment.
2. **Production Supabase DB Execution:** Remote SQL execution was withheld per project execution rules.
3. **Live LLM Token Consumption:** Tested with local deterministic synthesis and mocked OpenAI providers. Live production streaming with third-party OpenAI API credits was not executed to preserve external API budgets.

---

## 8. Next Concrete Implementation Milestone

1. **Interactive Chat Streaming (SSE):** Implement Server-Sent Events (`text/event-stream`) for token-by-token streaming in the AI Companion UI to enhance perceived responsiveness.
2. **Deep Action Link Automation:** Connect the Companion's `Generate Study Plan` action pill directly to auto-trigger the `/api/v1/planner/generate` endpoint, pre-populating the student's study calendar without manual entry.
3. **Multi-Turn Context Window Summarization:** Add token-budget management in `CompanionOrchestrator` to automatically summarize conversation history once session length exceeds 10 messages.

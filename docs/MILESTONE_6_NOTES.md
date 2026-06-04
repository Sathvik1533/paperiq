# Milestone 6 — Dashboard & Repository

## What Was Built

- **React dashboard** (`frontend/src/pages/Dashboard.tsx`): main authenticated view showing readiness score ring, upcoming study tasks, and high-priority topic chips.
- **Paper repository** (`frontend/src/pages/Repository.tsx`): searchable/filterable table of all scraped papers with download links. Filters: college, subject, year, branch.
- **Mock exam page** (`frontend/src/pages/MockExam.tsx`): presents AI-predicted exam paper. Student can attempt it and get instant scoring.
- **Saved reports** (`frontend/src/pages/Reports.tsx`): user can bookmark analysis snapshots for later reference.
- **Auth flow** (`frontend/src/pages/Auth.tsx`): Supabase Auth UI with Google OAuth and email/password.
- **API layer** (`frontend/src/lib/api.ts`): typed fetch wrappers for all backend endpoints.

## Key Design Decisions

- All pages gate on Supabase session; unauthenticated users are redirected to `/login`.
- Dashboard polls readiness score every 60 s via `useEffect` + `setInterval` — no websocket needed at this scale.
- Paper downloads go through a signed Supabase Storage URL (never exposed raw bucket URL).
- Design system: Tailwind + shadcn/ui components, dark mode default.

## Database Tables Introduced

- `mock_exams` — stores generated mock paper + student attempt results.
- `saved_reports` — user-bookmarked analysis snapshots.
- `user_profiles` — display name, avatar, notification preferences.

## Test Coverage

- E2E smoke test (Playwright): login → dashboard loads → readiness score visible.
- Unit tests for `api.ts` fetch wrappers (msw mocks).

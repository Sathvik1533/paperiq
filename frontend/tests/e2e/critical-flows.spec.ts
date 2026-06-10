import { test, expect } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────

// Structurally valid JWT (Supabase JS checks payload.exp to decide session validity)
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"fake-user-id","email":"test@mlrit.edu","role":"authenticated",
//           "aud":"authenticated","exp":9999999999,"iss":"supabase"}
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAbWxyaXQuZWR1Iiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJpc3MiOiJzdXBhYmFzZSJ9' +
  '.fakeSig';

const FAKE_SESSION = {
  access_token: FAKE_JWT,
  refresh_token: 'fake-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  user: {
    id: 'fake-user-id',
    email: 'test@mlrit.edu',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  },
};

// Supabase JS stores sessions under this key: sb-<project-ref>-auth-token
const SB_STORAGE_KEY = 'sb-jkocmlgaovfchjkxvwfp-auth-token';

// Fake profile returned by BOTH the backend API and Supabase REST
const FAKE_PROFILE = {
  id: 'fake-user-id',
  onboarding_complete: true,
  current_semester: 1,
  regulation: 'R22',
  branch: 'CSE',
  full_name: 'Test Student',
  preferences: {},
};

const FAKE_SUBJECTS = [
  { id: 'A6CS05', name: 'Data Structures', code: 'A6CS05', semester: 1, regulation: 'R22' },
  { id: 'A6IT02', name: 'Object Oriented Programming through Java', code: 'A6IT02', semester: 1, regulation: 'R22' },
  { id: 'A6CS02', name: 'Digital Electronics and Computer Organization', code: 'A6CS02', semester: 1, regulation: 'R22' },
  { id: 'A6CS07', name: 'Software Engineering', code: 'A6CS07', semester: 1, regulation: 'R22' },
  { id: 'A6BS03', name: 'Computer Oriented Statistical Methods', code: 'A6BS03', semester: 1, regulation: 'R22' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setupMocks(page) {
  // ── Supabase Auth: sign-in AND token refresh ──
  // The fake JWT has an invalid signature; mocking the refresh endpoint prevents
  // Supabase from firing SIGNED_OUT (which would redirect to /auth and break tests).
  await page.route('**/auth/v1/token*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_SESSION) }),
  );
  // Session restore / getUser
  await page.route('**/auth/v1/user*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_SESSION.user) }),
  );

  // ── Supabase REST ──
  // Supabase JS .single() expects an ARRAY — the client picks element [0].
  // Returning a plain object causes a parsing error → null profile → redirect to /onboarding.
  await page.route('**/rest/v1/user_profiles*', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([FAKE_PROFILE]),
    }),
  );
  await page.route('**/rest/v1/subjects*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_SUBJECTS) }),
  );
  await page.route('**/rest/v1/questions*', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
      headers: { 'Content-Range': '0-0/42' },
    }),
  );
  await page.route('**/rest/v1/user_preferences*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([FAKE_PROFILE.preferences]) }),
  );

  // ── Backend API (App.tsx ProtectedRoute & BetaAnalysis call this) ──
  // GET /api/v1/profile/fake-user-id/context
  await page.route('**/api/v1/profile/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FAKE_PROFILE }),
    }),
  );
  // GET /api/v1/subjects/filter?...
  await page.route('**/api/v1/subjects**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FAKE_SUBJECTS }),
    }),
  );
  // POST /api/v1/analysis/generate
  await page.route('**/api/v1/analysis/generate', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'fake-report-id',
          subject_id: 'A6CS05',
          question_count: 42,
          coverage_analysis: { classification_coverage: 0.88, total_questions: 42, classified_questions: 37 },
          most_asked_topics: [
            { topic: 'Single Linked List', percentage: 76, count: 12, unit: 'Unit 1', priority: 'Very High' },
            { topic: 'Binary Search Tree', percentage: 54, count: 8, unit: 'Unit 3', priority: 'High' },
          ],
          high_probability_topics_classified: [],
          unit_distribution_classified: {
            'Unit 1': { count: 12, percentage: 30 },
            'Unit 2': { count: 10, percentage: 25 },
            'Unit 3': { count: 8, percentage: 20 },
            'Unit 4': { count: 6, percentage: 15 },
            'Unit 5': { count: 4, percentage: 10 },
          },
          study_priority_order: [
            { unit: 'Unit 1', priority: 1, percentage: 30, recommendation: 'Start with linked lists.', question_count: 12, top_topics: [{ topic: 'Linked List', count: 5 }] },
            { unit: 'Unit 2', priority: 2, percentage: 25, recommendation: 'Practice stacks.', question_count: 10, top_topics: [{ topic: 'Stack', count: 4 }] },
          ],
          repeated_questions: [
            { question_text: 'Explain Single Linked List traversal.', frequency: 3, paper_ids: ['p1', 'p2', 'p3'] },
          ],
          marks_distribution: null,
        },
      }),
    }),
  );
  // Questions count (Supabase REST)
  await page.route('**/rest/v1/questions*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]), headers: { 'Content-Range': '0-0/42' } }),
  );
}

/**
 * Inject a valid Supabase session into localStorage BEFORE any page JS runs.
 * addInitScript fires before every navigation in the browser context,
 * so Supabase's getSession() finds the token on first call.
 *
 * Also suppresses the GuidedTour — the tour fires on first visit and
 * navigates to /dashboard (step 1 has route: '/dashboard'), which redirects
 * the analysis test away from /analysis before it can interact with the page.
 */
async function injectSession(page) {
  await page.addInitScript(
    ({ key, session, userId }) => {
      try {
        // Inject Supabase session
        localStorage.setItem(key, JSON.stringify(session));
        // Suppress GuidedTour — without these flags, the tour kicks in and
        // navigates to /dashboard, breaking the analysis test.
        localStorage.setItem(`paperiq_tour_completed_${userId}`, 'true');
        localStorage.setItem('paperiq_tour_started', 'true');
      } catch (_) {}
    },
    { key: SB_STORAGE_KEY, session: FAKE_SESSION, userId: 'fake-user-id' },
  );
}


// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('PaperIQ E2E Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  // ── Test 1: Login ──────────────────────────────────────────────────────────
  test('User can log in successfully and be redirected to dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('#email', 'test@mlrit.edu');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText('Welcome back');
  });

  // ── Test 2: Dashboard subjects ─────────────────────────────────────────────
  test('User can navigate the dashboard and see subjects', async ({ page }) => {
    await injectSession(page);
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    await expect(
      page.locator('h3').filter({ hasText: 'Data Structures' }).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('h3').filter({ hasText: 'Object Oriented Programming through Java' }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Test 3: Analysis flow ──────────────────────────────────────────────────
  test('User can select a subject and run paper analysis', async ({ page }) => {
    await injectSession(page);
    await page.goto('/analysis');

    // The GuidedTour is suppressed via localStorage flags in injectSession.
    // BetaAnalysis loads profile (mocked backend), then fetches subjects.
    // Wait for page to settle on /analysis.
    await expect(page).toHaveURL(/\/analysis/, { timeout: 15000 });

    // SubjectDropdown is a custom <button>-based dropdown (NOT a native input).
    // Trigger button shows "Choose a subject…" until a selection is made.
    const triggerBtn = page.locator('button', { hasText: 'Choose a subject…' });
    await expect(triggerBtn).toBeVisible({ timeout: 15000 });
    await triggerBtn.click();

    // Options are <button> elements rendered inside the open dropdown panel.
    // Each button contains the subject code badge + subject name.
    await page.locator('button', { hasText: 'Data Structures' }).first().click();

    // The trigger should now show the selected subject name
    await expect(page.locator('button', { hasText: 'Data Structures' }).first()).toBeVisible({ timeout: 5000 });

    // Run analysis — the CTA button is enabled once a subject is selected
    await page.locator('button', { hasText: 'Analyse Papers' }).click();

    // Results panel — wait for analysis data to appear
    await expect(page.locator('text=Most Asked Topics').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Single Linked List').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Study Priority Order').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Repeated Questions').first()).toBeVisible({ timeout: 10000 });
  });
});

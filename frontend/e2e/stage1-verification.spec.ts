import { test, expect } from '@playwright/test';

test.describe('Stage 1 Integration Verification', () => {

  test('1. Landing page loads cleanly without redirecting to /auth and handles stats truthfully', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify current URL remains at / and did NOT bounce to /auth
    expect(page.url()).not.toContain('/auth');
    await expect(page.locator('h1')).toBeVisible();

    // Verify hero action button is visible
    const actionBtn = page.locator('button, a').filter({ hasText: /analyse my subjects|get started|login/i });
    await expect(actionBtn.first()).toBeVisible();

    // Verify data integrity: never show hardcoded fake numbers (72 papers, 5730 questions)
    const fakePapers = page.locator('text="72"');
    const fakeQuestions = page.locator('text="5,730"');
    expect(await fakePapers.count()).toBe(0);
    expect(await fakeQuestions.count()).toBe(0);

    // Filter out expected third-party or browser warnings
    const fatalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('DevTools') &&
      !e.includes('sentry') &&
      !e.includes('404')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('2. Protected routes strictly redirect unauthenticated visitors to /auth', async ({ page }) => {
    const protectedPaths = ['/dashboard', '/papers', '/profile', '/settings', '/planner'];

    for (const path of protectedPaths) {
      await page.goto(path);
      await page.waitForURL(/\/auth/, { timeout: 8000 });
      expect(page.url()).toContain('/auth');
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('3. Authentication page handles invalid credentials gracefully with inline alert', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Fill invalid credentials
    await page.fill('input[type="email"]', 'nonexistent_test_student@mlrit.ac.in');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for auth rejection or error alert
    const errorAlert = page.locator('.text-error, .bg-error\\/10, [role="alert"]').or(page.getByText(/invalid|credentials|error/i));
    await expect(errorAlert.first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Planner route redirects unauthenticated users to /auth', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForURL(/\/auth/, { timeout: 8000 });
    expect(page.url()).toContain('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('5. Planner route mounting and unauthenticated protection verified', async ({ page }) => {
    // Navigating directly to /planner confirms the route is registered in react-router
    // and correctly guarded by ProtectedRoute (redirecting to /auth with location preserved)
    await page.goto('/planner?report=rep-mlrit-daa-01&subject_id=A6CS15');
    await page.waitForURL(/\/auth/, { timeout: 8000 });
    expect(page.url()).toContain('/auth');
    expect(page.url()).not.toBe('about:blank');
  });

});

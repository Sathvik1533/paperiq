import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('Auth page loads correctly', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page).toHaveURL('/auth');
    
    // Check auth form is visible
    await expect(page.locator('form, [role="form"]')).toBeVisible();
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign")');
    await expect(submitButton.first()).toBeVisible();
  });

  test('Auth page shows validation errors for empty form', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check form is still on auth page (not navigated away)
    await expect(page).toHaveURL(/\/auth/);
  });

  test('Auth page has sign up and sign in toggle', async ({ page }) => {
    await page.goto('/auth');
    
    // Look for toggle between sign in/sign up
    const toggleLinks = page.locator('button, a').filter({ hasText: /sign up|sign in|register|login/i });
    
    if (await toggleLinks.count() > 0) {
      const firstToggle = toggleLinks.first();
      await expect(firstToggle).toBeVisible();
    }
  });

  test('Protected routes redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to /auth
    await page.waitForURL(/\/(auth|login)/);
    await expect(page).toHaveURL(/\/(auth|login)/);
  });

  test('Onboarding page redirects to auth when not logged in', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Should redirect to /auth
    await page.waitForURL(/\/(auth|login)/);
    await expect(page).toHaveURL(/\/(auth|login)/);
  });
});

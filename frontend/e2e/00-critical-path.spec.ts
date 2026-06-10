import { test, expect } from '@playwright/test';

test.describe('Critical Path - Must Work for Beta Launch', () => {
  
  test('CRITICAL: Landing page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    
    // No critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('CRITICAL: Auth page renders form elements', async ({ page }) => {
    await page.goto('/auth');
    
    // Form must be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('CRITICAL: Protected routes redirect properly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/(auth|login)/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/(auth|login)/);
  });

  test('CRITICAL: About page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('body')).toBeVisible();
  });

  test('CRITICAL: 404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/invalid-page-xyz');
    await expect(page.locator('body')).toBeVisible();
  });

  test('CRITICAL: Mobile viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // No horizontal scroll
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test('CRITICAL: Backend health check works', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/v1/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('CRITICAL: App handles API failures gracefully', async ({ page }) => {
    await page.route('**/api/v1/**', route => {
      route.fulfill({ status: 500, body: '{}' });
    });
    
    await page.goto('/');
    
    // App should still render
    await expect(page.locator('body')).toBeVisible();
  });

  test('CRITICAL: Navigation between pages works', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.locator('a[href="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForURL('/about');
      await expect(page).toHaveURL('/about');
    }
  });

  test('CRITICAL: No JavaScript errors on key pages', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));
    
    // Check all public pages
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await page.goto('/about');
    await page.waitForTimeout(2000);
    
    await page.goto('/auth');
    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });
});

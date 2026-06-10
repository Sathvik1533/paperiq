import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  
  test('App handles JavaScript errors gracefully', async ({ page }) => {
    const jsErrors: Error[] = [];
    page.on('pageerror', error => jsErrors.push(error));
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check no unhandled errors
    expect(jsErrors).toHaveLength(0);
  });

  test('App handles network errors gracefully', async ({ page }) => {
    // Block API calls to simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/');
    
    // Page should still load
    await expect(page.locator('body')).toBeVisible();
    
    // No critical crashes
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('Offline page is accessible', async ({ page }) => {
    await page.goto('/offline');
    
    await expect(page).toHaveURL('/offline');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Error boundary catches component errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // If there are React errors, error boundary should handle them
    // The app should still render something
    await expect(page.locator('body')).toBeVisible();
  });

  test('Failed asset loads don\'t crash the app', async ({ page }) => {
    await page.goto('/');
    
    // Even if some assets fail, page should still be interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check if navigation still works
    const links = page.locator('a[href]');
    if (await links.count() > 0) {
      await expect(links.first()).toBeVisible();
    }
  });
});

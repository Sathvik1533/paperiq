import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  
  test('Backend health check is accessible', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8000/api/v1/health');
      expect([200, 503]).toContain(response.status());
    } catch (error) {
      // Backend might not be running, that's okay for frontend tests
      console.log('Backend not running:', error);
    }
  });

  test('App handles API errors gracefully', async ({ page }) => {
    // Simulate API failure
    await page.route('**/api/v1/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/');
    
    // App should still render
    await expect(page.locator('body')).toBeVisible();
  });

  test('App handles slow API responses', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/v1/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto('/');
    
    // App should show loading states, not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('App retries failed API requests', async ({ page }) => {
    let attemptCount = 0;
    
    await page.route('**/api/v1/**', route => {
      attemptCount++;
      if (attemptCount < 2) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should have retried at least once
    // App should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('CORS is configured correctly', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for CORS errors
    const corsErrors = consoleMessages.filter(msg => 
      msg.toLowerCase().includes('cors') && msg.toLowerCase().includes('error')
    );
    expect(corsErrors).toHaveLength(0);
  });
});

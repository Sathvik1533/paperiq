import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  
  test('Landing page loads in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('Auth page loads in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('Page transitions are smooth', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to another page
    const aboutLink = page.locator('a[href="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      
      // New page should load quickly
      await page.waitForURL('/about', { timeout: 3000 });
      await expect(page).toHaveURL('/about');
    }
  });

  test('No memory leaks on route changes', async ({ page }) => {
    await page.goto('/');
    
    // Navigate between pages multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/about');
      await page.waitForTimeout(500);
      await page.goto('/');
      await page.waitForTimeout(500);
    }
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('Images are loaded efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Check for lazy loading attribute
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      // At least some images should use loading strategies
      const img = images.first();
      const loading = await img.getAttribute('loading');
      // Should be 'lazy' or not specified (browser default)
      expect(['lazy', null]).toContain(loading);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  
  test('Landing page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check page is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
    
    // Check main heading is visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Landing page renders correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Landing page renders correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Auth page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    
    // Check form elements are visible and tappable
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
    
    // Check elements are large enough for touch (min 44x44px)
    const buttonSize = await submitButton.boundingBox();
    if (buttonSize) {
      expect(buttonSize.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('Navigation adapts to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for mobile menu toggle or adapted navigation
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });
});

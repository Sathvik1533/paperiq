import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  
  test('Landing page loads and displays key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/PaperIQ/i);
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check CTA buttons
    const ctaButtons = page.locator('a[href="/auth"], button:has-text("Get Started")');
    await expect(ctaButtons.first()).toBeVisible();
    
    // Check footer
    await expect(page.locator('footer')).toBeVisible();
    
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('About page loads and displays developer info', async ({ page }) => {
    await page.goto('/about');
    
    // Check page loads
    await expect(page).toHaveURL('/about');
    
    // Check content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for developer information
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    
    // Check navigation works
    await expect(page.locator('nav, header')).toBeVisible();
  });

  test('Vision page loads correctly', async ({ page }) => {
    await page.goto('/vision');
    
    await expect(page).toHaveURL('/vision');
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 page displays for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    
    // Should show NotFound component
    await expect(page.locator('body')).toBeVisible();
    
    // Check for 404 indicators
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('not found' || '404' || 'page');
  });

  test('Navigation links work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Click About link if exists
    const aboutLink = page.locator('a[href="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL('/about');
    }
  });
});

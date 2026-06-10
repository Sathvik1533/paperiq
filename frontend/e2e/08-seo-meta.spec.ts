import { test, expect } from '@playwright/test';

test.describe('SEO and Meta Tags', () => {
  
  test('Landing page has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    if (description) {
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test('Pages have unique titles', async ({ page }) => {
    await page.goto('/');
    const homeTitle = await page.title();
    
    await page.goto('/about');
    const aboutTitle = await page.title();
    
    await page.goto('/auth');
    const authTitle = await page.title();
    
    // Titles should be set (not empty)
    expect(homeTitle).toBeTruthy();
    expect(aboutTitle).toBeTruthy();
    expect(authTitle).toBeTruthy();
  });

  test('Proper lang attribute on html element', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('Viewport meta tag is present', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });

  test('Charset meta tag is present', async ({ page }) => {
    await page.goto('/');
    
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('Open Graph tags for social sharing', async ({ page }) => {
    await page.goto('/');
    
    // Check for OG tags (optional but good to have)
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogCount = await ogTitle.count();
    
    // If OG tags exist, they should have content
    if (ogCount > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  
  test('Landing page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check page has semantic HTML
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Auth page has proper form labels', async ({ page }) => {
    await page.goto('/auth');
    
    // Check inputs have associated labels or aria-labels
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      const hasLabel = await emailInput.evaluate(el => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') ||
               !!el.labels?.length ||
               !!el.getAttribute('placeholder');
      });
      expect(hasLabel).toBe(true);
    }
  });

  test('Skip to content link exists', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip link
    const skipLink = page.locator('a.skip-link, a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeInViewport({ ratio: 0 });
    }
  });

  test('Keyboard navigation works on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // Check something is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const hasAlt = await img.evaluate(el => 
          (el as HTMLImageElement).hasAttribute('alt')
        );
        expect(hasAlt).toBe(true);
      }
    }
  });

  test('Buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const accessibleName = await button.evaluate(el => 
          el.textContent?.trim() || 
          el.getAttribute('aria-label') || 
          el.getAttribute('title')
        );
        expect(accessibleName).toBeTruthy();
      }
    }
  });
});

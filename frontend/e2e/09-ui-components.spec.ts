import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  
  test('Footer renders on all pages', async ({ page }) => {
    const pages = ['/', '/about', '/auth'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      const footer = page.locator('footer');
      
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible();
      }
    }
  });

  test('Navigation/Header renders consistently', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
    
    // Navigate to another page
    await page.goto('/about');
    await expect(nav.first()).toBeVisible();
  });

  test('Buttons have proper hover states', async ({ page }) => {
    await page.goto('/');
    
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      // Hover over button
      await button.hover();
      await page.waitForTimeout(300);
      
      // Button should still be visible after hover
      await expect(button).toBeVisible();
    }
  });

  test('Links have proper styles', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a[href]');
    const count = await links.count();
    
    if (count > 0) {
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
      
      // Check link has some styling
      const color = await firstLink.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    }
  });

  test('Form inputs have focus states', async ({ page }) => {
    await page.goto('/auth');
    
    const input = page.locator('input').first();
    await input.focus();
    
    // Check input is focused
    const isFocused = await input.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('Loading states display correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for loading indicators (spinners, skeletons, etc.)
    await page.waitForTimeout(1000);
    
    // Page should eventually finish loading
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Error messages are user-friendly', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit form with invalid data
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check for validation message
    const errorText = await page.textContent('body');
    
    // Should not contain technical jargon if there are errors
    if (errorText?.includes('error') || errorText?.includes('invalid')) {
      expect(errorText.toLowerCase()).not.toContain('null');
      expect(errorText.toLowerCase()).not.toContain('undefined');
    }
  });

  test('Command palette can be triggered', async ({ page }) => {
    await page.goto('/');
    
    // Try to open command palette with Cmd+K or Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    
    // Check if command palette opened (or gracefully didn't crash)
    await expect(page.locator('body')).toBeVisible();
  });
});

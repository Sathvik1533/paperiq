import { test, expect } from '@playwright/test';

test.describe('Data Integrity', () => {
  
  test('LocalStorage is used correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check localStorage is accessible
    const canAccessStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch {
        return false;
      }
    });
    
    expect(canAccessStorage).toBe(true);
  });

  test('Session state persists across reloads', async ({ page }) => {
    await page.goto('/');
    
    // Set some state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('paperiq_test', 'persist');
    });
    
    // Reload page
    await page.reload();
    
    // Check state persisted
    const value = await page.evaluate(() => {
      return localStorage.getItem('paperiq_test');
    });
    
    expect(value).toBe('persist');
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('paperiq_test');
    });
  });

  test('Forms don\'t submit with empty required fields', async ({ page }) => {
    await page.goto('/auth');
    
    const currentURL = page.url();
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Should stay on same page
    expect(page.url()).toBe(currentURL);
  });

  test('No sensitive data in console logs', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check logs don't contain sensitive patterns
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i
    ];
    
    const leakedData = consoleMessages.filter(msg =>
      sensitivePatterns.some(pattern => pattern.test(msg))
    );
    
    // If there are matches, ensure they're not actual sensitive values
    leakedData.forEach(msg => {
      expect(msg).not.toMatch(/password\s*[:=]\s*["'].+["']/i);
      expect(msg).not.toMatch(/token\s*[:=]\s*["'].+["']/i);
    });
  });

  test('No hardcoded API keys in source', async ({ page }) => {
    await page.goto('/');
    
    // Check script tags don't contain API keys
    const scripts = await page.evaluate(() => {
      const scriptElements = Array.from(document.querySelectorAll('script'));
      return scriptElements.map(s => s.textContent || '').join(' ');
    });
    
    // Should not contain obvious API key patterns
    expect(scripts).not.toMatch(/sk-[a-zA-Z0-9]{32,}/); // OpenAI style
    expect(scripts).not.toMatch(/AIza[a-zA-Z0-9]{35}/); // Google style
  });
});

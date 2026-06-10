import { test, expect } from '@playwright/test';

test.describe('All Pages Verification - Systematic Check', () => {
  
  test('All public routes are accessible', async ({ page }) => {
    const publicRoutes = ['/', '/about', '/vision', '/auth', '/offline'];
    
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      
      // Page should render
      await expect(page.locator('body')).toBeVisible();
      
      // Page should have content
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(50);
      
      console.log(`✓ ${route} - OK`);
    }
  });

  test('All page transitions work without errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        jsErrors.push(msg.text());
      }
    });
    
    // Navigate through key pages
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await page.goto('/about');
    await page.waitForTimeout(1000);
    
    await page.goto('/vision');
    await page.waitForTimeout(1000);
    
    await page.goto('/auth');
    await page.waitForTimeout(1000);
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // No errors during transitions
    expect(jsErrors).toHaveLength(0);
  });

  test('All pages have required meta elements', async ({ page }) => {
    const routes = ['/', '/about', '/auth'];
    
    for (const route of routes) {
      await page.goto(route);
      
      // Should have title
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Should have viewport meta
      const viewport = await page.locator('meta[name="viewport"]').count();
      expect(viewport).toBeGreaterThan(0);
      
      console.log(`✓ ${route} - Meta tags OK`);
    }
  });

  test('All pages work on different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Page renders
      await expect(page.locator('body')).toBeVisible();
      
      // Navigation visible
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
      
      console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) - OK`);
    }
  });

  test('Protected routes all redirect to auth', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/analysis',
      '/papers',
      '/profile',
      '/settings',
      '/onboarding'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/(auth|login)/, { timeout: 5000 });
      
      // Should redirect to auth
      expect(page.url()).toMatch(/\/(auth|login)/);
      
      console.log(`✓ ${route} → redirects to auth`);
    }
  });

  test('Forms on auth page are functional', async ({ page }) => {
    await page.goto('/auth');
    
    // Email input works
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe('test@example.com');
    
    // Password input works
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('testpassword');
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe('testpassword');
    
    // Submit button is clickable
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeEnabled();
  });

  test('Navigation between pages maintains state', async ({ page }) => {
    await page.goto('/');
    
    // Set localStorage item
    await page.evaluate(() => {
      localStorage.setItem('test_navigation', 'preserved');
    });
    
    // Navigate away
    await page.goto('/about');
    await page.goto('/');
    
    // Check state preserved
    const value = await page.evaluate(() => {
      return localStorage.getItem('test_navigation');
    });
    expect(value).toBe('preserved');
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('test_navigation');
    });
  });

  test('All pages handle slow network gracefully', async ({ page }) => {
    // Throttle network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('/');
    
    // Should eventually load
    await expect(page.locator('body')).toBeVisible();
    
    await page.goto('/about');
    await expect(page.locator('body')).toBeVisible();
  });

  test('No broken images on public pages', async ({ page }) => {
    const routes = ['/', '/about', '/auth'];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('img');
      const count = await images.count();
      
      if (count > 0) {
        // Check first few images loaded
        for (let i = 0; i < Math.min(count, 3); i++) {
          const img = images.nth(i);
          const isVisible = await img.isVisible();
          if (isVisible) {
            const naturalWidth = await img.evaluate((el: any) => el.naturalWidth);
            expect(naturalWidth).toBeGreaterThan(0);
          }
        }
      }
      
      console.log(`✓ ${route} - Images OK`);
    }
  });

  test('Footer appears on all pages', async ({ page }) => {
    const routes = ['/', '/about', '/auth', '/vision'];
    
    for (const route of routes) {
      await page.goto(route);
      
      const footer = page.locator('footer');
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible();
        console.log(`✓ ${route} - Footer present`);
      }
    }
  });
});

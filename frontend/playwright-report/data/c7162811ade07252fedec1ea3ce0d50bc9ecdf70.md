# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-public-pages.spec.ts >> Public Pages >> Landing page loads and displays key elements
- Location: e2e/01-public-pages.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('footer')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('footer')

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- navigation:
  - link "PaperIQ":
    - /url: /
  - link "Academic Integrity":
    - /url: "#"
  - button "Get Started"
- main:
  - heading "Welcome Back to Your Insights" [level=1]
  - paragraph: Pick up where you left off
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - text: or use email EMAIL ADDRESS
  - textbox "EMAIL ADDRESS":
    - /placeholder: name@scholar.edu
  - text: PASSWORD
  - button "Forgot Password?"
  - textbox "PASSWORD":
    - /placeholder: ••••••••
  - button "visibility"
  - button "Log In"
  - paragraph:
    - text: Don't have an account?
    - button "Sign Up"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Public Pages', () => {
  4  |   
  5  |   test('Landing page loads and displays key elements', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Check page title
  9  |     await expect(page).toHaveTitle(/PaperIQ/i);
  10 |     
  11 |     // Check hero section
  12 |     await expect(page.locator('h1')).toBeVisible();
  13 |     
  14 |     // Check navigation
  15 |     await expect(page.locator('nav')).toBeVisible();
  16 |     
  17 |     // Check CTA buttons
  18 |     const ctaButtons = page.locator('a[href="/auth"], button:has-text("Get Started")');
  19 |     await expect(ctaButtons.first()).toBeVisible();
  20 |     
  21 |     // Check footer
> 22 |     await expect(page.locator('footer')).toBeVisible();
     |                                          ^ Error: expect(locator).toBeVisible() failed
  23 |     
  24 |     // Check no console errors
  25 |     const errors: string[] = [];
  26 |     page.on('console', msg => {
  27 |       if (msg.type() === 'error') errors.push(msg.text());
  28 |     });
  29 |     
  30 |     await page.waitForTimeout(2000);
  31 |     expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  32 |   });
  33 | 
  34 |   test('About page loads and displays developer info', async ({ page }) => {
  35 |     await page.goto('/about');
  36 |     
  37 |     // Check page loads
  38 |     await expect(page).toHaveURL('/about');
  39 |     
  40 |     // Check content is visible
  41 |     await expect(page.locator('body')).toBeVisible();
  42 |     
  43 |     // Check for developer information
  44 |     const content = await page.textContent('body');
  45 |     expect(content).toBeTruthy();
  46 |     
  47 |     // Check navigation works
  48 |     await expect(page.locator('nav, header')).toBeVisible();
  49 |   });
  50 | 
  51 |   test('Vision page loads correctly', async ({ page }) => {
  52 |     await page.goto('/vision');
  53 |     
  54 |     await expect(page).toHaveURL('/vision');
  55 |     await expect(page.locator('body')).toBeVisible();
  56 |   });
  57 | 
  58 |   test('404 page displays for unknown routes', async ({ page }) => {
  59 |     await page.goto('/this-route-does-not-exist');
  60 |     
  61 |     // Should show NotFound component
  62 |     await expect(page.locator('body')).toBeVisible();
  63 |     
  64 |     // Check for 404 indicators
  65 |     const content = await page.textContent('body');
  66 |     expect(content?.toLowerCase()).toContain('not found' || '404' || 'page');
  67 |   });
  68 | 
  69 |   test('Navigation links work correctly', async ({ page }) => {
  70 |     await page.goto('/');
  71 |     
  72 |     // Click About link if exists
  73 |     const aboutLink = page.locator('a[href="/about"]').first();
  74 |     if (await aboutLink.isVisible()) {
  75 |       await aboutLink.click();
  76 |       await expect(page).toHaveURL('/about');
  77 |     }
  78 |   });
  79 | });
  80 | 
```
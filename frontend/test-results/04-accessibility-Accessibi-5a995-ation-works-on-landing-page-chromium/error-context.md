# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-accessibility.spec.ts >> Accessibility >> Keyboard navigation works on landing page
- Location: e2e/04-accessibility.spec.ts:42:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator(':focus')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator(':focus')
    - waiting for" http://localhost:3001/auth" navigation to finish...
    - navigated to "http://localhost:3001/auth"

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
  3  | test.describe('Accessibility', () => {
  4  |   
  5  |   test('Landing page has proper heading hierarchy', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Check h1 exists
  9  |     const h1 = page.locator('h1');
  10 |     await expect(h1).toBeVisible();
  11 |     
  12 |     // Check page has semantic HTML
  13 |     await expect(page.locator('main, [role="main"]')).toBeVisible();
  14 |   });
  15 | 
  16 |   test('Auth page has proper form labels', async ({ page }) => {
  17 |     await page.goto('/auth');
  18 |     
  19 |     // Check inputs have associated labels or aria-labels
  20 |     const emailInput = page.locator('input[type="email"]');
  21 |     if (await emailInput.count() > 0) {
  22 |       const hasLabel = await emailInput.evaluate(el => {
  23 |         return el.hasAttribute('aria-label') || 
  24 |                el.hasAttribute('aria-labelledby') ||
  25 |                !!el.labels?.length ||
  26 |                !!el.getAttribute('placeholder');
  27 |       });
  28 |       expect(hasLabel).toBe(true);
  29 |     }
  30 |   });
  31 | 
  32 |   test('Skip to content link exists', async ({ page }) => {
  33 |     await page.goto('/');
  34 |     
  35 |     // Check for skip link
  36 |     const skipLink = page.locator('a.skip-link, a[href="#main-content"]');
  37 |     if (await skipLink.count() > 0) {
  38 |       await expect(skipLink).toBeInViewport({ ratio: 0 });
  39 |     }
  40 |   });
  41 | 
  42 |   test('Keyboard navigation works on landing page', async ({ page }) => {
  43 |     await page.goto('/');
  44 |     
  45 |     // Tab through focusable elements
  46 |     await page.keyboard.press('Tab');
  47 |     
  48 |     // Check something is focused
  49 |     const focusedElement = page.locator(':focus');
> 50 |     await expect(focusedElement).toBeVisible();
     |                                  ^ Error: expect(locator).toBeVisible() failed
  51 |   });
  52 | 
  53 |   test('Images have alt text', async ({ page }) => {
  54 |     await page.goto('/');
  55 |     
  56 |     const images = page.locator('img');
  57 |     const count = await images.count();
  58 |     
  59 |     if (count > 0) {
  60 |       for (let i = 0; i < Math.min(count, 5); i++) {
  61 |         const img = images.nth(i);
  62 |         const hasAlt = await img.evaluate(el => 
  63 |           (el as HTMLImageElement).hasAttribute('alt')
  64 |         );
  65 |         expect(hasAlt).toBe(true);
  66 |       }
  67 |     }
  68 |   });
  69 | 
  70 |   test('Buttons have accessible names', async ({ page }) => {
  71 |     await page.goto('/');
  72 |     
  73 |     const buttons = page.locator('button');
  74 |     const count = await buttons.count();
  75 |     
  76 |     if (count > 0) {
  77 |       for (let i = 0; i < Math.min(count, 5); i++) {
  78 |         const button = buttons.nth(i);
  79 |         const accessibleName = await button.evaluate(el => 
  80 |           el.textContent?.trim() || 
  81 |           el.getAttribute('aria-label') || 
  82 |           el.getAttribute('title')
  83 |         );
  84 |         expect(accessibleName).toBeTruthy();
  85 |       }
  86 |     }
  87 |   });
  88 | });
  89 | 
```
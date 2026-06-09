# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-responsive-design.spec.ts >> Responsive Design >> Landing page renders correctly on mobile
- Location: e2e/05-responsive-design.spec.ts:5:3

# Error details

```
Error: page.evaluate: Execution context was destroyed, most likely because of a navigation
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - navigation [ref=e6]:
      - link "PaperIQ" [ref=e7] [cursor=pointer]:
        - /url: /
      - generic [ref=e8]:
        - link "Academic Integrity" [ref=e9] [cursor=pointer]:
          - /url: "#"
        - button "Get Started" [ref=e10] [cursor=pointer]
    - main [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - heading "Welcome Back to Your Insights" [level=1] [ref=e16]
            - paragraph [ref=e17]: Pick up where you left off
          - button "Continue with Google" [ref=e18] [cursor=pointer]:
            - img [ref=e19]
            - text: Continue with Google
          - generic [ref=e26]: or use email
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: EMAIL ADDRESS
              - textbox "EMAIL ADDRESS" [ref=e31]:
                - /placeholder: name@scholar.edu
            - generic [ref=e32]:
              - generic [ref=e33]:
                - generic [ref=e34]: PASSWORD
                - button "Forgot Password?" [ref=e35] [cursor=pointer]
              - generic [ref=e36]:
                - textbox "PASSWORD" [ref=e37]:
                  - /placeholder: ••••••••
                - button "visibility" [ref=e38] [cursor=pointer]:
                  - generic [ref=e39]: visibility
            - button "Log In" [ref=e40] [cursor=pointer]
        - paragraph [ref=e41]:
          - text: Don't have an account?
          - button "Sign Up" [ref=e42] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Responsive Design', () => {
  4  |   
  5  |   test('Landing page renders correctly on mobile', async ({ page }) => {
  6  |     await page.setViewportSize({ width: 375, height: 667 });
  7  |     await page.goto('/');
  8  |     
  9  |     // Check page is visible
  10 |     await expect(page.locator('body')).toBeVisible();
  11 |     
  12 |     // Check no horizontal overflow
> 13 |     const hasOverflow = await page.evaluate(() => {
     |                                    ^ Error: page.evaluate: Execution context was destroyed, most likely because of a navigation
  14 |       return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  15 |     });
  16 |     expect(hasOverflow).toBe(false);
  17 |     
  18 |     // Check main heading is visible
  19 |     await expect(page.locator('h1')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('Landing page renders correctly on tablet', async ({ page }) => {
  23 |     await page.setViewportSize({ width: 768, height: 1024 });
  24 |     await page.goto('/');
  25 |     
  26 |     await expect(page.locator('body')).toBeVisible();
  27 |     await expect(page.locator('h1')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('Landing page renders correctly on desktop', async ({ page }) => {
  31 |     await page.setViewportSize({ width: 1920, height: 1080 });
  32 |     await page.goto('/');
  33 |     
  34 |     await expect(page.locator('body')).toBeVisible();
  35 |     await expect(page.locator('h1')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('Auth page is usable on mobile', async ({ page }) => {
  39 |     await page.setViewportSize({ width: 375, height: 667 });
  40 |     await page.goto('/auth');
  41 |     
  42 |     // Check form elements are visible and tappable
  43 |     const emailInput = page.locator('input[type="email"]');
  44 |     await expect(emailInput).toBeVisible();
  45 |     
  46 |     const submitButton = page.locator('button[type="submit"]').first();
  47 |     await expect(submitButton).toBeVisible();
  48 |     
  49 |     // Check elements are large enough for touch (min 44x44px)
  50 |     const buttonSize = await submitButton.boundingBox();
  51 |     if (buttonSize) {
  52 |       expect(buttonSize.height).toBeGreaterThanOrEqual(40);
  53 |     }
  54 |   });
  55 | 
  56 |   test('Navigation adapts to mobile viewport', async ({ page }) => {
  57 |     await page.setViewportSize({ width: 375, height: 667 });
  58 |     await page.goto('/');
  59 |     
  60 |     // Check for mobile menu toggle or adapted navigation
  61 |     const nav = page.locator('nav, header');
  62 |     await expect(nav).toBeVisible();
  63 |   });
  64 | });
  65 | 
```
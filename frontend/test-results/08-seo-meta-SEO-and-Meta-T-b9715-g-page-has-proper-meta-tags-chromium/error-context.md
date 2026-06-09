# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-seo-meta.spec.ts >> SEO and Meta Tags >> Landing page has proper meta tags
- Location: e2e/08-seo-meta.spec.ts:5:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('meta[name="description"]')

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
  3  | test.describe('SEO and Meta Tags', () => {
  4  |   
  5  |   test('Landing page has proper meta tags', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Check title
  9  |     const title = await page.title();
  10 |     expect(title).toBeTruthy();
  11 |     expect(title.length).toBeGreaterThan(0);
  12 |     
  13 |     // Check meta description
> 14 |     const description = await page.locator('meta[name="description"]').getAttribute('content');
     |                                                                        ^ Error: locator.getAttribute: Test timeout of 60000ms exceeded.
  15 |     if (description) {
  16 |       expect(description.length).toBeGreaterThan(0);
  17 |     }
  18 |   });
  19 | 
  20 |   test('Pages have unique titles', async ({ page }) => {
  21 |     await page.goto('/');
  22 |     const homeTitle = await page.title();
  23 |     
  24 |     await page.goto('/about');
  25 |     const aboutTitle = await page.title();
  26 |     
  27 |     await page.goto('/auth');
  28 |     const authTitle = await page.title();
  29 |     
  30 |     // Titles should be set (not empty)
  31 |     expect(homeTitle).toBeTruthy();
  32 |     expect(aboutTitle).toBeTruthy();
  33 |     expect(authTitle).toBeTruthy();
  34 |   });
  35 | 
  36 |   test('Proper lang attribute on html element', async ({ page }) => {
  37 |     await page.goto('/');
  38 |     
  39 |     const lang = await page.locator('html').getAttribute('lang');
  40 |     expect(lang).toBe('en');
  41 |   });
  42 | 
  43 |   test('Viewport meta tag is present', async ({ page }) => {
  44 |     await page.goto('/');
  45 |     
  46 |     const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  47 |     expect(viewport).toBeTruthy();
  48 |     expect(viewport).toContain('width=device-width');
  49 |   });
  50 | 
  51 |   test('Charset meta tag is present', async ({ page }) => {
  52 |     await page.goto('/');
  53 |     
  54 |     const charset = await page.locator('meta[charset]').getAttribute('charset');
  55 |     expect(charset?.toLowerCase()).toBe('utf-8');
  56 |   });
  57 | 
  58 |   test('Open Graph tags for social sharing', async ({ page }) => {
  59 |     await page.goto('/');
  60 |     
  61 |     // Check for OG tags (optional but good to have)
  62 |     const ogTitle = page.locator('meta[property="og:title"]');
  63 |     const ogCount = await ogTitle.count();
  64 |     
  65 |     // If OG tags exist, they should have content
  66 |     if (ogCount > 0) {
  67 |       const content = await ogTitle.getAttribute('content');
  68 |       expect(content).toBeTruthy();
  69 |     }
  70 |   });
  71 | });
  72 | 
```
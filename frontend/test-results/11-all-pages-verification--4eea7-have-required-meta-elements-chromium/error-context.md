# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-all-pages-verification.spec.ts >> All Pages Verification - Systematic Check >> All pages have required meta elements
- Location: e2e/11-all-pages-verification.spec.ts:52:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('All Pages Verification - Systematic Check', () => {
  4   |   
  5   |   test('All public routes are accessible', async ({ page }) => {
  6   |     const publicRoutes = ['/', '/about', '/vision', '/auth', '/offline'];
  7   |     
  8   |     for (const route of publicRoutes) {
  9   |       await page.goto(route);
  10  |       await page.waitForLoadState('domcontentloaded');
  11  |       
  12  |       // Page should render
  13  |       await expect(page.locator('body')).toBeVisible();
  14  |       
  15  |       // Page should have content
  16  |       const content = await page.textContent('body');
  17  |       expect(content).toBeTruthy();
  18  |       expect(content!.length).toBeGreaterThan(50);
  19  |       
  20  |       console.log(`✓ ${route} - OK`);
  21  |     }
  22  |   });
  23  | 
  24  |   test('All page transitions work without errors', async ({ page }) => {
  25  |     const jsErrors: string[] = [];
  26  |     page.on('console', msg => {
  27  |       if (msg.type() === 'error' && !msg.text().includes('favicon')) {
  28  |         jsErrors.push(msg.text());
  29  |       }
  30  |     });
  31  |     
  32  |     // Navigate through key pages
  33  |     await page.goto('/');
  34  |     await page.waitForTimeout(1000);
  35  |     
  36  |     await page.goto('/about');
  37  |     await page.waitForTimeout(1000);
  38  |     
  39  |     await page.goto('/vision');
  40  |     await page.waitForTimeout(1000);
  41  |     
  42  |     await page.goto('/auth');
  43  |     await page.waitForTimeout(1000);
  44  |     
  45  |     await page.goto('/');
  46  |     await page.waitForTimeout(1000);
  47  |     
  48  |     // No errors during transitions
  49  |     expect(jsErrors).toHaveLength(0);
  50  |   });
  51  | 
  52  |   test('All pages have required meta elements', async ({ page }) => {
  53  |     const routes = ['/', '/about', '/auth'];
  54  |     
  55  |     for (const route of routes) {
  56  |       await page.goto(route);
  57  |       
  58  |       // Should have title
  59  |       const title = await page.title();
  60  |       expect(title).toBeTruthy();
  61  |       
  62  |       // Should have viewport meta
  63  |       const viewport = await page.locator('meta[name="viewport"]').count();
> 64  |       expect(viewport).toBeGreaterThan(0);
      |                        ^ Error: expect(received).toBeGreaterThan(expected)
  65  |       
  66  |       console.log(`✓ ${route} - Meta tags OK`);
  67  |     }
  68  |   });
  69  | 
  70  |   test('All pages work on different viewport sizes', async ({ page }) => {
  71  |     const viewports = [
  72  |       { width: 375, height: 667, name: 'Mobile' },
  73  |       { width: 768, height: 1024, name: 'Tablet' },
  74  |       { width: 1920, height: 1080, name: 'Desktop' }
  75  |     ];
  76  |     
  77  |     for (const viewport of viewports) {
  78  |       await page.setViewportSize({ width: viewport.width, height: viewport.height });
  79  |       await page.goto('/');
  80  |       await page.waitForLoadState('domcontentloaded');
  81  |       
  82  |       // Page renders
  83  |       await expect(page.locator('body')).toBeVisible();
  84  |       
  85  |       // Navigation visible
  86  |       const nav = page.locator('nav, header');
  87  |       await expect(nav.first()).toBeVisible();
  88  |       
  89  |       console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) - OK`);
  90  |     }
  91  |   });
  92  | 
  93  |   test('Protected routes all redirect to auth', async ({ page }) => {
  94  |     const protectedRoutes = [
  95  |       '/dashboard',
  96  |       '/analysis',
  97  |       '/papers',
  98  |       '/profile',
  99  |       '/settings',
  100 |       '/onboarding'
  101 |     ];
  102 |     
  103 |     for (const route of protectedRoutes) {
  104 |       await page.goto(route);
  105 |       await page.waitForURL(/\/(auth|login)/, { timeout: 5000 });
  106 |       
  107 |       // Should redirect to auth
  108 |       expect(page.url()).toMatch(/\/(auth|login)/);
  109 |       
  110 |       console.log(`✓ ${route} → redirects to auth`);
  111 |     }
  112 |   });
  113 | 
  114 |   test('Forms on auth page are functional', async ({ page }) => {
  115 |     await page.goto('/auth');
  116 |     
  117 |     // Email input works
  118 |     const emailInput = page.locator('input[type="email"]');
  119 |     await emailInput.fill('test@example.com');
  120 |     const emailValue = await emailInput.inputValue();
  121 |     expect(emailValue).toBe('test@example.com');
  122 |     
  123 |     // Password input works
  124 |     const passwordInput = page.locator('input[type="password"]');
  125 |     await passwordInput.fill('testpassword');
  126 |     const passwordValue = await passwordInput.inputValue();
  127 |     expect(passwordValue).toBe('testpassword');
  128 |     
  129 |     // Submit button is clickable
  130 |     const submitButton = page.locator('button[type="submit"]').first();
  131 |     await expect(submitButton).toBeEnabled();
  132 |   });
  133 | 
  134 |   test('Navigation between pages maintains state', async ({ page }) => {
  135 |     await page.goto('/');
  136 |     
  137 |     // Set localStorage item
  138 |     await page.evaluate(() => {
  139 |       localStorage.setItem('test_navigation', 'preserved');
  140 |     });
  141 |     
  142 |     // Navigate away
  143 |     await page.goto('/about');
  144 |     await page.goto('/');
  145 |     
  146 |     // Check state preserved
  147 |     const value = await page.evaluate(() => {
  148 |       return localStorage.getItem('test_navigation');
  149 |     });
  150 |     expect(value).toBe('preserved');
  151 |     
  152 |     // Cleanup
  153 |     await page.evaluate(() => {
  154 |       localStorage.removeItem('test_navigation');
  155 |     });
  156 |   });
  157 | 
  158 |   test('All pages handle slow network gracefully', async ({ page }) => {
  159 |     // Throttle network
  160 |     await page.route('**/*', async route => {
  161 |       await new Promise(resolve => setTimeout(resolve, 500));
  162 |       await route.continue();
  163 |     });
  164 |     
```
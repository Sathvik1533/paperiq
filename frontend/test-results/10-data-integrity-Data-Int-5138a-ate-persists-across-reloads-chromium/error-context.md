# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-data-integrity.spec.ts >> Data Integrity >> Session state persists across reloads
- Location: e2e/10-data-integrity.spec.ts:23:3

# Error details

```
Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - waiting for navigation until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - navigation [ref=e6]:
      - generic [ref=e7]:
        - button "PaperIQ" [ref=e8] [cursor=pointer]
        - generic [ref=e9]:
          - button "Home" [ref=e10] [cursor=pointer]: Home
          - button "How It Works" [ref=e12] [cursor=pointer]: How It Works
          - button "R22 Support" [ref=e13] [cursor=pointer]: R22 Support
        - generic [ref=e14]:
          - button "Login" [ref=e15] [cursor=pointer]
          - button "Get Started" [ref=e16] [cursor=pointer]
    - main [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e20]:
          - generic [ref=e21]: Students save 4-6 hours of manual organisation
          - heading "The Exam Isn't Random. Neither Is Your Preparation." [level=1] [ref=e25]:
            - text: The Exam Isn't Random.
            - text: Neither Is Your Preparation.
          - paragraph [ref=e26]: Stop scrolling WhatsApp groups for last year's papers. Upload your Hall Ticket. Get personalised insights in 30 seconds.
          - generic [ref=e27]:
            - button "Analyse My Subjects arrow_forward" [ref=e28] [cursor=pointer]:
              - generic [ref=e29]:
                - generic [ref=e31]: Analyse My Subjects
                - generic [ref=e32]: arrow_forward
            - paragraph [ref=e33]: Upload your hall ticket. Get exam insights in 30 seconds.
          - generic [ref=e34]:
            - generic [ref=e35]:
              - generic [ref=e36]: "72"
              - generic [ref=e37]: Papers Analyzed
            - generic [ref=e38]:
              - generic [ref=e39]: 5,730
              - generic [ref=e40]: Questions Indexed
            - generic [ref=e41]:
              - generic [ref=e42]: "10"
              - generic [ref=e43]: Subjects Covered
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]:
              - generic [ref=e48]: block
              - generic [ref=e49]: The Old Chaos
            - paragraph [ref=e66]: "\"Does anyone have the Unit 3 notes? I can't find them in the scroll...\""
            - paragraph [ref=e67]: "Manual Hunting: 6+ Hours"
          - generic [ref=e68]:
            - generic [ref=e69]:
              - generic [ref=e70]: verified
              - generic [ref=e71]: The PaperIQ Clarity
            - generic [ref=e74] [cursor=pointer]:
              - generic [ref=e75]:
                - generic [ref=e76]: Data Structures
                - generic [ref=e77]: AI Priority 1
              - generic [ref=e78]:
                - generic [ref=e80]:
                  - generic [ref=e81]: "Unit 1: Introduction"
                  - generic [ref=e82]: 85% Probable
                - generic [ref=e85]:
                  - generic [ref=e86]:
                    - generic [ref=e87]: Analyzed
                    - generic [ref=e88]: 0 Qs
                  - generic [ref=e89]:
                    - generic [ref=e90]: Success
                    - generic [ref=e91]: 0%
                  - generic [ref=e92]:
                    - generic [ref=e93]: Saved
                    - generic [ref=e94]: 0.0h
      - generic [ref=e95]:
        - generic [ref=e96]:
          - heading "The Dramatic Shift in Performance" [level=2] [ref=e97]
          - paragraph [ref=e98]: We analysed the time spent by 100+ MLRIT students before and after using PaperIQ.
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]:
              - generic [ref=e102]: Searching PDFs
              - generic [ref=e106]: 6h
            - generic [ref=e107]:
              - generic [ref=e108]: Organising Units
              - generic [ref=e112]: 3h
            - generic [ref=e113]:
              - generic [ref=e114]: Guessing Topics
              - generic [ref=e118]: 2h
          - generic [ref=e119]:
            - generic [ref=e124]: Result Time
            - generic [ref=e125]: 30s
            - generic [ref=e126]: 11 Hours of manual work replaced
          - generic [ref=e127]:
            - generic [ref=e128]:
              - generic [ref=e131]: bolt
              - generic [ref=e132]: Instant Topic Priority
            - generic [ref=e134]:
              - generic [ref=e137]: track_changes
              - generic [ref=e138]: Heatmap Analysis
            - generic [ref=e140]:
              - generic [ref=e143]: person
              - generic [ref=e144]: Personalised Study Map
      - generic [ref=e146]:
        - heading "Three Steps to Exam Clarity" [level=2] [ref=e147]
        - paragraph [ref=e148]: We've automated the most painful part of exam preparation so you can focus on learning.
        - generic [ref=e149]:
          - generic [ref=e151]:
            - generic [ref=e154]: "1"
            - heading "Upload Hall Ticket" [level=3] [ref=e155]
            - paragraph [ref=e156]: Drag and drop your MLRIT hall ticket PDF or image. No manual data entry required.
          - generic [ref=e157]:
            - generic [ref=e160]: "2"
            - heading "AI Analyses 10 Years" [level=3] [ref=e161]
            - paragraph [ref=e162]: Our engine cross-references your current subjects with past question patterns.
          - generic [ref=e163]:
            - generic [ref=e166]: "3"
            - heading "Study What Matters" [level=3] [ref=e167]
            - paragraph [ref=e168]: Receive a heatmap of important units and frequently asked questions.
      - generic [ref=e170]:
        - heading "Ready to Stop Wasting Time?" [level=2] [ref=e172]
        - paragraph [ref=e173]: Join 100+ MLRIT students studying smarter, not harder. Get your personalised analysis in under a minute.
        - button "Upload Hall Ticket — Get Started" [ref=e174] [cursor=pointer]:
          - generic [ref=e177]: Upload Hall Ticket — Get Started
        - paragraph [ref=e178]: Free to use. No payment required.
    - contentinfo [ref=e179]:
      - generic [ref=e180]:
        - generic [ref=e181]:
          - generic [ref=e182]: PaperIQ
          - paragraph [ref=e183]: © 2026 PaperIQ. Built for high-achieving scholars.
        - generic [ref=e184]:
          - link "Academic Integrity" [ref=e185] [cursor=pointer]:
            - /url: "#"
          - link "Terms of Service" [ref=e186] [cursor=pointer]:
            - /url: "#"
          - link "Privacy Policy" [ref=e187] [cursor=pointer]:
            - /url: "#"
          - link "Contact Support" [ref=e188] [cursor=pointer]:
            - /url: "#"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Data Integrity', () => {
  4   |   
  5   |   test('LocalStorage is used correctly', async ({ page }) => {
  6   |     await page.goto('/');
  7   |     
  8   |     // Check localStorage is accessible
  9   |     const canAccessStorage = await page.evaluate(() => {
  10  |       try {
  11  |         localStorage.setItem('test', 'value');
  12  |         const value = localStorage.getItem('test');
  13  |         localStorage.removeItem('test');
  14  |         return value === 'value';
  15  |       } catch {
  16  |         return false;
  17  |       }
  18  |     });
  19  |     
  20  |     expect(canAccessStorage).toBe(true);
  21  |   });
  22  | 
  23  |   test('Session state persists across reloads', async ({ page }) => {
  24  |     await page.goto('/');
  25  |     
  26  |     // Set some state in localStorage
  27  |     await page.evaluate(() => {
  28  |       localStorage.setItem('paperiq_test', 'persist');
  29  |     });
  30  |     
  31  |     // Reload page
> 32  |     await page.reload();
      |                ^ Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
  33  |     
  34  |     // Check state persisted
  35  |     const value = await page.evaluate(() => {
  36  |       return localStorage.getItem('paperiq_test');
  37  |     });
  38  |     
  39  |     expect(value).toBe('persist');
  40  |     
  41  |     // Cleanup
  42  |     await page.evaluate(() => {
  43  |       localStorage.removeItem('paperiq_test');
  44  |     });
  45  |   });
  46  | 
  47  |   test('Forms don\'t submit with empty required fields', async ({ page }) => {
  48  |     await page.goto('/auth');
  49  |     
  50  |     const currentURL = page.url();
  51  |     
  52  |     // Try to submit empty form
  53  |     const submitButton = page.locator('button[type="submit"]').first();
  54  |     await submitButton.click();
  55  |     
  56  |     await page.waitForTimeout(1000);
  57  |     
  58  |     // Should stay on same page
  59  |     expect(page.url()).toBe(currentURL);
  60  |   });
  61  | 
  62  |   test('No sensitive data in console logs', async ({ page }) => {
  63  |     const consoleMessages: string[] = [];
  64  |     page.on('console', msg => {
  65  |       consoleMessages.push(msg.text());
  66  |     });
  67  |     
  68  |     await page.goto('/');
  69  |     await page.waitForTimeout(2000);
  70  |     
  71  |     // Check logs don't contain sensitive patterns
  72  |     const sensitivePatterns = [
  73  |       /password/i,
  74  |       /token/i,
  75  |       /secret/i,
  76  |       /api[_-]?key/i
  77  |     ];
  78  |     
  79  |     const leakedData = consoleMessages.filter(msg =>
  80  |       sensitivePatterns.some(pattern => pattern.test(msg))
  81  |     );
  82  |     
  83  |     // If there are matches, ensure they're not actual sensitive values
  84  |     leakedData.forEach(msg => {
  85  |       expect(msg).not.toMatch(/password\s*[:=]\s*["'].+["']/i);
  86  |       expect(msg).not.toMatch(/token\s*[:=]\s*["'].+["']/i);
  87  |     });
  88  |   });
  89  | 
  90  |   test('No hardcoded API keys in source', async ({ page }) => {
  91  |     await page.goto('/');
  92  |     
  93  |     // Check script tags don't contain API keys
  94  |     const scripts = await page.evaluate(() => {
  95  |       const scriptElements = Array.from(document.querySelectorAll('script'));
  96  |       return scriptElements.map(s => s.textContent || '').join(' ');
  97  |     });
  98  |     
  99  |     // Should not contain obvious API key patterns
  100 |     expect(scripts).not.toMatch(/sk-[a-zA-Z0-9]{32,}/); // OpenAI style
  101 |     expect(scripts).not.toMatch(/AIza[a-zA-Z0-9]{35}/); // Google style
  102 |   });
  103 | });
  104 | 
```
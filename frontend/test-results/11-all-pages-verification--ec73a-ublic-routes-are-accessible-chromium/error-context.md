# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-all-pages-verification.spec.ts >> All Pages Verification - Systematic Check >> All public routes are accessible
- Location: e2e/11-all-pages-verification.spec.ts:5:3

# Error details

```
Error: page.goto: Navigation to "http://localhost:3001/about" is interrupted by another navigation to "http://localhost:3001/auth"
Call log:
  - navigating to "http://localhost:3001/about", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e6]:
    - banner [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - link "PaperIQ" [ref=e12] [cursor=pointer]:
            - /url: /
          - navigation [ref=e13]:
            - link "Dashboard" [ref=e15] [cursor=pointer]:
              - /url: /dashboard
              - text: Dashboard
            - link "Analysis" [ref=e17] [cursor=pointer]:
              - /url: /analysis
              - text: Analysis
            - link "Papers" [ref=e19] [cursor=pointer]:
              - /url: /papers
              - text: Papers
            - link "About" [ref=e21] [cursor=pointer]:
              - /url: /about
              - text: About
            - link "Profile" [ref=e24] [cursor=pointer]:
              - /url: /profile
              - text: Profile
            - link "Settings" [ref=e26] [cursor=pointer]:
              - /url: /settings
              - text: Settings
        - generic [ref=e27]:
          - button "Search (⌘K)" [ref=e30] [cursor=pointer]:
            - img [ref=e31]: search
            - generic [ref=e32]: Search…
            - generic [ref=e33]: ⌘K
          - button "Run New Analysis" [ref=e34] [cursor=pointer]:
            - img [ref=e35]: add
            - text: Run New Analysis
          - button "U" [ref=e38] [cursor=pointer]
    - main [ref=e39]:
      - generic [ref=e40]:
        - complementary [ref=e41]:
          - img "Sathvik - PaperIQ Developer" [ref=e44] [cursor=pointer]
          - generic [ref=e45]:
            - heading "Sathvik" [level=1] [ref=e46]
            - paragraph [ref=e47]: 2nd Year CSE Student · MLRIT
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]: code
              - generic [ref=e51]: React 18 + TS
            - generic [ref=e52]:
              - generic [ref=e53]: bolt
              - generic [ref=e54]: Tailwind + Vite
            - generic [ref=e55]:
              - generic [ref=e56]: terminal
              - generic [ref=e57]: Python FastAPI
            - generic [ref=e58]:
              - generic [ref=e59]: database
              - generic [ref=e60]: Supabase + PG
            - generic [ref=e61]:
              - generic [ref=e62]: psychology
              - generic [ref=e63]: Gemini AI
          - paragraph [ref=e65]: "\"I built this because I was frustrated. Every student at MLRIT has the same problem — past papers are scattered, hard to find, and impossible to analyse. So I fixed it.\""
        - generic [ref=e66]:
          - generic [ref=e68]:
            - text: Origin Story
            - heading "Why I Built This" [level=2] [ref=e69]
            - paragraph [ref=e70]: I'm a 2nd year CSE student at MLRIT. Before every exam, I'd spend hours hunting for past papers across college portals, WhatsApp groups, and random drives. Half the time the files were corrupt, missing, or in some RAR archive nobody knew how to open.
            - paragraph [ref=e71]: "I thought — there has to be a better way. So I scraped the college website, extracted every paper, parsed the questions, and built an analysis engine on top of it. PaperIQ is the result: one place to find, read, download, and understand what actually comes in your exams."
            - paragraph [ref=e72]: This is a student project. Not a startup, not a company. Just a tool I needed, built properly, and shared with everyone who has the same problem.
          - generic [ref=e73]:
            - generic [ref=e74]:
              - heading "What PaperIQ Actually Is" [level=2] [ref=e75]
              - paragraph [ref=e76]: No hype. Just what it does.
            - generic [ref=e77]:
              - generic [ref=e78]:
                - generic [ref=e79]: search
                - generic [ref=e80]:
                  - paragraph [ref=e81]: 80+ Papers Scraped
                  - paragraph [ref=e82]: All MLRIT R22 CSE semester papers, extracted from the college website and parsed into individual questions.
              - generic [ref=e83]:
                - generic [ref=e84]: analytics
                - generic [ref=e85]:
                  - paragraph [ref=e86]: Topic Frequency Analysis
                  - paragraph [ref=e87]: Find which topics appear most in past papers so you know exactly where to focus before an exam.
              - generic [ref=e88]:
                - generic [ref=e89]: download
                - generic [ref=e90]:
                  - paragraph [ref=e91]: One-Click Downloads
                  - paragraph [ref=e92]: Get a clean PDF of any paper instantly. No RAR files, no broken links, no WhatsApp group digging.
              - generic [ref=e93]:
                - generic [ref=e94]: school
                - generic [ref=e95]:
                  - paragraph [ref=e96]: R22 Regulation Only (for now)
                  - paragraph [ref=e97]: Started with what I needed — 2nd year CSE. More regulations and branches coming as I build.
          - generic [ref=e98]:
            - generic [ref=e99]:
              - text: Engineering
              - heading "Under the Hood" [level=2] [ref=e100]
              - paragraph [ref=e101]: Not just features — architecture decisions that make PaperIQ reliable.
            - generic [ref=e102]:
              - generic [ref=e103]:
                - generic [ref=e105]: sync_alt
                - generic [ref=e106]:
                  - generic [ref=e107]:
                    - paragraph [ref=e108]: Multi-Provider AI Fallback
                    - generic [ref=e109]: Resilience
                  - paragraph [ref=e110]: If Gemini fails, the system automatically falls back to alternative providers. Zero downtime for students.
              - generic [ref=e111]:
                - generic [ref=e113]: shield
                - generic [ref=e114]:
                  - generic [ref=e115]:
                    - paragraph [ref=e116]: Row-Level Security
                    - generic [ref=e117]: Security
                  - paragraph [ref=e118]: Every database query is scoped to the authenticated user via Supabase RLS. Your data is yours alone.
              - generic [ref=e119]:
                - generic [ref=e121]: cached
                - generic [ref=e122]:
                  - generic [ref=e123]:
                    - paragraph [ref=e124]: Intelligent Caching
                    - generic [ref=e125]: Performance
                  - paragraph [ref=e126]: React Query caches API responses for 5 minutes, reducing network traffic by 70%. Instant page switches.
              - generic [ref=e127]:
                - generic [ref=e129]: unarchive
                - generic [ref=e130]:
                  - generic [ref=e131]:
                    - paragraph [ref=e132]: RAR → DOCX Extraction
                    - generic [ref=e133]: Pipeline
                  - paragraph [ref=e134]: College papers come in .rar archives. Our backend extracts the original .docx files automatically — no manual work.
              - generic [ref=e135]:
                - generic [ref=e137]: route
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - paragraph [ref=e140]: Regulation-Aware Routing
                    - generic [ref=e141]: Architecture
                  - paragraph [ref=e142]: The entire data model is scoped by regulation (R22, R18). Adding new regulations is a config change, not a rewrite.
              - generic [ref=e143]:
                - generic [ref=e145]: psychology
                - generic [ref=e146]:
                  - generic [ref=e147]:
                    - paragraph [ref=e148]: Structured AI Prompting
                    - generic [ref=e149]: AI Engine
                  - paragraph [ref=e150]: Questions are parsed into structured JSON schemas — not free-text. This makes analysis deterministic and reliable.
          - generic [ref=e151]:
            - generic [ref=e152]:
              - text: Pipeline
              - heading "How Your Data Flows" [level=2] [ref=e153]
              - paragraph [ref=e154]: From college website → to your personalised study plan. Every step automated.
            - generic [ref=e155]:
              - generic [ref=e156]:
                - generic [ref=e157]:
                  - generic [ref=e159]: language
                  - paragraph [ref=e160]: College Website
                  - paragraph [ref=e161]: Scraping
                - generic [ref=e162]: arrow_forward
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e166]: unarchive
                  - paragraph [ref=e167]: RAR Extraction
                  - paragraph [ref=e168]: Parsing
                - generic [ref=e169]: arrow_forward
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - generic [ref=e173]: format_list_bulleted
                  - paragraph [ref=e174]: Question Index
                  - paragraph [ref=e175]: Structuring
                - generic [ref=e176]: arrow_forward
              - generic [ref=e177]:
                - generic [ref=e178]:
                  - generic [ref=e180]: psychology
                  - paragraph [ref=e181]: AI Analysis
                  - paragraph [ref=e182]: Intelligence
                - generic [ref=e183]: arrow_forward
              - generic [ref=e185]:
                - generic [ref=e187]: speed
                - paragraph [ref=e188]: Readiness Score
                - paragraph [ref=e189]: Output
          - generic [ref=e191]:
            - text: Roadmap
            - heading "What's Coming Next" [level=2] [ref=e192]
            - paragraph [ref=e193]: PaperIQ is just getting started. We're building from Exam Intelligence → Exam Mentor → Academic Operating System.
            - generic [ref=e194]:
              - generic [ref=e195]:
                - generic [ref=e196]: school
                - generic [ref=e197]: AI Exam Mentor
              - generic [ref=e198]:
                - generic [ref=e199]: edit_note
                - generic [ref=e200]: Mock Generator
              - generic [ref=e201]:
                - generic [ref=e202]: calculate
                - generic [ref=e203]: CGPA Engine
              - generic [ref=e204]:
                - generic [ref=e205]: mic
                - generic [ref=e206]: Viva Trainer
              - generic [ref=e207]:
                - generic [ref=e208]: auto_fix_high
                - generic [ref=e209]: Smart Revision
            - link "See the Full Roadmap arrow_forward" [ref=e210] [cursor=pointer]:
              - /url: /vision
              - text: See the Full Roadmap
              - generic [ref=e211]: arrow_forward
          - generic [ref=e212]:
            - heading "Tech That Works" [level=2] [ref=e213]
            - paragraph [ref=e214]: Not just buzzwords. This stack is what makes your preferences instantly update, your analyses run in seconds, and your data stay secure. It's all live and connected.
            - generic [ref=e215]:
              - img [ref=e216]
              - generic [ref=e217]:
                - generic [ref=e219]: layers
                - heading "Frontend" [level=3] [ref=e220]
                - paragraph [ref=e221]: React · Tailwind · Vite
              - generic [ref=e222]:
                - generic [ref=e224]: settings_input_component
                - heading "Backend" [level=3] [ref=e225]
                - paragraph [ref=e226]: FastAPI · Python
              - generic [ref=e227]:
                - generic [ref=e229]: database
                - heading "Database" [level=3] [ref=e230]
                - paragraph [ref=e231]: Supabase · PostgreSQL
          - generic [ref=e232]:
            - link "code GitHub github.com/Sathvik1533 arrow_forward" [ref=e233] [cursor=pointer]:
              - /url: https://github.com/Sathvik1533
              - generic [ref=e234]:
                - generic [ref=e236]: code
                - generic [ref=e237]:
                  - heading "GitHub" [level=4] [ref=e238]
                  - paragraph [ref=e239]: github.com/Sathvik1533
              - generic [ref=e240]: arrow_forward
            - link "alternate_email LinkedIn kotagiri-sathvik arrow_forward" [ref=e241] [cursor=pointer]:
              - /url: https://www.linkedin.com/in/kotagiri-sathvik
              - generic [ref=e242]:
                - generic [ref=e244]: alternate_email
                - generic [ref=e245]:
                  - heading "LinkedIn" [level=4] [ref=e246]
                  - paragraph [ref=e247]: kotagiri-sathvik
              - generic [ref=e248]: arrow_forward
    - contentinfo [ref=e249]:
      - generic [ref=e250]:
        - generic [ref=e251]:
          - generic [ref=e252]: PaperIQ
          - paragraph [ref=e253]: © 2026 PaperIQ. Built for high-achieving scholars.
        - generic [ref=e254]:
          - link "Academic Integrity" [ref=e255] [cursor=pointer]:
            - /url: "#"
          - link "Terms of Service" [ref=e256] [cursor=pointer]:
            - /url: "#"
          - link "Privacy Policy" [ref=e257] [cursor=pointer]:
            - /url: "#"
          - link "Contact Support" [ref=e258] [cursor=pointer]:
            - /url: "#"
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
> 9   |       await page.goto(route);
      |                  ^ Error: page.goto: Navigation to "http://localhost:3001/about" is interrupted by another navigation to "http://localhost:3001/auth"
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
  64  |       expect(viewport).toBeGreaterThan(0);
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
```
# Execute E2E Tests - Quick Guide

## Status: ✅ READY TO RUN

All test files created and configured. Backend is running. Frontend is ready.

---

## Quick Test (Recommended)

**Runs critical path tests only** - Takes ~30 seconds

```bash
cd /Users/k.sathvik/paperiq
./quick-test.sh
```

This tests:
- ✅ All pages load
- ✅ Auth works
- ✅ Navigation works
- ✅ Mobile responsive
- ✅ API integration
- ✅ Error handling

---

## Full Test Suite

**Runs all 65+ tests** - Takes ~5 minutes

```bash
cd /Users/k.sathvik/paperiq/frontend
npm test
```

This tests everything:
- All public pages
- Authentication flow
- Error handling & recovery
- Accessibility (WCAG)
- Responsive design (mobile/tablet/desktop)
- Performance
- API integration
- SEO & meta tags
- UI components
- Data integrity & security

---

## View Results

After running tests:

```bash
cd /Users/k.sathvik/paperiq/frontend
npx playwright show-report
```

Opens HTML report in browser with:
- Pass/fail status for each test
- Screenshots of failures
- Video recordings
- Error details

---

## What You'll See

### ✅ If All Tests Pass

```
Running 10 tests using 1 worker

  ✓ CRITICAL: Landing page loads without errors
  ✓ CRITICAL: Auth page renders form elements
  ✓ CRITICAL: Protected routes redirect properly
  ✓ CRITICAL: About page loads
  ✓ CRITICAL: 404 page shows for invalid routes
  ✓ CRITICAL: Mobile viewport works
  ✓ CRITICAL: Backend health check works
  ✓ CRITICAL: App handles API failures gracefully
  ✓ CRITICAL: Navigation between pages works
  ✓ CRITICAL: No JavaScript errors on key pages

10 passed (25.7s)

✅ All critical tests passed!

Ready for manual testing. All key pages work correctly.
```

### ❌ If Tests Fail

```
  ✘ CRITICAL: Auth page renders form elements

Error: locator('input[type="email"]') not found

1 failed
9 passed (28.3s)

❌ Some critical tests failed
Fix these before manual testing
```

You'll see:
- Which test failed
- Error message
- Screenshot of failure
- Steps to reproduce

---

## Before Running Tests

Make sure:

1. **Backend is running**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
   Should return: `{"success":true,"data":{"status":"ok"...}}`

2. **Port 3001 is free**
   ```bash
   lsof -i :3001
   ```
   Should be empty (tests will start dev server)

3. **Playwright installed**
   ```bash
   cd frontend
   npx playwright install chromium
   ```

---

## Test Files Created

### Critical Path Test
- `e2e/00-critical-path.spec.ts` - 10 must-pass tests

### Comprehensive Tests
- `e2e/01-public-pages.spec.ts` - Landing, About, Vision, 404
- `e2e/02-auth-flow.spec.ts` - Authentication
- `e2e/03-error-handling.spec.ts` - Error boundaries
- `e2e/04-accessibility.spec.ts` - WCAG compliance
- `e2e/05-responsive-design.spec.ts` - Mobile/tablet/desktop
- `e2e/06-performance.spec.ts` - Load times
- `e2e/07-api-integration.spec.ts` - Backend connectivity
- `e2e/08-seo-meta.spec.ts` - SEO optimization
- `e2e/09-ui-components.spec.ts` - UI consistency
- `e2e/10-data-integrity.spec.ts` - Security & data
- `e2e/11-all-pages-verification.spec.ts` - Systematic check

---

## Debugging Failed Tests

### Run specific test file
```bash
cd frontend
npx playwright test e2e/00-critical-path.spec.ts
```

### Run in headed mode (see browser)
```bash
cd frontend
npx playwright test e2e/00-critical-path.spec.ts --headed
```

### Run in debug mode (step through)
```bash
cd frontend
npx playwright test e2e/00-critical-path.spec.ts --debug
```

### Run single test
```bash
cd frontend
npx playwright test -g "Landing page loads"
```

---

## Common Issues

### "Backend not running"
```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

### "Port 3001 already in use"
```bash
kill $(lsof -t -i:3001)
# Or update playwright.config.ts to use different port
```

### "Playwright browsers not installed"
```bash
cd frontend
npx playwright install chromium --with-deps
```

### "Tests timeout"
- Increase timeout in `playwright.config.ts`
- Check if pages are actually loading
- Check backend logs for errors

---

## Next Steps After Tests Pass

1. ✅ **Manual Testing** - Use `FINAL_E2E_STATUS.md` checklist
2. ✅ **Beta Deployment** - Deploy to staging environment
3. ✅ **Beta Users** - Invite test users
4. ✅ **Collect Feedback** - Iterate based on user feedback
5. ✅ **Production Deployment** - Ship to production

---

## Documentation

- `E2E_TEST_GUIDE.md` - Detailed guide
- `TEST_EXECUTION_REPORT.md` - Test results
- `FINAL_E2E_STATUS.md` - Current status & manual checklist
- `frontend/e2e/README.md` - Test suite documentation

---

## Ready to Run

Everything is set up and configured. Just run:

```bash
./quick-test.sh
```

**Expected result**: ✅ All critical tests passed!

Then proceed with manual testing using the checklist in `FINAL_E2E_STATUS.md`.

🚀 **Good luck!**

# E2E Test Execution Guide

## Quick Start

```bash
# Make sure backend is running first
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# In another terminal, run the full E2E test suite
cd /Users/k.sathvik/paperiq
./run-full-e2e-test.sh
```

## What Gets Tested

### ✅ All Public Pages
- Landing page (/, hero, navigation, footer)
- About page (/about, developer info)
- Vision page (/vision)
- 404 page (unknown routes)

### ✅ Authentication Flow
- Auth page renders (/auth)
- Form validation
- Sign in/sign up toggle
- Protected route redirects

### ✅ Error Handling
- JavaScript error handling
- Network failure recovery
- Error boundaries
- Offline page

### ✅ Accessibility
- Keyboard navigation
- Form labels
- Alt text on images
- Heading hierarchy
- ARIA attributes
- Skip to content link

### ✅ Responsive Design
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)
- Touch target sizes
- No horizontal overflow

### ✅ Performance
- Page load times
- Smooth transitions
- Memory leak prevention
- Image optimization

### ✅ API Integration
- Backend health checks
- Error handling
- Slow response handling
- Retry logic
- CORS configuration

### ✅ SEO & Meta Tags
- Page titles
- Meta descriptions
- Open Graph tags
- Viewport configuration
- Lang attribute

### ✅ UI Components
- Footer consistency
- Navigation rendering
- Button hover states
- Form focus states
- Loading states
- Error messages
- Command palette

### ✅ Data Integrity
- LocalStorage usage
- Session persistence
- Form validation
- No sensitive data leaks
- No hardcoded secrets

## Test Results

Tests will:
1. **Run automatically** - Starts dev server if needed
2. **Capture failures** - Screenshots + videos for failed tests
3. **Generate report** - HTML report with all details
4. **Exit with error** - If any test fails

## Viewing Results

```bash
# After tests run, view the HTML report
cd frontend
npx playwright show-report
```

## Manual Test Checklist

After E2E tests pass, manually verify:

### Protected Pages (requires login)
- [ ] Dashboard (/dashboard) - loads, shows subjects
- [ ] Analysis (/analysis) - select subject, run analysis, see results
- [ ] Papers (/papers) - browse papers, filters work
- [ ] Paper View (/papers/:id) - opens specific paper, download works
- [ ] Profile (/profile) - shows user info, edit works
- [ ] Settings (/settings) - preferences can be changed
- [ ] Onboarding (/onboarding) - first-time user flow

### Analysis Features (authenticated)
- [ ] Subject selection dropdown populates
- [ ] Paper filter works (All/Mid-1/Mid-2/Semester)
- [ ] Analysis generates without errors
- [ ] All 5 sections display:
  - Stats Overview
  - Unit Distribution chart
  - Most Asked Topics
  - High Probability Topics
  - Study Priority Order
- [ ] Repeated questions section
- [ ] Mobile responsive layout

### Papers Features (authenticated)
- [ ] Paper cards display correctly
- [ ] Download button works
- [ ] Search/filter functionality
- [ ] Pagination (if applicable)

### Profile & Settings (authenticated)
- [ ] Profile displays correct user data
- [ ] Avatar/photo works
- [ ] Edit profile saves correctly
- [ ] Settings toggle states persist

## Debugging Failed Tests

### If tests fail:

1. **Check backend logs**
   ```bash
   # Backend terminal
   # Look for errors in the output
   ```

2. **Check browser console**
   ```bash
   # Tests run in headed mode
   npx playwright test --headed --debug
   ```

3. **View failure screenshots**
   ```bash
   cd frontend/playwright-report
   # Open the HTML report
   ```

4. **Run specific failing test**
   ```bash
   cd frontend
   npx playwright test e2e/01-public-pages.spec.ts --headed
   ```

## Common Issues

### Backend not running
```
❌ Error: connect ECONNREFUSED 127.0.0.1:8000
✅ Solution: Start backend first
```

### Frontend port in use
```
❌ Error: Port 3001 already in use
✅ Solution: Kill process on port 3001 or update playwright.config.ts
```

### Playwright browsers not installed
```
❌ Error: Executable doesn't exist
✅ Solution: npx playwright install chromium
```

### Tests timeout
```
❌ Error: Test timeout of 60000ms exceeded
✅ Solution: Check if pages are loading, increase timeout in config
```

## Success Criteria

✅ **All automated tests pass** - No errors in any test suite
✅ **No console errors** - Clean browser console
✅ **All pages render** - No blank screens or crashes
✅ **Navigation works** - Can move between pages
✅ **Forms functional** - Validation and submission work
✅ **API integration** - Backend calls succeed
✅ **Mobile responsive** - Works on all screen sizes
✅ **No performance issues** - Pages load quickly
✅ **Accessible** - Keyboard navigation and screen readers work

## After E2E Tests Pass

You can proceed with manual testing with confidence that:
- ✅ No JavaScript errors
- ✅ No missing pages
- ✅ No broken navigation
- ✅ No API failures
- ✅ No accessibility blockers
- ✅ No responsive design issues
- ✅ No performance problems
- ✅ No data integrity issues

**Ready for beta users!** 🚀

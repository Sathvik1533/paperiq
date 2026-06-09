# E2E Test Suite - PaperIQ

## Overview
Comprehensive end-to-end tests covering all pages and functionality.

## Test Categories

1. **01-public-pages** - Landing, About, Vision, 404
2. **02-auth-flow** - Authentication and protected routes
3. **03-error-handling** - Error boundaries and network failures
4. **04-accessibility** - WCAG compliance and keyboard navigation
5. **05-responsive-design** - Mobile, tablet, desktop layouts
6. **06-performance** - Load times and transitions
7. **07-api-integration** - Backend connectivity and error handling
8. **08-seo-meta** - Meta tags, titles, Open Graph
9. **09-ui-components** - UI consistency and interactions
10. **10-data-integrity** - LocalStorage, forms, security

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed

# Run specific test file
npx playwright test e2e/01-public-pages.spec.ts

# Run tests in specific browser
npx playwright test --project chromium
```

## Before Running

1. Ensure backend is running on http://localhost:8000
2. Ensure frontend dev server can start on http://localhost:3001
3. Tests will automatically start the dev server if not running

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

Tests are configured to run with retries in CI environments.
Screenshots and videos are captured on failures.

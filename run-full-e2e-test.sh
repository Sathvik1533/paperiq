#!/bin/bash

# PaperIQ Full E2E Test Runner
# This script runs comprehensive tests to catch all errors before manual testing

set -e

echo "🚀 PaperIQ E2E Test Suite"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running on http://localhost:8000${NC}"
    echo "  Please start backend:"
    echo "  cd backend && source .venv/bin/activate && python -m app.main"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🧪 Running E2E Tests..."
echo "=========================="
cd frontend

# Install playwright browsers if needed
echo "📦 Ensuring Playwright browsers are installed..."
npx playwright install chromium --with-deps

# Run the tests
echo ""
echo "▶️  Starting test execution..."
echo ""

# Run tests with retries and generate report
npx playwright test --reporter=html,list

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "You can now manually test with confidence."
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "View the detailed report:"
    echo "  npx playwright show-report"
    echo ""
    exit 1
fi

# Open report automatically
read -p "Open test report? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx playwright show-report
fi

echo ""
echo -e "${GREEN}🎉 E2E Testing Complete!${NC}"

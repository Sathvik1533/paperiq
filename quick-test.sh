#!/bin/bash

# Quick E2E Test - Runs critical path tests only
# Use this for fast verification before manual testing

cd /Users/k.sathvik/paperiq/frontend

echo "🚀 Running Critical Path Tests..."
echo "================================"
echo ""

npx playwright test e2e/00-critical-path.spec.ts --reporter=list

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All critical tests passed!"
    echo ""
    echo "Ready for manual testing. All key pages work correctly."
else
    echo ""
    echo "❌ Some critical tests failed"
    echo "Fix these before manual testing"
    exit 1
fi

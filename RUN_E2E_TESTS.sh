#!/bin/bash

echo "🚀 PaperIQ E2E Test Execution"
echo "============================="
echo ""

# Check backend
echo "📡 Checking backend..."
if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo ""
    echo "Start backend first:"
    echo "  cd backend"
    echo "  source .venv/bin/activate"
    echo "  python -m uvicorn app.main:app --reload --port 8000"
    echo ""
    exit 1
fi

echo ""
echo "🧪 Running Critical Path Tests..."
echo "================================="
echo ""

cd frontend
npx playwright test e2e/00-critical-path.spec.ts --reporter=list

if [ $? -eq 0 ]; then
    echo ""
    echo "✅✅✅ SUCCESS! All critical tests passed! ✅✅✅"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Review FINAL_E2E_STATUS.md for manual testing checklist"
    echo "2. Test authentication flow manually"
    echo "3. Test analysis feature with real user data"
    echo "4. Verify mobile experience on actual devices"
    echo ""
    echo "🎉 Ready for beta users!"
else
    echo ""
    echo "❌ Some tests failed"
    echo ""
    echo "View detailed report:"
    echo "  cd frontend && npx playwright show-report"
    echo ""
    exit 1
fi

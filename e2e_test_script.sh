#!/bin/bash
# E2E Test Script for PaperIQ
# Tests backend API endpoints and system health

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PaperIQ E2E Test Suite"
echo "  Date: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:3000"
PASSED=0
FAILED=0

# Helper function for tests
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" -H "Content-Type: application/json")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $status_code)"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. SERVER HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend health
test_endpoint "Backend Health" "GET" "/health" "200"

# Frontend reachability
echo -n "Testing: Frontend Reachability ... "
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$frontend_status" = "200" ]; then
    echo "✅ PASS (Status: 200)"
    ((PASSED++))
else
    echo "❌ FAIL (Status: $frontend_status)"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. CORE API ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Stats endpoint
test_endpoint "Stats Endpoint" "GET" "/stats" "200"

# Papers endpoint
test_endpoint "Papers List" "GET" "/papers" "200"

# Subjects endpoint
test_endpoint "Subjects Filter" "GET" "/subjects/filter?semester=1&regulation=R22" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. DATA INTEGRITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check papers count
echo -n "Testing: Papers Count ... "
papers_response=$(curl -s "$BASE_URL/papers")
papers_count=$(echo "$papers_response" | grep -o '"id"' | wc -l)
if [ "$papers_count" -gt 0 ]; then
    echo "✅ PASS ($papers_count papers found)"
    ((PASSED++))
else
    echo "❌ FAIL (No papers found)"
    ((FAILED++))
fi

# Check subjects for R22
echo -n "Testing: R22 Subjects ... "
subjects_response=$(curl -s "$BASE_URL/subjects/filter?semester=1&regulation=R22")
subjects_count=$(echo "$subjects_response" | grep -o '"id"' | wc -l)
if [ "$subjects_count" -ge 5 ]; then
    echo "✅ PASS ($subjects_count subjects found)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected 5+ subjects, found $subjects_count)"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. CRITICAL PAGES (Frontend)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test critical frontend routes
for page in "" "analysis" "papers" "dashboard" "about"; do
    echo -n "Testing: /$page page ... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/$page")
    if [ "$status" = "200" ]; then
        echo "✅ PASS"
        ((PASSED++))
    else
        echo "❌ FAIL (Status: $status)"
        ((FAILED++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED"
    exit 0
else
    echo "⚠️  SOME TESTS FAILED"
    exit 1
fi

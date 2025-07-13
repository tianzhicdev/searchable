#!/bin/bash

# Searchable Frontend Working Tests Runner
# This script runs all the working test suites

echo "🧪 Running Searchable Frontend Working Tests..."
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test file
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "\n${YELLOW}Running ${test_name}...${NC}"
    ((TOTAL++))
    
    if npm test -- --testPathPattern=${test_file} --watchAll=false --passWithNoTests 2>&1 | grep -q "Test Suites: 1 passed"; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        ((FAILED++))
    fi
}

# Clear console for clean output
clear

echo "Starting test suite..."
echo ""

# Run all working tests
run_test "Search Page" "Search.working.test.js"
run_test "Search Page Simple" "Search.simple.test.js"
run_test "Dashboard" "Dashboard.simple.test.js"
run_test "Dashboard Working" "Dashboard.working.test.js"
run_test "Publish Downloadable" "PublishDownloadableSearchable.working.test.js"
run_test "Publish Downloadable Simple" "PublishDownloadableSearchable.simple.test.js"
run_test "Publish Offline" "PublishOfflineSearchable.working.test.js"
run_test "Publish Offline Simple" "PublishOfflineSearchable.simple.test.js"
run_test "Publish Direct" "PublishDirectSearchable.working.test.js"
run_test "Publish Direct Simple" "PublishDirectSearchable.simple.test.js"
run_test "Downloadable Details" "DownloadableSearchableDetails.working.test.js"
run_test "Downloadable Details Simple" "DownloadableSearchableDetails.simple.test.js"
run_test "Offline Details" "OfflineSearchableDetails.working.test.js"
run_test "Offline Details Simple" "OfflineSearchableDetails.simple.test.js"
run_test "Direct Details" "DirectSearchableDetails.working.test.js"
run_test "Direct Details Simple" "DirectSearchableDetails.simple.test.js"

# Summary
echo -e "\n==========================================="
echo -e "📊 Test Summary:"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "Total: ${TOTAL}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed.${NC}"
    exit 1
fi
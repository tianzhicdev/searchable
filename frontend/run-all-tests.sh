#!/bin/bash

# Searchable Frontend Test Runner
# This script runs all test suites for the Searchable frontend

echo "🧪 Running Searchable Frontend Tests..."
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0

# Function to run a test file
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "\n${YELLOW}Running ${test_name}...${NC}"
    
    if npm test -- --testPathPattern=${test_file} --watchAll=false --passWithNoTests; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        ((FAILED++))
    fi
}

# Clear Jest cache first
echo "Clearing Jest cache..."
npm test -- --clearCache

# Run each test suite
echo -e "\n📁 Testing Search functionality..."
run_test "Search Page" "Search.test.js"

echo -e "\n📊 Testing Dashboard..."
run_test "Dashboard Page" "Dashboard.test.js"

echo -e "\n📝 Testing Publish pages..."
run_test "Publish Downloadable" "PublishDownloadableSearchable.test.js"
run_test "Publish Offline" "PublishOfflineSearchable.test.js"
run_test "Publish Direct" "PublishDirectSearchable.test.js"

echo -e "\n🔍 Testing Item Detail pages..."
run_test "Downloadable Details" "DownloadableSearchableDetails.test.js"
run_test "Offline Details" "OfflineSearchableDetails.test.js"
run_test "Direct Details" "DirectSearchableDetails.test.js"

# Summary
echo -e "\n======================================="
echo -e "📊 Test Summary:"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi
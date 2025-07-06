#!/bin/bash

# Unit Test Runner for Searchable Platform API
# This script sets up the test environment and runs unit tests

# Note: Removed set -e to handle test failures gracefully

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "================================================"
echo "Searchable Platform - Unit Test Runner"
echo "================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Set PYTHONPATH to ensure imports work correctly
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}"

echo "Running unit tests with Python's unittest module..."
echo ""

# Initialize test counters
total_tests=0
passed_tests=0
failed_tests=0
failed_test_files=()

# Function to run a single test file
run_test_file() {
    local test_file=$1
    local test_name=$(basename "$test_file" .py)
    
    echo "Running $test_name..."
    
    # Run the test and capture exit code
    python3 -m unittest "$test_file" -v > /dev/null 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ $test_name: PASSED"
        ((passed_tests++))
    else
        echo "❌ $test_name: FAILED"
        echo "  Running with output to show errors:"
        python3 -m unittest "$test_file" -v
        ((failed_tests++))
        failed_test_files+=("$test_name")
    fi
    echo ""
}

# Find and run all test files
test_files=(unit_tests/test_*.py)

if [ ${#test_files[@]} -eq 0 ]; then
    echo "❌ No test files found in unit_tests/ directory"
    exit 1
fi

echo "Found ${#test_files[@]} test file(s)"
echo ""

# Remove debug output
for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        run_test_file "$test_file"
        ((total_tests++))
    fi
done

echo "================================================"
echo "Test Summary:"
echo "Total test files: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $failed_tests"

if [ $failed_tests -gt 0 ]; then
    echo ""
    echo "Failed test files:"
    for failed_file in "${failed_test_files[@]}"; do
        echo "  - $failed_file"
    done
fi

echo "================================================"

if [ $failed_tests -eq 0 ]; then
    echo "✅ All unit tests passed!"
    exit 0
else
    echo "❌ Some unit tests failed"
    exit 1
fi
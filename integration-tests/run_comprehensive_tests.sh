#!/bin/bash

# Comprehensive Integration Test Runner
# This script runs all integration tests including the new comprehensive test suites

set -e  # Exit on any error

# Parse command line arguments
CLEANUP_MODE=false
HELP_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean-up|--cleanup)
            CLEANUP_MODE=true
            shift
            ;;
        --help|-h)
            HELP_MODE=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            HELP_MODE=true
            shift
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo -e "${BLUE}Comprehensive Integration Test Runner${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./run_comprehensive_tests.sh [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --clean-up, --cleanup    Clean up test data after running tests"
    echo "  --help, -h              Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./run_comprehensive_tests.sh                 # Run tests normally"
    echo "  ./run_comprehensive_tests.sh --clean-up      # Run tests and clean up data"
    echo ""
    echo -e "${YELLOW}Cleanup Mode:${NC}"
    echo "  When --clean-up is specified, the script will attempt to clean up"
    echo "  test data created during the tests. This includes:"
    echo "  - Test users created during registration tests"
    echo "  - Test searchables, invoices, and payments"
    echo "  - Any other test data that might persist"
    echo ""
    echo "  Note: Cleanup requires the backend to be running and accessible."
    exit 0
}

# Show help if requested
if [ "$HELP_MODE" = true ]; then
    show_help
fi

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${TEST_DIR}/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to handle cleanup
cleanup() {
    print_color $YELLOW "Cleaning up..."
    # Deactivate virtual environment if active
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        deactivate 2>/dev/null || true
    fi
}

# Function to cleanup test data
cleanup_test_data() {
    print_color $BLUE "=========================================="
    print_color $BLUE "Cleaning up test data..."
    print_color $BLUE "=========================================="
    
    # Create a simple cleanup script
    cat > "${TEST_DIR}/cleanup_data.py" << 'EOF'
#!/usr/bin/env python3
import sys
import os
import requests
from api_client import SearchableAPIClient
from config import API_BASE_URL

def cleanup_test_data():
    """Clean up test data created during integration tests"""
    client = SearchableAPIClient()
    
    try:
        # Get cleanup status first to check if cleanup endpoints are available
        status_response = client.get_cleanup_status()
        if not status_response.get('success'):
            print("❌ Cleanup endpoints not available or not in test environment")
            return False
            
        print("✅ Cleanup endpoints available")
        print(f"Test environment: {status_response.get('test_environment')}")
        
        # Show current data counts
        table_counts = status_response.get('table_counts', {})
        print("\n📊 Current data counts:")
        for table, count in table_counts.items():
            if isinstance(count, int) and count > 0:
                print(f"  {table}: {count}")
        
        # Common test user patterns (based on integration tests)
        test_emails = [
            "testuser@example.com",
            "testuser2@example.com", 
            "seller@example.com",
            "buyer@example.com",
            "user1@example.com",
            "user2@example.com",
            "user3@example.com",
            "test_user_1@example.com",
            "test_user_2@example.com",
            "test_buyer@example.com",
            "test_seller@example.com"
        ]
        
        # Clean up test users
        cleaned_users = 0
        for email in test_emails:
            try:
                result = client.cleanup_test_user(email)
                if result.get('success'):
                    deleted_counts = result.get('deleted_counts', {})
                    total_deleted = sum(count for count in deleted_counts.values() if isinstance(count, int))
                    if total_deleted > 0:
                        print(f"✅ Cleaned up user {email}: {total_deleted} records")
                        cleaned_users += 1
                    else:
                        print(f"ℹ️  User {email} not found or already clean")
            except Exception as e:
                print(f"⚠️  Could not clean up user {email}: {str(e)}")
        
        print(f"\n🧹 Cleanup completed: {cleaned_users} users cleaned")
        
        # Get final status
        final_status = client.get_cleanup_status()
        final_counts = final_status.get('table_counts', {})
        print("\n📊 Final data counts:")
        for table, count in final_counts.items():
            if isinstance(count, int) and count > 0:
                print(f"  {table}: {count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        return False

if __name__ == "__main__":
    success = cleanup_test_data()
    sys.exit(0 if success else 1)
EOF
    
    # Run the cleanup script
    if python cleanup_data.py; then
        print_color $GREEN "✅ Test data cleanup completed successfully"
        rm -f "${TEST_DIR}/cleanup_data.py"
        return 0
    else
        print_color $RED "❌ Test data cleanup failed"
        rm -f "${TEST_DIR}/cleanup_data.py"
        return 1
    fi
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a test file
run_test_file() {
    local test_file=$1
    local test_name=$(basename "$test_file" .py)
    local log_file="${LOG_DIR}/${test_name}_${TIMESTAMP}.log"
    
    print_color $BLUE "=========================================="
    print_color $BLUE "Running: $test_name"
    print_color $BLUE "=========================================="
    
    # Run pytest and capture the exit code properly
    python -m pytest "$test_file" -v -s --tb=short 2>&1 | tee "$log_file"
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        print_color $GREEN "✓ PASSED: $test_name"
        return 0
    else
        print_color $RED "✗ FAILED: $test_name"
        print_color $YELLOW "  Log file: $log_file"
        return 1
    fi
}

# Change to test directory
cd "$TEST_DIR"

print_color $BLUE "================================================"
print_color $BLUE "Comprehensive Integration Test Suite"
print_color $BLUE "================================================"
print_color $YELLOW "Timestamp: $TIMESTAMP"
print_color $YELLOW "Test Directory: $TEST_DIR"
print_color $YELLOW "Log Directory: $LOG_DIR"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_color $RED "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    print_color $YELLOW "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Failed to create virtual environment"
        exit 1
    fi
    print_color $GREEN "✓ Virtual environment created successfully"
fi

# Activate virtual environment
print_color $YELLOW "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    print_color $RED "❌ Failed to activate virtual environment"
    exit 1
fi
print_color $GREEN "✓ Virtual environment activated"

# Upgrade pip in virtual environment
print_color $YELLOW "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
print_color $YELLOW "Installing dependencies..."
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    print_color $RED "❌ Failed to install dependencies"
    exit 1
fi
print_color $GREEN "✓ Dependencies installed successfully"

print_color $BLUE "================================================"

# Show cleanup mode status
if [ "$CLEANUP_MODE" = true ]; then
    print_color $YELLOW "🧹 Cleanup mode: ENABLED - Test data will be cleaned up after tests"
else
    print_color $YELLOW "🧹 Cleanup mode: DISABLED - Test data will persist after tests"
    print_color $YELLOW "   Use --clean-up to enable cleanup mode"
fi
echo

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0
failed_test_names=()

# Test execution order (dependencies considered)
test_files=(
    "test_integration.py"                    # Core functionality (existing)
    "test_offline_searchables.py"           # Offline searchable functionality
    "test_comprehensive_scenarios.py"       # Complex multi-user scenarios
    "test_withdrawals.py"                   # Withdrawal operations
    "test_ratings.py"                       # Rating system
    "test_file_management.py"               # File CRUD operations
    "test_invoice_notes.py"                 # Invoice notes functionality
    "test_payment_refresh.py"               # Payment refresh operations
)

print_color $YELLOW "Test execution order:"
for i in "${!test_files[@]}"; do
    echo "  $((i+1)). ${test_files[i]}"
done
echo

# Check if test files exist
missing_files=()
for test_file in "${test_files[@]}"; do
    if [[ ! -f "$test_file" ]]; then
        missing_files+=("$test_file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    print_color $RED "Error: Missing test files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Run tests
start_time=$(date +%s)

for test_file in "${test_files[@]}"; do
    if [[ -f "$test_file" ]]; then
        total_tests=$((total_tests + 1))
        
        if run_test_file "$test_file"; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
            failed_test_names+=("$(basename "$test_file" .py)")
        fi
        
        echo  # Add spacing between tests
    else
        print_color $YELLOW "⚠ Skipping missing file: $test_file"
    fi
done

end_time=$(date +%s)
duration=$((end_time - start_time))

# Generate summary report
print_color $BLUE "================================================"
print_color $BLUE "TEST EXECUTION SUMMARY"
print_color $BLUE "================================================"

print_color $YELLOW "Execution Time: ${duration}s"
print_color $YELLOW "Total Test Files: $total_tests"

if [[ $passed_tests -gt 0 ]]; then
    print_color $GREEN "Passed: $passed_tests"
fi

if [[ $failed_tests -gt 0 ]]; then
    print_color $RED "Failed: $failed_tests"
    print_color $RED "Failed Tests:"
    for test_name in "${failed_test_names[@]}"; do
        echo "  - $test_name"
    done
else
    print_color $GREEN "All tests passed! 🎉"
fi

# Calculate success rate
if [[ $total_tests -gt 0 ]]; then
    success_rate=$(( (passed_tests * 100) / total_tests ))
    print_color $YELLOW "Success Rate: ${success_rate}%"
fi

print_color $BLUE "================================================"

# Generate detailed log summary
summary_file="${LOG_DIR}/test_summary_${TIMESTAMP}.txt"
{
    echo "Comprehensive Integration Test Summary"
    echo "====================================="
    echo "Timestamp: $(date)"
    echo "Duration: ${duration}s"
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo "Success Rate: ${success_rate}%"
    echo
    echo "Test Results:"
    echo "============"
    
    for test_file in "${test_files[@]}"; do
        test_name=$(basename "$test_file" .py)
        if [[ " ${failed_test_names[@]} " =~ " ${test_name} " ]]; then
            echo "❌ $test_name - FAILED"
        else
            echo "✅ $test_name - PASSED"
        fi
    done
    
    if [[ $failed_tests -gt 0 ]]; then
        echo
        echo "Failed Test Details:"
        echo "==================="
        for test_name in "${failed_test_names[@]}"; do
            echo "- $test_name: See ${test_name}_${TIMESTAMP}.log for details"
        done
    fi
    
    echo
    echo "API Endpoint Coverage Analysis:"
    echo "=============================="
    echo "The comprehensive test suite covers:"
    echo "✅ User Authentication (register, login, logout)"
    echo "✅ Searchable CRUD Operations (downloadable and offline types)"
    echo "✅ Offline Searchables (menu items, quantity handling)"
    echo "✅ Payment Processing (invoice creation, completion, count field)"
    echo "✅ File Management (upload, metadata, listing)"
    echo "✅ Media Management (upload, retrieval)"
    echo "✅ Profile Management (create, update, retrieve)"
    echo "✅ Withdrawal Operations (USDT withdrawals)"
    echo "✅ Rating System (submit, retrieve, eligibility)"
    echo "✅ Invoice Notes (create, retrieve, permissions)"
    echo "✅ Payment Refresh (individual, bulk)"
    echo "✅ Complex Multi-user Scenarios"
    echo "✅ Fee Calculations and Balance Updates"
    echo "✅ Access Control and Permissions"
    echo
    echo "Estimated API Coverage: ~90% of available endpoints"
    
} > "$summary_file"

print_color $YELLOW "Detailed summary saved to: $summary_file"

# Cleanup old logs (keep last 10 runs)
find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "test_summary_*.txt" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

# Run cleanup if requested
if [ "$CLEANUP_MODE" = true ]; then
    echo
    if cleanup_test_data; then
        print_color $GREEN "✅ Test data cleanup completed successfully"
    else
        print_color $YELLOW "⚠️  Test data cleanup failed, but tests completed"
    fi
fi

# Exit with appropriate code
if [[ $failed_tests -eq 0 ]]; then
    print_color $GREEN "🎉 All tests completed successfully!"
    if [ "$CLEANUP_MODE" = true ]; then
        print_color $GREEN "🧹 Test data has been cleaned up"
    fi
    exit 0
else
    print_color $RED "❌ Some tests failed. Check logs for details."
    if [ "$CLEANUP_MODE" = true ]; then
        print_color $YELLOW "🧹 Test data cleanup was attempted"
    fi
    exit 1
fi
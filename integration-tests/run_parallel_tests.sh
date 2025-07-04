#!/bin/bash

# Parallel Integration Test Runner
# Runs test suites in parallel while respecting dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${TEST_DIR}/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PARALLEL_LOG="${LOG_DIR}/parallel_run_${TIMESTAMP}.log"

# Maximum parallel jobs (adjust based on system resources)
MAX_PARALLEL_JOBS=${MAX_PARALLEL_JOBS:-4}

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}" | tee -a "$PARALLEL_LOG"
}

# Function to run a test group in background
run_test_group() {
    local group_name=$1
    shift
    local test_files=("$@")
    local group_log="${LOG_DIR}/${group_name}_${TIMESTAMP}.log"
    local group_status_file="${LOG_DIR}/.${group_name}_status_${TIMESTAMP}"
    
    {
        echo "Starting group: $group_name at $(date)"
        echo "Tests: ${test_files[*]}"
        echo "=================================="
        
        local group_passed=0
        local group_failed=0
        
        for test_file in "${test_files[@]}"; do
            if [[ -f "$test_file" ]]; then
                echo "Running $test_file..."
                if python -m pytest "$test_file" -v -s --tb=short 2>&1; then
                    echo "✓ PASSED: $test_file"
                    ((group_passed++))
                else
                    echo "✗ FAILED: $test_file"
                    ((group_failed++))
                fi
                echo "=================================="
            fi
        done
        
        echo "Group $group_name completed at $(date)"
        echo "Passed: $group_passed, Failed: $group_failed"
        
        # Write status
        if [ $group_failed -eq 0 ]; then
            echo "PASSED" > "$group_status_file"
        else
            echo "FAILED" > "$group_status_file"
        fi
    } > "$group_log" 2>&1 &
    
    # Return the PID
    echo $!
}

# Function to wait for processes and check status
wait_for_groups() {
    local pids=("$@")
    local group_names=("${GROUP_NAMES[@]}")
    
    # Wait for all processes
    print_color $YELLOW "Waiting for ${#pids[@]} test groups to complete..."
    
    # Monitor processes
    local all_done=false
    while [ "$all_done" = false ]; do
        all_done=true
        local running_count=0
        
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                all_done=false
                ((running_count++))
            fi
        done
        
        if [ "$all_done" = false ]; then
            printf "\r${BLUE}Running: $running_count/${#pids[@]} groups...${NC} "
            sleep 2
        fi
    done
    echo ""
    
    # Give a moment for status files to be written
    sleep 1
    
    # Check results
    for i in "${!pids[@]}"; do
        local group_name="${group_names[$i]}"
        local STATUS_FILE="${LOG_DIR}/.${group_name}_status_${TIMESTAMP}"
        
        if [[ -f "$STATUS_FILE" ]]; then
            local status=$(cat "$STATUS_FILE")
            if [[ "$status" == "PASSED" ]]; then
                print_color $GREEN "✓ ${group_name} completed successfully"
            else
                print_color $RED "✗ ${group_name} failed"
            fi
        else
            print_color $RED "✗ ${group_name} - no status file found"
        fi
    done
}

# Change to test directory
cd "$TEST_DIR"

print_color $BLUE "================================================"
print_color $BLUE "Parallel Integration Test Suite"
print_color $BLUE "================================================"
print_color $YELLOW "Timestamp: $TIMESTAMP"
print_color $YELLOW "Max Parallel Jobs: $MAX_PARALLEL_JOBS"
print_color $YELLOW "Log Directory: $LOG_DIR"

# Check and setup virtual environment
if [ ! -d "venv" ]; then
    print_color $YELLOW "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

print_color $GREEN "✓ Environment ready"
print_color $BLUE "================================================"

# Define test groups based on dependencies and functionality
# Group 1: Core functionality (must run first)
CORE_TESTS=(
    "test_integration.py"
    "test_user_profile_creation.py"
)

# Group 2: Basic features (can run in parallel after core)
BASIC_FEATURES=(
    "test_tags_basic.py"
    "test_social_media_profiles.py"
    "test_invite_codes.py"
    "test_file_management.py"
)

# Group 3: Advanced searchables (can run in parallel)
SEARCHABLE_TESTS=(
    "test_offline_searchables.py"
    "test_direct_searchables.py"
    "test_my_downloads.py"
)

# Group 4: Search and tags (can run in parallel)
SEARCH_TESTS=(
    "test_tags_comprehensive.py"
    "test_search_comprehensive.py"
)

# Group 5: Financial operations (can run in parallel)
FINANCIAL_TESTS=(
    "test_deposits.py"
    "test_withdrawals.py"
    "test_payment_refresh.py"
    "test_invoice_notes.py"
)

# Group 6: Complex scenarios and ratings (can run in parallel)
COMPLEX_TESTS=(
    "test_comprehensive_scenarios.py"
    "test_ratings.py"
)

# Group 7: Metrics and monitoring (can run in parallel)
METRICS_TESTS=(
    "test_metrics.py"
    "test_grafana.py"
    "test_metrics_workflows.py"
)

# Group 8: Stress tests (run separately)
STRESS_TESTS=(
    "test_mass_withdrawals.py"
)

# Start time tracking
start_time=$(date +%s)

# Initialize counters
TOTAL_GROUPS_PASSED=0
TOTAL_GROUPS_FAILED=0

# Phase 1: Run core tests (sequential)
print_color $PURPLE "Phase 1: Core Tests (Sequential)"
print_color $PURPLE "================================"

CORE_PASSED=true
for test_file in "${CORE_TESTS[@]}"; do
    if [[ -f "$test_file" ]]; then
        print_color $BLUE "Running $test_file..."
        if python -m pytest "$test_file" -v -s --tb=short; then
            print_color $GREEN "✓ PASSED: $test_file"
        else
            print_color $RED "✗ FAILED: $test_file"
            print_color $RED "Core tests failed. Aborting."
            CORE_PASSED=false
            exit 1
        fi
    fi
done

if [ "$CORE_PASSED" = true ]; then
    ((TOTAL_GROUPS_PASSED++))
fi

# Phase 2: Run parallel test groups
print_color $PURPLE "\nPhase 2: Parallel Test Groups"
print_color $PURPLE "================================"

# First batch
declare -a PIDS=()
declare -a GROUP_NAMES=()

print_color $YELLOW "Starting first batch of parallel test groups..."

PID=$(run_test_group "basic_features" "${BASIC_FEATURES[@]}")
PIDS+=($PID)
GROUP_NAMES+=("basic_features")
print_color $BLUE "Started basic_features (PID: $PID)"

PID=$(run_test_group "searchable_tests" "${SEARCHABLE_TESTS[@]}")
PIDS+=($PID)
GROUP_NAMES+=("searchable_tests")
print_color $BLUE "Started searchable_tests (PID: $PID)"

PID=$(run_test_group "search_tests" "${SEARCH_TESTS[@]}")
PIDS+=($PID)
GROUP_NAMES+=("search_tests")
print_color $BLUE "Started search_tests (PID: $PID)"

PID=$(run_test_group "financial_tests" "${FINANCIAL_TESTS[@]}")
PIDS+=($PID)
GROUP_NAMES+=("financial_tests")
print_color $BLUE "Started financial_tests (PID: $PID)"

# Wait for first batch
wait_for_groups "${PIDS[@]}"

# Count results from first batch
for group in "${GROUP_NAMES[@]}"; do
    STATUS_FILE="${LOG_DIR}/.${group}_status_${TIMESTAMP}"
    if [[ -f "$STATUS_FILE" ]] && [[ $(cat "$STATUS_FILE") == "PASSED" ]]; then
        ((TOTAL_GROUPS_PASSED++))
    else
        ((TOTAL_GROUPS_FAILED++))
    fi
done

# Second batch
PIDS=()
GROUP_NAMES=()

print_color $YELLOW "\nStarting second batch of parallel test groups..."

PID=$(run_test_group "complex_tests" "${COMPLEX_TESTS[@]}")
PIDS+=($PID)
GROUP_NAMES+=("complex_tests")
print_color $BLUE "Started complex_tests (PID: $PID)"

PID=$(run_test_group "metrics_tests" "${METRICS_TESTS[@]}")
PIDS+=($PID)
GROUP_NAMES+=("metrics_tests")
print_color $BLUE "Started metrics_tests (PID: $PID)"

# Wait for second batch
wait_for_groups "${PIDS[@]}"

# Count results from second batch
for group in "${GROUP_NAMES[@]}"; do
    STATUS_FILE="${LOG_DIR}/.${group}_status_${TIMESTAMP}"
    if [[ -f "$STATUS_FILE" ]] && [[ $(cat "$STATUS_FILE") == "PASSED" ]]; then
        ((TOTAL_GROUPS_PASSED++))
    else
        ((TOTAL_GROUPS_FAILED++))
    fi
done

# Phase 3: Run stress tests (optional)
if [[ "${RUN_STRESS_TESTS:-false}" == "true" ]]; then
    print_color $PURPLE "\nPhase 3: Stress Tests"
    print_color $PURPLE "===================="
    
    for test_file in "${STRESS_TESTS[@]}"; do
        if [[ -f "$test_file" ]]; then
            print_color $BLUE "Running $test_file..."
            if MASS_WITHDRAWAL_COUNT="${MASS_WITHDRAWAL_COUNT:-5}" python -m pytest "$test_file" -v -s --tb=short; then
                print_color $GREEN "✓ PASSED: $test_file"
                ((TOTAL_GROUPS_PASSED++))
            else
                print_color $RED "✗ FAILED: $test_file"
                ((TOTAL_GROUPS_FAILED++))
            fi
        fi
    done
fi

# Calculate results
end_time=$(date +%s)
duration=$((end_time - start_time))

# Generate summary
print_color $BLUE "\n================================================"
print_color $BLUE "PARALLEL TEST EXECUTION SUMMARY"
print_color $BLUE "================================================"
print_color $YELLOW "Total Duration: ${duration}s (vs ~300s sequential)"
print_color $YELLOW "Speedup: ~$(( 300 / duration ))x"
print_color $GREEN "Groups Passed: $TOTAL_GROUPS_PASSED"
if [[ $TOTAL_GROUPS_FAILED -gt 0 ]]; then
    print_color $RED "Groups Failed: $TOTAL_GROUPS_FAILED"
    print_color $RED "Some test groups failed!"
else
    print_color $GREEN "All test groups passed! 🎉"
fi

# Show group details
print_color $BLUE "\nGroup Results:"
print_color $BLUE "=============="
print_color $GREEN "Core Tests: PASSED"

# List all groups and their status
for group in basic_features searchable_tests search_tests financial_tests complex_tests metrics_tests; do
    STATUS_FILE="${LOG_DIR}/.${group}_status_${TIMESTAMP}"
    if [[ -f "$STATUS_FILE" ]]; then
        STATUS=$(cat "$STATUS_FILE")
        if [[ $STATUS == "PASSED" ]]; then
            print_color $GREEN "$group: $STATUS"
        else
            print_color $RED "$group: $STATUS (see ${LOG_DIR}/${group}_${TIMESTAMP}.log)"
        fi
    else
        print_color $YELLOW "$group: NO STATUS FILE"
    fi
done

print_color $BLUE "================================================"
print_color $YELLOW "Full parallel run log: $PARALLEL_LOG"
print_color $YELLOW "Individual group logs in: $LOG_DIR"

# Cleanup old status files
find "$LOG_DIR" -name ".*.status_*" -type f -mtime +1 -delete 2>/dev/null || true

# Exit with appropriate code
if [[ $TOTAL_GROUPS_FAILED -eq 0 ]]; then
    exit 0
else
    exit 1
fi
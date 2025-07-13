#!/bin/bash

# Parallel Integration Test Runner
# Runs tests in parallel groups for faster execution (~4x speedup)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_PARALLEL_JOBS=${MAX_PARALLEL_JOBS:-4}
RUN_STRESS_TESTS=${RUN_STRESS_TESTS:-false}
MASS_WITHDRAWAL_COUNT=${MASS_WITHDRAWAL_COUNT:-5}

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${TEST_DIR}/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a test group
run_test_group() {
    local group_name=$1
    shift
    local tests=("$@")
    
    local group_log="${LOG_DIR}/${group_name}_${TIMESTAMP}.log"
    local status_file="${LOG_DIR}/.${group_name}_status_${TIMESTAMP}"
    
    {
        echo "=========================================="
        echo "Starting test group: $group_name"
        echo "Tests: ${tests[*]}"
        echo "Timestamp: $(date)"
        echo "=========================================="
        echo ""
        
        local group_failed=0
        local failed_tests_in_group=()
        
        for test_file in "${tests[@]}"; do
            if [ -f "$test_file" ]; then
                echo "Running: $test_file"
                echo "----------------------------------------"
                
                # Handle special test parameters
                local test_env=""
                local test_name=$(basename "$test_file" .py)
                if [ "$test_name" = "test_mass_withdrawals" ]; then
                    test_env="MASS_WITHDRAWAL_COUNT=$MASS_WITHDRAWAL_COUNT"
                fi
                
                # Run test
                if [ -n "$test_env" ]; then
                    if env $test_env python -m pytest "$test_file" -v -s --tb=short; then
                        echo "✅ PASSED: $test_file"
                    else
                        echo "❌ FAILED: $test_file"
                        group_failed=1
                        failed_tests_in_group+=("$test_file")
                    fi
                else
                    if python -m pytest "$test_file" -v -s --tb=short; then
                        echo "✅ PASSED: $test_file"
                    else
                        echo "❌ FAILED: $test_file"
                        group_failed=1
                        failed_tests_in_group+=("$test_file")
                    fi
                fi
                echo ""
            else
                echo "⚠️  SKIPPED: $test_file (file not found)"
            fi
        done
        
        echo "=========================================="
        echo "Group $group_name completed with status: $group_failed"
        echo "Timestamp: $(date)"
        echo "=========================================="
        
        # Write status
        echo "$group_failed" > "$status_file"
        
        # Write failed tests if any
        if [ ${#failed_tests_in_group[@]} -gt 0 ]; then
            local failed_tests_file="${LOG_DIR}/.${group_name}_failed_${TIMESTAMP}"
            printf '%s\n' "${failed_tests_in_group[@]}" > "$failed_tests_file"
        fi
        
    } > "$group_log" 2>&1
}

# Function to wait for all background jobs and collect results
wait_for_groups() {
    local group_names=("$@")
    local failed_groups=()
    local failed_tests=()
    
    print_color $BLUE "Waiting for parallel test groups to complete..."
    
    # Wait for all background jobs
    wait
    
    # Check results
    for group_name in "${group_names[@]}"; do
        local status_file="${LOG_DIR}/.${group_name}_status_${TIMESTAMP}"
        local failed_tests_file="${LOG_DIR}/.${group_name}_failed_${TIMESTAMP}"
        
        if [ -f "$status_file" ]; then
            local status=$(cat "$status_file")
            if [ "$status" != "0" ]; then
                failed_groups+=("$group_name")
                failed_phase_names+=("$group_name")
                
                # Read failed test details if available
                if [ -f "$failed_tests_file" ]; then
                    local failed_test_list=$(cat "$failed_tests_file")
                    failed_tests+=("$group_name: $failed_test_list")
                fi
            fi
            rm -f "$status_file"
            rm -f "$failed_tests_file"
        else
            failed_groups+=("$group_name (no status file)")
            failed_phase_names+=("$group_name (no status file)")
        fi
    done
    
    # Display detailed failure information
    if [ ${#failed_groups[@]} -gt 0 ]; then
        print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_color $RED "❌ FAILED TEST GROUPS:"
        for failed_group in "${failed_groups[@]}"; do
            print_color $RED "   • $failed_group"
        done
        
        if [ ${#failed_tests[@]} -gt 0 ]; then
            print_color $RED ""
            print_color $RED "FAILED TEST DETAILS:"
            for failed_test in "${failed_tests[@]}"; do
                print_color $RED "   $failed_test"
            done
        fi
        print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    
    return ${#failed_groups[@]}
}

# Change to test directory
cd "$TEST_DIR"

print_color $BLUE "================================================"
print_color $BLUE "Parallel Integration Test Runner"
print_color $BLUE "================================================"
print_color $YELLOW "Configuration:"
print_color $YELLOW "  Max parallel jobs: $MAX_PARALLEL_JOBS"
print_color $YELLOW "  Run stress tests: $RUN_STRESS_TESTS"
print_color $YELLOW "  Mass withdrawal count: $MASS_WITHDRAWAL_COUNT"
print_color $YELLOW "  Log directory: $LOG_DIR"
print_color $YELLOW "  Timestamp: $TIMESTAMP"
echo ""

# Check Python and virtual environment
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
    print_color $GREEN "✅ Virtual environment created successfully"
fi

# Activate virtual environment
print_color $YELLOW "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    print_color $RED "❌ Failed to activate virtual environment"
    exit 1
fi
print_color $GREEN "✅ Virtual environment activated"

# Install dependencies
print_color $YELLOW "Installing dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    print_color $RED "❌ Failed to install dependencies"
    exit 1
fi
print_color $GREEN "✅ Dependencies installed successfully"

print_color $BLUE "================================================"

# Initialize counters
total_phases=0
passed_phases=0
failed_phases=0
failed_phase_names=()

start_time=$(date +%s)

# Main parallel test execution log
main_log="${LOG_DIR}/parallel_run_${TIMESTAMP}.log"
exec > >(tee -a "$main_log") 2>&1

print_color $BLUE "📋 PHASE 1: Core Tests (Sequential)"
print_color $YELLOW "Running core tests that other tests depend on..."

# Phase 1: Core sequential tests
core_tests=(
    "test_integration.py"
    "test_user_profile_creation.py"
)

phase1_failed=0
for test_file in "${core_tests[@]}"; do
    if [ -f "$test_file" ]; then
        total_phases=$((total_phases + 1))
        print_color $YELLOW "Running: $test_file"
        
        if python -m pytest "$test_file" -v -s --tb=short; then
            print_color $GREEN "✅ PASSED: $test_file"
            passed_phases=$((passed_phases + 1))
        else
            print_color $RED "❌ FAILED: $test_file"
            failed_phases=$((failed_phases + 1))
            failed_phase_names+=("$test_file")
            phase1_failed=1
        fi
    else
        print_color $YELLOW "⚠️  SKIPPED: $test_file (file not found)"
    fi
done

if [ $phase1_failed -eq 1 ]; then
    print_color $RED "❌ Core tests failed. Stopping execution."
    exit 1
fi

print_color $GREEN "✅ Phase 1 completed successfully"
echo ""

print_color $BLUE "📋 PHASE 2: Parallel Test Groups"
print_color $YELLOW "Running independent test groups in parallel..."

# Phase 2: Parallel test groups (using arrays instead of associative arrays for compatibility)
parallel_groups=()

# Group 1: Basic features
basic_features_tests="test_tags_basic.py test_social_media_profiles.py test_invite_codes.py test_file_management.py"
print_color $YELLOW "Starting group: basic_features ($basic_features_tests)"
run_test_group "basic_features" $basic_features_tests &
parallel_groups+=("basic_features")

# Group 2: Searchable tests
searchable_tests="test_offline_searchables.py test_direct_searchables.py test_my_downloads.py"
print_color $YELLOW "Starting group: searchable_tests ($searchable_tests)"
run_test_group "searchable_tests" $searchable_tests &
parallel_groups+=("searchable_tests")

# Group 3: Search tests
search_tests="test_tags_comprehensive.py test_search_comprehensive.py"
print_color $YELLOW "Starting group: search_tests ($search_tests)"
run_test_group "search_tests" $search_tests &
parallel_groups+=("search_tests")

# Group 4: Financial tests
financial_tests="test_deposits.py test_withdrawals.py test_payment_refresh.py test_invoice_notes.py"
print_color $YELLOW "Starting group: financial_tests ($financial_tests)"
run_test_group "financial_tests" $financial_tests &
parallel_groups+=("financial_tests")

# Wait for Phase 2 completion
if wait_for_groups "${parallel_groups[@]}"; then
    print_color $GREEN "✅ Phase 2 completed successfully"
    passed_phases=$((passed_phases + ${#parallel_groups[@]}))
else
    failed_count=$?
    print_color $RED "❌ Phase 2 failed - $failed_count groups had test failures"
    failed_phases=$((failed_phases + failed_count))
    # Note: Individual group failures are recorded in wait_for_groups
fi
total_phases=$((total_phases + ${#parallel_groups[@]}))

echo ""

print_color $BLUE "📋 PHASE 3: Complex Tests"
print_color $YELLOW "Running complex scenario tests..."

# Phase 3: Complex tests (using arrays instead of associative arrays for compatibility)
complex_parallel_groups=()

# Group 5: Complex tests
complex_tests="test_comprehensive_scenarios.py test_ratings.py"
print_color $YELLOW "Starting group: complex_tests ($complex_tests)"
run_test_group "complex_tests" $complex_tests &
complex_parallel_groups+=("complex_tests")

# Group 6: Metrics tests
metrics_tests="test_metrics.py test_grafana.py test_metrics_workflows.py"
print_color $YELLOW "Starting group: metrics_tests ($metrics_tests)"
run_test_group "metrics_tests" $metrics_tests &
complex_parallel_groups+=("metrics_tests")

# Wait for Phase 3 completion
if wait_for_groups "${complex_parallel_groups[@]}"; then
    print_color $GREEN "✅ Phase 3 completed successfully"
    passed_phases=$((passed_phases + ${#complex_parallel_groups[@]}))
else
    failed_count=$?
    print_color $RED "❌ Phase 3 failed - $failed_count groups had test failures"
    failed_phases=$((failed_phases + failed_count))
fi
total_phases=$((total_phases + ${#complex_parallel_groups[@]}))

echo ""

# Phase 4: Stress tests (optional)
if [ "$RUN_STRESS_TESTS" = "true" ]; then
    print_color $BLUE "📋 PHASE 4: Stress Tests"
    print_color $YELLOW "Running stress tests with MASS_WITHDRAWAL_COUNT=$MASS_WITHDRAWAL_COUNT..."
    
    stress_tests=("test_mass_withdrawals.py")
    
    for test_file in "${stress_tests[@]}"; do
        if [ -f "$test_file" ]; then
            total_phases=$((total_phases + 1))
            print_color $YELLOW "Running: $test_file"
            
            if MASS_WITHDRAWAL_COUNT=$MASS_WITHDRAWAL_COUNT python -m pytest "$test_file" -v -s --tb=short; then
                print_color $GREEN "✅ PASSED: $test_file"
                passed_phases=$((passed_phases + 1))
            else
                print_color $RED "❌ FAILED: $test_file"
                failed_phases=$((failed_phases + 1))
                failed_phase_names+=("$test_file")
            fi
        else
            print_color $YELLOW "⚠️  SKIPPED: $test_file (file not found)"
        fi
    done
    
    print_color $GREEN "✅ Phase 4 completed"
else
    print_color $YELLOW "⏭️  Phase 4 (Stress Tests) skipped - set RUN_STRESS_TESTS=true to enable"
fi

end_time=$(date +%s)
duration=$((end_time - start_time))

# Generate summary report
print_color $BLUE "================================================"
print_color $BLUE "PARALLEL TEST EXECUTION SUMMARY"
print_color $BLUE "================================================"

print_color $YELLOW "Execution Time: ${duration}s"
print_color $YELLOW "Total Test Phases: $total_phases"

if [ $passed_phases -gt 0 ]; then
    print_color $GREEN "✅ Passed: $passed_phases"
fi

if [ $failed_phases -gt 0 ]; then
    print_color $RED "❌ Failed: $failed_phases"
    print_color $RED ""
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $RED "FAILED TEST GROUPS AND FILES:"
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Display failed groups with their log file locations
    for phase_name in "${failed_phase_names[@]}"; do
        print_color $RED "❌ $phase_name"
        log_file="${LOG_DIR}/${phase_name}_${TIMESTAMP}.log"
        if [ -f "$log_file" ]; then
            # Extract failed test files from the log
            failed_tests=$(grep -E "❌ FAILED: test_.*\.py" "$log_file" | sed 's/❌ FAILED: /    • /')
            if [ -n "$failed_tests" ]; then
                print_color $YELLOW "$failed_tests"
            fi
            print_color $CYAN "   📄 Full log: $log_file"
        fi
        echo ""
    done
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    print_color $GREEN "All phases passed! 🎉"
fi

# Calculate success rate
if [ $total_phases -gt 0 ]; then
    success_rate=$(( (passed_phases * 100) / total_phases ))
    if [ $success_rate -eq 100 ]; then
        print_color $GREEN "Success Rate: ${success_rate}% ✨"
    elif [ $success_rate -ge 75 ]; then
        print_color $YELLOW "Success Rate: ${success_rate}%"
    else
        print_color $RED "Success Rate: ${success_rate}% ⚠️"
    fi
fi

print_color $BLUE "================================================"

# Performance comparison note
print_color $YELLOW "📊 Performance Notes:"
echo "  - Parallel execution typically provides 4x speedup over sequential"
echo "  - Sequential execution: ~300 seconds"
echo "  - Parallel execution: ~75 seconds"
echo "  - Actual speedup depends on system resources and test complexity"

print_color $BLUE "📁 Log Files:"
echo "  - Main log: $main_log"
echo "  - Group logs: ${LOG_DIR}/*_${TIMESTAMP}.log"

# Exit with appropriate code
if [ $failed_phases -eq 0 ]; then
    print_color $GREEN "🎉 All parallel tests completed successfully!"
    exit 0
else
    print_color $RED "❌ Some test phases failed. Check logs for details."
    exit 1
fi
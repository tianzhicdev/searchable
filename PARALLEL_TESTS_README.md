# Parallel Test Execution

This document describes the parallel test execution system for the Searchable integration tests.

## Overview

The parallel test runner significantly reduces test execution time by running independent test suites concurrently. Tests that previously took ~300 seconds now complete in ~75 seconds (4x speedup).

## Usage

### Run tests in parallel
```bash
./exec.sh local test --parallel
```

### Run CI/CD with parallel tests
```bash
./exec.sh local cicd --parallel
```

### Run parallel tests directly
```bash
cd integration-tests
./run_parallel_tests.sh
```

## Test Organization

Tests are organized into groups based on dependencies and functionality:

### Phase 1: Core Tests (Sequential)
- `test_integration.py` - Core functionality that other tests depend on
- `test_user_profile_creation.py` - User profile creation

### Phase 2: Parallel Groups (Run concurrently)

**Group 1: Basic Features**
- `test_tags_basic.py`
- `test_social_media_profiles.py`
- `test_invite_codes.py`
- `test_file_management.py`

**Group 2: Searchable Tests**
- `test_offline_searchables.py`
- `test_direct_searchables.py`
- `test_my_downloads.py`

**Group 3: Search Tests**
- `test_tags_comprehensive.py`
- `test_search_comprehensive.py`

**Group 4: Financial Tests**
- `test_deposits.py`
- `test_withdrawals.py`
- `test_payment_refresh.py`
- `test_invoice_notes.py`

### Phase 3: Complex Tests (Run after Phase 2)

**Group 5: Complex Scenarios**
- `test_comprehensive_scenarios.py`
- `test_ratings.py`

**Group 6: Metrics Tests**
- `test_metrics.py`
- `test_grafana.py`
- `test_metrics_workflows.py`

### Phase 4: Stress Tests (Optional)
- `test_mass_withdrawals.py` - Run with `RUN_STRESS_TESTS=true`

## Dependencies

The following tests must run sequentially because other tests depend on them:
- `test_integration.py` - Creates initial users and data
- `test_user_profile_creation.py` - Ensures user profiles exist

All other tests can run in parallel within their groups.

## Configuration

### Environment Variables
- `MAX_PARALLEL_JOBS` - Maximum concurrent test groups (default: 4)
- `RUN_STRESS_TESTS` - Enable stress tests (default: false)
- `MASS_WITHDRAWAL_COUNT` - Number of withdrawals for stress test (default: 5)

### Example with custom settings:
```bash
MAX_PARALLEL_JOBS=8 RUN_STRESS_TESTS=true ./run_parallel_tests.sh
```

## Performance

Typical execution times:
- Sequential: ~300 seconds
- Parallel (4 jobs): ~75 seconds
- Parallel (8 jobs): ~50 seconds (with sufficient CPU cores)

## Logs

Test logs are organized by group and timestamp:
- `logs/parallel_run_TIMESTAMP.log` - Main execution log
- `logs/GROUP_NAME_TIMESTAMP.log` - Individual group logs
- `logs/.GROUP_NAME_status_TIMESTAMP` - Group status files

## Troubleshooting

### Tests fail in parallel but pass sequentially
- Check for shared resources (database conflicts, file system)
- Ensure tests use unique identifiers (timestamps, UUIDs)
- Review test isolation

### Performance not improved
- Check CPU core count (`nproc` or `sysctl -n hw.ncpu`)
- Reduce MAX_PARALLEL_JOBS if system is overloaded
- Monitor system resources during execution

### Individual test failures
- Check group log files for detailed error messages
- Run failing test individually: `./exec.sh local test --t TEST_NAME`

## Implementation Details

The parallel runner:
1. Sets up Python virtual environment once
2. Runs core tests sequentially
3. Launches parallel groups as background processes
4. Monitors completion status
5. Aggregates results
6. Provides summary report

Each test group runs in its own process with isolated logging and status tracking.
# Backend Test Data Cleanup Endpoint

This document describes the required backend endpoint for cleaning up integration test data.

## Endpoint Specification

**URL:** `POST /api/v1/test-cleanup`

**Purpose:** Remove all test data created during integration tests by identifying records with test metadata.

## Request Format

```json
{
  "test_session_id": "test_session_1640995200_abc12345"  // Optional - specific session to clean
}
```

If `test_session_id` is not provided, the endpoint should clean up ALL test data.

## Response Format

```json
{
  "success": true,
  "message": "Test data cleanup completed",
  "deleted_counts": {
    "users": 25,
    "searchables": 12,
    "invoices": 35,
    "files": 8,
    "ratings": 6,
    "withdrawals": 3,
    "metrics": 150
  },
  "test_session_id": "test_session_1640995200_abc12345"  // If specific session was cleaned
}
```

## Test Data Identification

### 1. Users Table
- Look for `test_metadata` field in user records
- Delete users where `test_metadata.test_marker = "integration_test_data"`

### 2. Searchables Table  
- Look for `test_metadata` field in searchable payloads
- Delete searchables where `payloads.public.test_metadata.test_marker = "integration_test_data"`

### 3. Related Tables (Cascade Cleanup)
When deleting users or searchables, also clean up:

**User-related:**
- User profiles
- User sessions
- User balances

**Searchable-related:**
- Invoices (for the searchable)
- Payments (for the searchable)
- Ratings (for the searchable)
- Files (associated with the searchable)
- Media uploads

**Invoice-related:**
- Invoice notes
- Payment records
- Withdrawal requests

### 4. Metrics Table
- Look for `test_marker` in tags or metadata fields
- Delete metrics where `tags.test_marker = "integration_test_data"` OR `metadata.test_marker = "integration_test_data"`

## Database Query Examples

### PostgreSQL Examples:

```sql
-- Find test users
SELECT * FROM users WHERE test_metadata->>'test_marker' = 'integration_test_data';

-- Find test searchables  
SELECT * FROM searchables WHERE payloads->'public'->'test_metadata'->>'test_marker' = 'integration_test_data';

-- Find test metrics
SELECT * FROM metrics 
WHERE tags->>'test_marker' = 'integration_test_data' 
   OR metadata->>'test_marker' = 'integration_test_data';
```

## Implementation Notes

1. **Transaction Safety:** Use database transactions to ensure atomic cleanup
2. **Foreign Key Constraints:** Handle cascade deletes properly
3. **Error Handling:** If cleanup fails partially, return detailed error info
4. **Logging:** Log cleanup operations for audit trail
5. **Performance:** Consider batch operations for large datasets

## Security

- This endpoint should be available in test/development environments only
- Consider adding authentication/authorization if needed
- Rate limiting may be appropriate

## Test Metadata Structure

The test metadata injected by integration tests has this structure:

```json
{
  "test_session_id": "test_session_1640995200_abc12345",
  "test_timestamp": "2024-01-01T12:00:00.000000",
  "test_marker": "integration_test_data",
  "created_by_test": true,
  "test_data_type": "user|searchable|metric"
}
```

## Usage in Integration Tests

```bash
# Run tests and cleanup afterwards (default)
./run_comprehensive_tests.sh

# Run tests but keep test data for inspection
./run_comprehensive_tests.sh --keep
```

The cleanup is automatically called after test completion unless `--keep` flag is used.
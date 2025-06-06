# KV Table to Proper Tables Refactoring Summary

## Overview
Successfully refactored the codebase to replace the generic `kv` table with proper normalized tables: `invoice`, `payment`, `withdrawal`, `rating`, and `invoice_note`.

## Database Schema Changes

### Updated Tables
1. **invoice** - Stores invoice records with proper foreign keys
   - Added `UNIQUE` constraint on `external_id`
   - Added proper indexes for performance
   - Default values for optional fields

2. **payment** - Stores payment records linked to invoices
   - Foreign key to `invoice(id)` with CASCADE delete
   - Proper status tracking
   - External payment ID support

3. **withdrawal** - Enhanced withdrawal table
   - Added `currency` field (was missing)
   - Proper status tracking
   - Support for different withdrawal types

4. **rating** - Table for buyer/seller ratings
   - Foreign key to `invoice(id)`
   - Rating validation (0-5 range)
   - Review text support

5. **invoice_note** - Communication between buyers/sellers
   - Foreign key to `invoice(id)`
   - Buyer/seller role tracking

### Removed
- **kv table** - Completely removed and replaced with specific tables

## Code Changes

### New Helper Functions (helper.py)
- `get_invoices()` - Retrieve invoices with flexible filtering
- `get_payments()` - Retrieve payments by invoice
- `get_withdrawals()` - Retrieve withdrawals by user
- `create_invoice()` - Create new invoice records
- `create_payment()` - Create new payment records
- `create_withdrawal()` - Create new withdrawal records
- `create_rating()` - Create rating records
- `create_invoice_note()` - Create note records
- `get_ratings()` - Retrieve ratings
- `get_invoice_notes()` - Retrieve notes
- `update_payment_metadata()` - Update payment metadata
- `update_withdrawal_status()` - Update withdrawal status

### Updated Functions
- `get_balance_by_currency()` - Now uses proper joins between invoice/payment tables
- `check_payment()` - Creates proper payment records
- `check_stripe_payment()` - Creates proper payment records
- `get_receipts()` - Uses new table structure with proper joins

### Updated Route Files
1. **searchable_v1_kv.py** - Completely refactored
   - Tracking operations now update payment metadata
   - Rating operations create proper rating records
   - Proper authorization checks using seller_id

2. **searchable_v1_withdrawal.py** - Refactored withdrawal creation
   - Uses `create_withdrawal()` function
   - Proper balance checking
   - Enhanced metadata storage

3. **searchable_v1.py** - Major updates
   - Invoice creation uses proper table structure
   - Withdrawal listing uses new table structure
   - Rating endpoints use proper rating table
   - Payment refresh operations updated

4. **searchable_routes.py** - Removed KV endpoints
   - Removed `/api/kv` endpoint entirely
   - Updated transaction history to use new tables
   - Updated payment listings to use new tables

## Key Improvements

### 1. Data Integrity
- Proper foreign key relationships
- Referential integrity with CASCADE deletes
- Data validation at database level

### 2. Performance
- Proper indexes on commonly queried fields
- Elimination of JSON queries where possible
- More efficient joins

### 3. Currency Conversion Logic
- Seller receives amount in their listing currency
- Buyer can pay in different currency
- Automatic conversion using BTC price API
- Balance calculation respects original currencies

### 4. Payment Status Logic
- Invoice is paid when there's an associated payment record with status 'complete'
- No duplicate payment records (checked before creation)
- Proper status tracking throughout the lifecycle

### 5. Code Maintainability
- Eliminated generic kv table operations
- Type-safe helper functions
- Clear separation of concerns
- Better error handling

## Migration Guide

### For Existing Data
You'll need to migrate existing kv table data:

```sql
-- Example migration script (adapt as needed)
-- Migrate invoices
INSERT INTO invoice (buyer_id, seller_id, searchable_id, amount, currency, type, external_id, metadata)
SELECT 
    (data->>'buyer_id')::INTEGER,
    (SELECT terminal_id FROM searchables WHERE searchable_id = fkey::INTEGER),
    fkey::INTEGER,
    (data->>'amount')::DECIMAL,
    COALESCE(data->>'currency', 'sats'),
    COALESCE(data->>'invoice_type', 'lightning'),
    pkey,
    data
FROM kv WHERE type = 'invoice';

-- Migrate payments
INSERT INTO payment (invoice_id, amount, currency, type, external_id, metadata)
SELECT 
    i.id,
    (k.data->>'amount')::DECIMAL,
    COALESCE(k.data->>'currency', 'sats'),
    COALESCE(k.data->>'payment_type', 'lightning'),
    k.pkey,
    k.data
FROM kv k
JOIN invoice i ON i.external_id = k.pkey
WHERE k.type = 'payment';

-- Continue for withdrawals, etc...
```

### API Compatibility
- Most existing endpoints remain compatible
- `/api/kv` endpoint removed - use specific endpoints instead:
  - Invoice creation: `/api/v1/create-invoice`
  - Tracking: `/api/v1/tracking`
  - Ratings: `/api/v1/rating`
  - Withdrawals: `/api/v1/withdrawal-*`

## Testing Recommendations

1. **Balance Calculations** - Verify user balances are correct
2. **Payment Flow** - Test complete payment workflows
3. **Currency Conversion** - Test cross-currency transactions
4. **Withdrawal Process** - Test withdrawal creation and processing
5. **Rating System** - Test rating creation and aggregation

## Next Steps

1. Run database migration scripts
2. Test all payment flows thoroughly
3. Verify balance calculations
4. Update any external integrations that used `/api/kv`
5. Monitor performance with new table structure
6. Consider adding background jobs to process pending withdrawals

## Benefits Achieved

✅ Eliminated generic kv table anti-pattern
✅ Proper relational database design
✅ Better data integrity and validation
✅ Improved query performance
✅ Type-safe operations
✅ Proper currency conversion logic
✅ Enhanced error handling
✅ Better separation of concerns
✅ Maintainable codebase 
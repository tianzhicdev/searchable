-- Test script to verify balance calculation includes balance payment deductions
-- Run this in psql to verify the balance calculation query

-- Create test user
INSERT INTO "user" (username, email, password) 
VALUES ('test_balance_user', 'test_balance@test.com', 'hashed_password')
ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
RETURNING id;

-- Let's say user ID is 999 for this example
-- Replace with actual ID from above query
\set test_user_id 999

-- Scenario: User starts with $0, gets $100 from deposit, spends $25 with balance payment

-- 1. Add a completed deposit ($100)
INSERT INTO deposit (user_id, amount, currency, address, status, metadata)
VALUES (:test_user_id, 100.00, 'USDT', '0xtest123', 'complete', '{}');

-- 2. Create an invoice and balance payment ($25)
-- First create seller
INSERT INTO "user" (username, email, password)
VALUES ('test_seller', 'test_seller@test.com', 'hashed_password')
ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
RETURNING id;

\set test_seller_id 998

-- Create searchable
INSERT INTO searchable (user_id, payloads)
VALUES (:test_seller_id, '{"public": {"title": "Test Item", "type": "direct", "defaultAmount": 25.00}}')
RETURNING searchable_id;

\set test_searchable_id 999

-- Create invoice for balance payment
INSERT INTO invoice (buyer_id, seller_id, searchable_id, amount, fee, currency, type, external_id, metadata)
VALUES (:test_user_id, :test_seller_id, :test_searchable_id, 25.00, 0, 'usd', 'balance', 'balance_test_123', '{}')
RETURNING id;

\set test_invoice_id 999

-- Create the balance payment (status = complete)
INSERT INTO payment (invoice_id, amount, fee, currency, type, external_id, status, metadata)
VALUES (:test_invoice_id, 25.00, 0, 'usd', 'balance', 'balance_test_123', 'complete', '{}');

-- Now test the balance calculation query
WITH balance_sources AS (
    -- Income from sales (seller earnings after fees)
    SELECT 
        'sale' as source_type,
        (i.amount - i.fee) as net_amount,
        i.currency
    FROM invoice i
    JOIN payment p ON i.id = p.invoice_id
    WHERE i.seller_id = :test_user_id
    AND p.status = 'complete'
    AND i.currency IN ('USD', 'USDT', 'usd', 'usdt')
    
    UNION ALL
    
    -- Rewards
    SELECT 
        'reward' as source_type,
        r.amount as net_amount,
        r.currency
    FROM rewards r
    WHERE r.user_id = :test_user_id
    AND r.currency IN ('USD', 'USDT', 'usd', 'usdt')
    
    UNION ALL
    
    -- Completed deposits
    SELECT 
        'deposit' as source_type,
        d.amount as net_amount,
        d.currency
    FROM deposit d
    WHERE d.user_id = :test_user_id
    AND d.status = 'complete'
    AND d.currency IN ('USDT', 'usdt')
    
    UNION ALL
    
    -- Withdrawals (negative amounts)
    SELECT 
        'withdrawal' as source_type,
        -w.amount as net_amount,
        w.currency
    FROM withdrawal w
    WHERE w.user_id = :test_user_id
    AND w.status IN ('complete', 'pending', 'delayed')
    AND w.currency IN ('USD', 'USDT', 'usd', 'usdt')
    
    UNION ALL
    
    -- Balance payments (negative amounts) - purchases made with balance
    SELECT 
        'balance_payment' as source_type,
        -i.amount as net_amount,
        i.currency
    FROM invoice i
    JOIN payment p ON i.id = p.invoice_id
    WHERE i.buyer_id = :test_user_id
    AND p.type = 'balance'
    AND p.status = 'complete'
    AND i.currency IN ('USD', 'USDT', 'usd', 'usdt')
)
SELECT 
    source_type,
    SUM(net_amount) as total_by_type
FROM balance_sources
GROUP BY source_type

UNION ALL

SELECT 
    'TOTAL BALANCE' as source_type,
    COALESCE(SUM(net_amount), 0) as total_by_type
FROM balance_sources;

-- Expected results:
-- deposit: 100.00
-- balance_payment: -25.00
-- TOTAL BALANCE: 75.00

-- Cleanup (optional)
-- DELETE FROM payment WHERE external_id = 'balance_test_123';
-- DELETE FROM invoice WHERE external_id = 'balance_test_123';
-- DELETE FROM deposit WHERE user_id = :test_user_id AND address = '0xtest123';
-- DELETE FROM searchable WHERE searchable_id = :test_searchable_id;
-- DELETE FROM "user" WHERE id IN (:test_user_id, :test_seller_id);
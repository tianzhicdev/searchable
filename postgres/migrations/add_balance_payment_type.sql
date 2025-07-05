-- Migration: Add 'balance' payment type
-- This allows users to pay directly from their account balance

-- Update the CHECK constraint on invoice table to allow 'balance' type
ALTER TABLE invoice DROP CONSTRAINT IF EXISTS invoice_type_check;
ALTER TABLE invoice ADD CONSTRAINT invoice_type_check CHECK (type IN ('stripe', 'balance'));

-- Update the CHECK constraint on payment table to allow 'balance' type
ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_type_check;
ALTER TABLE payment ADD CONSTRAINT payment_type_check CHECK (type IN ('stripe', 'balance'));

-- Add index for balance payments to improve query performance
CREATE INDEX IF NOT EXISTS idx_invoice_type_balance ON invoice(id) WHERE type = 'balance';
CREATE INDEX IF NOT EXISTS idx_payment_type_balance ON payment(invoice_id) WHERE type = 'balance';
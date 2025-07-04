-- Add tx_hash column to deposit table
ALTER TABLE deposit 
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Create unique index on tx_hash (excluding NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_tx_hash 
ON deposit(tx_hash) 
WHERE tx_hash IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN deposit.tx_hash IS 'Ethereum transaction hash for the USDT deposit';
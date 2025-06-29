# USDT Withdrawal Robust Implementation

## Summary of Changes

### 1. USDT Service `/send` Endpoint Enhancement (`tether_on_eth/index.js`)

#### Key Improvements:
- **Always returns tx hash**: Even on error, if transaction was signed
- **Detailed logging**: Every step is logged with request_id for traceability
- **Input validation**: Validates address format and amount before processing
- **Error categorization**: Classifies errors (invalid_address, insufficient_funds, etc.)
- **Request ID support**: Accepts request_id from caller (withdrawal_id)

#### Response Format:
```javascript
// Success
{
  "success": true,
  "txHash": "0x123...",
  "from": "0xabc...",
  "to": "0xdef...",
  "amount": "1000000",
  "blockNumber": "18500000",
  "gasUsed": "65000",
  "request_id": "withdrawal_123"
}

// Error (with tx hash)
{
  "success": false,
  "txHash": "0x123...",  // Available if transaction was signed
  "error": "Transaction timeout",
  "errorType": "timeout",
  "request_id": "withdrawal_123",
  "from": "0xabc...",
  "to": "0xdef...",
  "amount": "1000000"
}
```

### 2. New `/tx-status/:txHash` Endpoint

#### Features:
- Validates transaction hash format
- Returns transaction status: `pending`, `confirmed`, `not_found`
- Provides confirmation count
- Indicates if transaction succeeded or reverted

#### Response Format:
```javascript
{
  "txHash": "0x123...",
  "status": "confirmed",  // or "pending", "not_found"
  "confirmations": 15,
  "blockNumber": "18500000",
  "gasUsed": "65000",
  "success": true,  // false if transaction reverted
  "from": "0xabc...",
  "to": "0xdef...",
  "logs": 2  // Number of events emitted
}
```

### 3. Background Job Enhancements (`background.py`)

#### Withdrawal Processing:
- Sends withdrawal_id as request_id to USDT service
- Stores tx_hash in metadata even on error
- Updates external_id field with tx_hash
- Handles both success and error responses properly

#### New Delayed Withdrawal Checker:
- Runs every 60 seconds
- Fetches delayed withdrawals with tx_hash
- Queries blockchain status via `/tx-status` endpoint
- Updates withdrawal status based on blockchain state:
  - `confirmed + success` → `complete`
  - `confirmed + failed` → `failed` (transaction reverted)
  - `not_found` (after 1 hour) → `failed`
  - `pending` → remains `delayed` (check again later)

## Transaction Flow

```
1. User requests withdrawal
   └── Status: pending

2. Background job processes
   ├── Success → Status: complete (with tx_hash)
   └── Error → Status: delayed (with tx_hash if available)

3. Delayed withdrawal checker
   ├── Queries /tx-status/:txHash
   └── Updates status based on blockchain state
```

## Key Benefits

1. **No Lost Transactions**: Even if /send times out, we have tx_hash to track
2. **Automatic Recovery**: Delayed withdrawals are automatically checked and resolved
3. **User Balance Protection**: Delayed withdrawals remain deducted from balance
4. **Full Traceability**: Request IDs link withdrawals to blockchain transactions
5. **Proper Error Handling**: Different error types are handled appropriately

## Testing Recommendations

1. **Test timeout scenario**: 
   - Set very low timeout on /send call
   - Verify tx_hash is stored and withdrawal marked as delayed
   - Confirm delayed checker updates status correctly

2. **Test various errors**:
   - Invalid address
   - Insufficient USDT balance
   - Network issues

3. **Load test**:
   - Send 200 withdrawals
   - Monitor how many become delayed
   - Verify all eventually reach complete/failed status

## Monitoring

Key log messages to monitor:
- `[withdrawal_X] Starting USDT transfer`
- `[withdrawal_X] Transaction signed, hash: 0x...`
- `Marked withdrawal X as delayed due to: ...`
- `Checking status of delayed withdrawal X with tx_hash: 0x...`
- `Delayed withdrawal X confirmed as complete`

## Next Steps

1. Add rate limiting to prevent API overload
2. Implement exponential backoff for delayed checks
3. Add admin dashboard to view delayed withdrawals
4. Set up alerts for withdrawals stuck in delayed > 2 hours
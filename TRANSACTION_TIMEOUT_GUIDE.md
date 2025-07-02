# Transaction Timeout Guide

## Understanding TransactionBlockTimeoutError

The error you encountered:
```
TransactionBlockTimeoutError: Transaction started at 8672112 but was not mined within 50 blocks
```

This means the transaction was submitted to the blockchain but wasn't included in a block within the expected timeframe.

## Why This Happens

1. **Low Gas Price**: Transaction isn't attractive enough for miners
2. **Network Congestion**: High traffic means longer wait times
3. **Nonce Issues**: Previous pending transactions blocking this one
4. **Gas Limit Too Low**: Transaction runs out of gas during execution
5. **Test Network Issues**: Test networks can be less reliable

## Solutions Implemented

### 1. Better Gas Price Management
- Added 20% buffer above base gas price for faster mining
- Cache gas prices to reduce API calls
- Use appropriate gas limits for USDT transfers

### 2. Improved Timeout Handling
- Don't wait for full confirmation on submission
- Return success once transaction is accepted by network
- Allow checking status separately

### 3. Transaction Monitoring
- Created `monitor-tx.sh` script to track transaction status
- Background jobs check transaction status periodically

## How to Use the Improved System

### 1. Send USDT with Better Handling
```bash
./send.sh <address> <amount>
```

The script now handles three scenarios:
- **Complete**: Transaction mined successfully
- **Pending**: Transaction submitted, awaiting confirmation
- **Failed**: Transaction failed or reverted

### 2. Monitor Transaction Status
```bash
# Monitor a transaction every 5 seconds
./monitor-tx.sh <txHash> 5
```

### 3. Check Transaction Manually
```bash
curl http://localhost:3100/tx-status/<txHash> | jq .
```

## Best Practices

### 1. Gas Price Strategy
- Use dynamic gas pricing with buffer
- Monitor network congestion
- Consider EIP-1559 transactions for predictable fees

### 2. Timeout Configuration
```javascript
// Don't wait indefinitely
const TX_TIMEOUT = 30000; // 30 seconds
const MAX_BLOCKS = 50;    // ~12.5 minutes on Ethereum
```

### 3. Retry Logic
- Save transaction hash immediately
- Allow status checking later
- Implement idempotent operations

### 4. User Experience
- Show transaction as "pending" immediately
- Provide transaction hash for tracking
- Update status asynchronously

## Configuration Options

Edit environment variables to tune behavior:
```bash
# Gas price multiplier (1.2 = 20% above base)
GAS_PRICE_MULTIPLIER=1.2

# Transaction submission timeout (seconds)
TX_TIMEOUT_SECONDS=30

# Maximum blocks to wait for mining
MAX_BLOCKS_TO_WAIT=50
```

## Monitoring Commands

### Check Recent Transactions
```bash
# View USDT service logs
docker logs searchable-usdt-api-1 -f --tail 50

# Check for timeout errors
docker logs searchable-usdt-api-1 2>&1 | grep -i timeout
```

### Debug Nonce Issues
```bash
# Check current nonce
curl http://localhost:3100/debug/nonce
```

## Troubleshooting

### Transaction Stuck as Pending
1. Check gas price is competitive
2. Verify no previous stuck transactions
3. Consider canceling with higher gas price

### Frequent Timeouts
1. Increase gas price buffer
2. Check network status
3. Consider using different RPC endpoint

### Nonce Errors
1. Reset nonce counter
2. Check for pending transactions
3. Restart USDT service if needed

## Production Recommendations

1. **Use Multiple RPC Endpoints**: Fallback options for reliability
2. **Implement Queue System**: Process transactions sequentially
3. **Monitor Gas Prices**: Adjust dynamically based on network
4. **Set Alerts**: Notify on repeated failures
5. **Transaction Database**: Track all transactions locally
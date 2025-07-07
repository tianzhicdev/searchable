# USDT Sweep Documentation

## Overview

The USDT sweep functionality allows collecting all USDT tokens from deposit addresses and consolidating them into a single destination address. This is essential for managing the platform's USDT liquidity.

## How It Works

1. **Deposit Address Generation**: Each USDT deposit gets a unique address generated using HD wallet derivation from the deposit ID
2. **Balance Monitoring**: The sweep scripts check the balance of all deposit addresses
3. **Sweep Execution**: Funds are transferred from deposit addresses to the destination
4. **Database Updates**: Successful sweeps are recorded in the database

## Scripts Available

### 1. Basic Sweep Script: `sweep.sh`

Simple script that sweeps all USDT from deposit addresses.

```bash
# Usage
./sweep.sh <destination_address> [--dry-run]

# Examples
./sweep.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --dry-run  # Preview only
./sweep.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e           # Execute sweep
```

**Features:**
- Queries all USDT deposits from database
- Generates addresses and checks balances
- Sweeps funds above minimum threshold (1 USDT default)
- Provides summary of operations

### 2. Enhanced Sweep Script: `sweep-enhanced.sh`

Advanced script with additional features for production use.

```bash
# Usage
./sweep-enhanced.sh <destination_address> [options]

# Options
--dry-run         # Preview without executing
--batch-size N    # Process N addresses at a time (default: 10)
--no-db-update    # Don't update database after sweep
--min-balance N   # Minimum balance in wei to sweep (default: 1000000)

# Examples
./sweep-enhanced.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --dry-run
./sweep-enhanced.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --batch-size 5
```

**Additional Features:**
- Batch processing to handle large numbers of deposits
- Database updates with sweep information
- Detailed logging to file
- Skip already-swept deposits
- Rate limiting and retry logic

### 3. Test Script: `test-sweep.sh`

Verifies the sweep system is properly configured.

```bash
./test-sweep.sh
```

**Tests:**
- USDT service connectivity
- Address generation
- Balance checking
- Database access
- Sweep script functionality

## Database Schema

The sweep information is stored in the deposit table's metadata field:

```json
{
  "sweep": {
    "swept_at": "2024-01-15T10:30:00Z",
    "sweep_tx_hash": "0xabc123...",
    "swept_amount": "1000000",
    "destination": "0x742d35cc6634c0532925a3b844bc9e7595ed5e6e"
  }
}
```

## USDT Service Endpoints

### `/sweep` Endpoint

Enhanced to accept optional destination address:

```bash
POST /sweep
{
  "from_address": "0x123...",
  "deposit_id": 123,
  "amount": "1000000",
  "to": "0x456..."  // Optional, defaults to master wallet
}
```

## Security Considerations

1. **Private Key Security**: The master private key controls all deposit addresses. Keep it secure!
2. **Destination Validation**: Always double-check the destination address
3. **Dry Run First**: Always run with `--dry-run` first to preview operations
4. **Gas Costs**: Each sweep is a separate transaction. Monitor gas prices
5. **Rate Limiting**: The scripts include delays to avoid rate limiting

## Operational Procedures

### Daily Sweep Process

1. **Check pending deposits**:
   ```bash
   docker exec searchable-db-1 psql -U searchable -d searchable -c \
   "SELECT COUNT(*), SUM(amount) FROM deposit WHERE type='usdt' AND status='complete' AND metadata->>'sweep' IS NULL;"
   ```

2. **Run dry-run sweep**:
   ```bash
   ./sweep-enhanced.sh <treasury_address> --dry-run
   ```

3. **Review the output** and verify:
   - Number of addresses to sweep
   - Total USDT amount
   - Destination address is correct

4. **Execute sweep**:
   ```bash
   ./sweep-enhanced.sh <treasury_address> --batch-size 10
   ```

5. **Monitor progress** in the log file

### Emergency Procedures

If sweeps fail:

1. **Check USDT service**:
   ```bash
   curl http://localhost:3100/balance/<address>
   ```

2. **Check gas balance** of master wallet

3. **Review logs** for specific errors

4. **Retry failed sweeps** individually if needed

## Monitoring

### Check Sweep Status

```sql
-- Unswept deposits
SELECT COUNT(*), SUM(amount) 
FROM deposit 
WHERE type='usdt' 
AND status='complete' 
AND metadata->>'sweep' IS NULL;

-- Recently swept
SELECT id, amount, 
       metadata->'sweep'->>'swept_at' as swept_at,
       metadata->'sweep'->>'sweep_tx_hash' as tx_hash
FROM deposit 
WHERE type='usdt' 
AND metadata->'sweep' IS NOT NULL
ORDER BY (metadata->'sweep'->>'swept_at')::timestamp DESC
LIMIT 10;
```

### Metrics to Monitor

1. **Unswept Balance**: Total USDT sitting in deposit addresses
2. **Sweep Success Rate**: Percentage of successful sweeps
3. **Gas Costs**: ETH spent on sweep transactions
4. **Processing Time**: How long sweeps take to complete

## Troubleshooting

### Common Issues

1. **"Invalid from address"**
   - The deposit address doesn't match the HD wallet derivation
   - Check deposit ID is correct

2. **"Insufficient funds for gas"**
   - The deposit address needs ETH for gas
   - Consider implementing gas station pattern

3. **"Transaction underpriced"**
   - Gas price too low
   - The service includes 20% buffer, but may need adjustment

4. **Rate limiting errors**
   - Too many requests to Infura/node
   - Reduce batch size or increase delays

### Debug Commands

```bash
# Check specific deposit address
DEPOSIT_ID=123
curl -X POST http://localhost:3100/receive -H "Content-Type: application/json" -d "{\"deposit_id\": $DEPOSIT_ID}"

# Check balance
ADDRESS="0x..."
curl http://localhost:3100/balance/$ADDRESS

# Check transaction status
TX_HASH="0x..."
curl http://localhost:3100/tx-status/$TX_HASH
```

## Best Practices

1. **Regular Sweeps**: Run sweeps daily or when unswept balance exceeds threshold
2. **Batch Wisely**: Use appropriate batch sizes (5-20) based on network conditions
3. **Monitor Gas**: Check ETH gas prices before large sweep operations
4. **Audit Trail**: Keep logs of all sweep operations
5. **Test First**: Always test on testnet or with small amounts first

## Future Improvements

1. **Automated Sweeps**: Cron job or background service for automatic sweeping
2. **Gas Optimization**: Implement multicall contract for batch sweeps
3. **Notifications**: Alert when unswept balance exceeds threshold
4. **Dashboard**: Web interface for sweep management
5. **Multi-sig**: Require multiple signatures for large sweeps
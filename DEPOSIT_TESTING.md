# USDT Deposit Testing Guide

This guide explains how to test the USDT deposit functionality, including the full deposit completion cycle with real USDT transfers.

## Overview

The deposit system uses HD (Hierarchical Deterministic) wallet technology to generate unique deposit addresses from a master private key. Each deposit ID maps to a specific address that can be regenerated deterministically.

## Running Deposit Tests

### Basic Test Run (Without Real USDT)

```bash
cd integration-tests
SKIP_REAL_DEPOSIT=true python3 test_deposits.py
```

This will test:
- USDT service integration with HD wallet
- Deposit creation and address generation
- HD wallet consistency (same ID = same address)
- Deposit listing
- Balance integration (pending state)
- Deposit expiration logic
- Sweep functionality structure

### Full Test with Real USDT Transfers

To test the complete deposit cycle with actual USDT:

```bash
cd integration-tests
python3 test_deposits.py
```

This will:
1. Create deposit addresses
2. Send real USDT to those addresses via the USDT service API
3. Wait for blockchain confirmation
4. Verify deposits are marked complete
5. Check that user balance increases

**Requirements:**
- The USDT service must have funds in its wallet
- The service must be connected to the correct network
- Background job must be running to detect deposits

### Manual USDT Transfer

If automatic sending fails, you can manually send USDT:

```bash
# The test will show the deposit address
./send.sh <deposit_address> <amount>

# Example:
./send.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e 10.00
```

### Using send.sh Script

The `send.sh` script is used to send USDT from the service wallet:

```bash
# Usage
./send.sh <recipient_address> <amount>

# Check transaction status
curl http://localhost:3100/tx-status/<tx_hash> | jq .

# Check address balance
curl http://localhost:3100/balance/<address> | jq .
```

## Understanding Test Output

### Successful Pending State Test
```
=== Testing Deposit Balance Integration ===
Initial balance: $0
✓ Created deposit 52 for 100 USDT
✓ Balance correctly unchanged for pending deposit
⚠️  Deposit did not complete within timeout
  Note: In production, this would complete when USDT is actually sent
✓ Deposit balance integration test passed (pending state verified)
```

This is normal behavior when no actual USDT is sent.

### Successful Complete Cycle Test
```
=== Testing Deposit Balance Integration ===
Initial balance: $0
✓ Created deposit 53 for 100 USDT
✓ Balance correctly unchanged for pending deposit
✓ Deposit completed after 12s
✓ Balance correctly increased by $100
  Initial: $0
  Final: $100
  Increase: $100
✓ Deposit balance integration test passed (complete cycle)
```

This shows a full successful deposit cycle.

## HD Wallet Implementation

The system uses:
- Master private key from `PRIVATE_KEY` environment variable
- BIP44 derivation path: `m/44'/60'/0'/0/{deposit_id}`
- Each deposit ID generates a unique, deterministic address
- No private keys are stored in the database

## Security Considerations

1. **Master Private Key**: Critical - controls all deposit addresses
2. **No Key Storage**: Individual deposit private keys are never stored
3. **Deterministic**: Addresses can be regenerated from master key + ID
4. **Sweep Operations**: Private keys derived on-demand for sweeping

## Troubleshooting

### "Deposit did not complete within timeout"
- This is expected if no real USDT was sent
- Check that background job is running: `docker logs searchable-background-1`
- Verify USDT service is accessible: `curl http://localhost:3100`

### "Address does not match deposit ID"
- Ensure USDT service is using the same master private key
- Check that deposit ID is being passed correctly
- Verify HD wallet implementation is consistent

### "Failed to generate deposit address"
- Check USDT service is running: `docker ps | grep usdt`
- Verify Flask API can reach USDT service
- Check logs: `docker logs searchable-usdt-api-1`

## Environment Variables

For testing, you may need:
- `BASE_URL`: API server URL (default: http://localhost:5005)
- `USDT_SERVICE_URL`: USDT service URL (default: http://localhost:3100)
- `ENABLE_DEPOSIT_SIMULATION`: Enable test deposit completion (default: false)
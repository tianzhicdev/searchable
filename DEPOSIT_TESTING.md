# USDT Deposit Testing Guide

This guide explains how to test the USDT deposit functionality using the provided scripts.

## Prerequisites

- Docker services running: `./exec.sh local deploy-all`
- USDT service running on port 3100
- API server running on port 5005

## Testing Scripts

### 1. `send.sh` - Send USDT to an Address

Sends USDT to a specified Ethereum address for testing deposits.

```bash
# Usage
./send.sh <address> <amount>

# Example
./send.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e 50.00
```

### 2. `check-balance.sh` - Check USDT Balance

Checks the USDT balance of any Ethereum address.

```bash
# Usage
./check-balance.sh <address>

# Example
./check-balance.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e
```

### 3. `test-deposit-flow.sh` - Full Deposit Flow Test

Runs through the complete deposit flow:
1. Creates a test user
2. Logs in
3. Creates a deposit request
4. Shows deposit address
5. Lists user deposits

```bash
# Usage
./test-deposit-flow.sh

# The script will output a deposit address and instructions
```

## Manual Testing Flow

1. **Start services** (if not already running):
   ```bash
   ./exec.sh local deploy-all
   ```

2. **Run the deposit flow test**:
   ```bash
   ./test-deposit-flow.sh
   ```

3. **Send USDT to the deposit address** (using the address from step 2):
   ```bash
   ./send.sh <deposit_address> 25.00
   ```

4. **Wait for background job** to process (runs every 5 minutes) or manually trigger:
   ```bash
   docker exec searchable-background-1 python -c "from background import check_pending_deposits; check_pending_deposits()"
   ```

5. **Check updated balance**:
   ```bash
   curl -H "Authorization: <token>" http://localhost:5005/api/balance | jq .
   ```

## Environment Variables

- `API_URL`: API server URL (default: http://localhost:5005)
- `USDT_SERVICE_URL`: USDT service URL (default: http://localhost:3100)

Example:
```bash
API_URL=http://api.example.com ./test-deposit-flow.sh
```

## Monitoring

### Check Background Job Logs
```bash
docker logs searchable-background-1 -f | grep deposit
```

### Check Deposit Status
```bash
curl -H "Authorization: <token>" http://localhost:5005/api/v1/deposit/status/<deposit_id> | jq .
```

### List All Deposits
```bash
curl -H "Authorization: <token>" http://localhost:5005/api/v1/deposits | jq .
```

## Troubleshooting

1. **"Failed to connect to USDT service"**
   - Ensure USDT service is running: `docker ps | grep usdt`
   - Check logs: `docker logs searchable-usdt-api-1`

2. **"Token is invalid"**
   - Run `test-deposit-flow.sh` to get a fresh token
   - Use the token in subsequent API calls

3. **Deposit not updating after sending USDT**
   - Check background job is running: `docker ps | grep background`
   - Wait 5 minutes for automatic processing
   - Check logs: `docker logs searchable-background-1`

## Notes

- Minimum deposit amount: $10 USDT
- Deposits expire after 23 hours
- Background job checks pending deposits every 5 minutes
- Test USDT service generates one-time addresses for each deposit
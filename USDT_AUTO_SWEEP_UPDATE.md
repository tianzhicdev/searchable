# USDT Auto-Sweep Update

## Overview

The USDT sweep functionality has been enhanced with automatic gas funding capability. The sweep script now automatically funds deposit addresses that need ETH for gas fees before attempting to sweep USDT.

## What Changed

### 1. New USDT Service Endpoints

Added three new endpoints to the USDT service (`tether_on_eth/index.js`):

#### `/eth-balance/:address`
- **Purpose**: Check ETH balance of any address
- **Method**: GET
- **Response**: 
  ```json
  {
    "address": "0x...",
    "balance": "1000000000000000000",  // wei
    "balanceEth": "1.0"                 // ETH
  }
  ```

#### `/fund-gas`
- **Purpose**: Send ETH from master wallet to fund gas fees
- **Method**: POST
- **Body**:
  ```json
  {
    "to": "0x...",
    "amount": "2000000000000000"  // wei
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "txHash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "amount": "2000000000000000",
    "gasUsed": "21000"
  }
  ```

#### `/master-wallet`
- **Purpose**: Get master wallet status (ETH and USDT balances)
- **Method**: GET
- **Response**:
  ```json
  {
    "address": "0x...",
    "ethBalance": "1000000000000000000",
    "ethBalanceEth": "1.0",
    "usdtBalance": "1000000",
    "usdtBalanceUsdt": "1.000000"
  }
  ```

### 2. Enhanced Sweep Script

The `sweep.sh` script now includes auto-funding logic:

1. **Checks master wallet** status before starting
2. **For each deposit address**:
   - Checks USDT balance
   - Checks ETH balance
   - If ETH < 0.002 ETH (configurable), funds the address
   - Waits for funding transaction to process
   - Proceeds with USDT sweep
3. **Provides detailed summary** including funding operations

### 3. Configuration Options

- `GAS_FUNDING_AMOUNT`: Amount of ETH to fund (default: 0.002 ETH)
- `MIN_BALANCE_WEI`: Minimum USDT to sweep (default: 1 USDT)

## Usage

### Basic Usage (with auto-funding)
```bash
./sweep.sh 0xYourDestinationAddress
```

### Dry Run Mode
```bash
./sweep.sh 0xYourDestinationAddress --dry-run
```

### Custom Gas Funding Amount
```bash
GAS_FUNDING_AMOUNT=3000000000000000 ./sweep.sh 0xYourDestinationAddress
```

## Process Flow

1. **Master Wallet Check**
   - Verifies master wallet has sufficient ETH for funding operations
   - Shows current ETH and USDT balances

2. **Deposit Analysis**
   - Queries unswept USDT deposits from database
   - Generates addresses for each deposit
   - Checks both USDT and ETH balances

3. **Auto Gas Funding**
   - Identifies addresses with USDT but insufficient ETH
   - Sends ETH from master wallet to these addresses
   - Waits for funding transactions to complete

4. **USDT Sweep**
   - Sweeps USDT from all funded addresses
   - Updates database with sweep information
   - Provides transaction hashes for tracking

## Example Output

```
🧹 USDT Sweep Tool with Auto Gas Funding
Destination: 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e
Gas funding amount: 0.002000 ETH

Checking master wallet status...
Master wallet: 0x123...
ETH balance: 5.123456 ETH
USDT balance: 10000.000000 USDT

Step 1: Fetching USDT deposits from database...
Found 4 unswept USDT deposits

Step 2: Checking balances and gas requirements...
Deposit #1
  Address: 0xfC55FF834870aeF6c6187312be103F3370B30270
  USDT: 225.500000 USDT
  ETH: 0.000000 ETH
  Needs gas funding
  Funding 0xfC55... with 0.002000 ETH for gas
  ✅ Gas funding successful! TxHash: 0xabc...
  
Step 4: Executing sweeps...
Sweeping Deposit #1
  Sweeping 225500000 wei from 0xfC55...
  ✅ Sweep successful! TxHash: 0xdef...

===== Sweep Complete! =====
Gas funding operations: 4
Successful sweeps: 4
Failed sweeps: 0
Total USDT swept: 345.500000 USDT
```

## Security Considerations

1. **Private Key Security**: The master wallet private key is never exposed to the sweep script
2. **All ETH operations** go through the USDT service API
3. **Validation**: All addresses and amounts are validated before transactions
4. **Rate Limiting**: Built-in delays prevent overwhelming the network

## Testing

Run the test script to verify functionality:
```bash
./test-auto-sweep.sh
```

## Requirements

- Master wallet must have sufficient ETH for:
  - Gas funding operations (0.002 ETH per address)
  - Transaction fees for funding operations
- USDT service must be running and accessible
- Database must be accessible for deposit queries
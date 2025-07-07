# USDT Sweep Functionality Proposal

## Overview
Implement a `./sweep.sh <ethereum_addr>` script that collects all USDT from deposit addresses and sends them to a specified Ethereum address.

## Current System Analysis

### How USDT Deposits Work
1. When a user creates a deposit, the system generates a deterministic address using `hdWallet.generateAddress(deposit_id)`
2. The deposit ID from the database is used as the HD wallet index
3. Users send USDT to this generated address
4. The system monitors these addresses for incoming USDT

### Existing Infrastructure
- **HD Wallet**: Uses BIP44 standard path `m/44'/60'/0'/0/{deposit_id}`
- **Master Private Key**: Stored in environment variable, controls all deposit addresses
- **Sweep Endpoint**: `/sweep` endpoint exists but requires individual address/amount
- **Database**: Deposit table has `id`, `user_id`, `amount`, `status`, `tx_hash`, etc.

## Proposed Implementation

### 1. sweep.sh Script

```bash
#!/bin/bash
# Usage: ./sweep.sh <destination_ethereum_address>
```

The script will:
1. Query database for all USDT deposits (type='usdt')
2. For each deposit, generate the address using the deposit ID
3. Check USDT balance on each address
4. Collect addresses with non-zero balances
5. Call sweep endpoint for each address with balance

### 2. Enhanced /sweep Endpoint

Modify the existing `/sweep` endpoint to handle batch operations more efficiently:
- Add batch sweep capability
- Include gas optimization for multiple transfers
- Add dry-run mode to preview operations

### 3. Database Updates

Add fields to track sweep operations:
- `swept_at` - timestamp when funds were swept
- `sweep_tx_hash` - transaction hash of the sweep

## Implementation Plan

### Phase 1: Basic Sweep Script
```bash
# Basic flow:
1. Get all USDT deposits from database
2. For each deposit:
   - Generate address from deposit.id
   - Check balance
   - If balance > 0, add to sweep list
3. Execute sweeps sequentially
```

### Phase 2: Optimizations
- Batch balance checking
- Parallel sweep execution (with nonce management)
- Gas price optimization
- Progress tracking and resumability

### Phase 3: Safety Features
- Dry run mode
- Minimum balance threshold
- Gas cost estimation
- Confirmation prompts
- Detailed logging

## Critiques and Considerations

### Pros
1. **Doable**: Yes, this is definitely implementable with the existing infrastructure
2. **Secure**: HD wallet ensures only the master key holder can sweep
3. **Traceable**: All operations can be logged and tracked in database
4. **Deterministic**: Addresses can always be regenerated from deposit IDs

### Cons and Challenges
1. **Gas Costs**: Each sweep is a separate transaction, gas costs can add up
2. **Nonce Management**: Need careful handling when doing multiple sweeps
3. **Rate Limiting**: Infura/node rate limits need to be considered
4. **Failed Transactions**: Need proper error handling and retry logic

### Security Considerations
1. **Private Key Security**: The master private key must be kept secure
2. **Destination Validation**: Must validate the destination address
3. **Amount Verification**: Double-check balances before sweeping
4. **Audit Trail**: Log all sweep operations

## Alternative Approaches

### 1. Batch Contract
Deploy a smart contract that can sweep multiple addresses in one transaction. This would save gas but requires contract deployment.

### 2. Account Abstraction
Use account abstraction to allow the master wallet to control all deposit addresses without individual private keys.

### 3. Direct Deposits
Instead of generating individual addresses, use a single address with memo/reference system (though this reduces privacy).

## Recommended Approach

Implement a simple, robust sweep script that:
1. Queries deposits where `type='usdt'` and `status='complete'`
2. Generates addresses and checks balances
3. Sweeps funds with proper error handling
4. Updates database with sweep information
5. Provides detailed logging and optional dry-run mode

This approach is straightforward, uses existing infrastructure, and provides good visibility into operations.

## Next Steps
1. Implement basic sweep.sh script
2. Test with testnet USDT first
3. Add safety features and optimizations
4. Deploy to production with proper monitoring
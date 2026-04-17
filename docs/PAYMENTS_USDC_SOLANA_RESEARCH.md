# Solana USDC and Ethereum USDT Support Research

Last updated: 2026-04-12

## Decision Update

Implementation direction selected on 2026-04-12:

- keep `tether_on_eth/` for Ethereum USDT
- add a sibling `usdc_on_solana/` service for Solana USDC
- keep the application balance ledger in `usd` for now
- integrate the new Solana service into deposit and withdrawal flows next

This supersedes the earlier provider-first recommendation in this document. Provider-backed Solana USDC remains an option, but the repo is now moving toward a self-managed Solana service similar to the existing Ethereum service.

## Scope

This document captures the research for adding:

- USDT on Ethereum, using the existing rail
- USDC on Solana, as a new rail
- Refill and withdraw support for both

It is written against the current `searchable` codebase and the official Solana and Circle documentation.

## Current State In This Repo

The current implementation is not multi-chain. It is one balance ledger plus one crypto settlement rail.

- Deposits are created in `api-server-flask/api/routes/deposits.py`.
- Withdrawals are created in `api-server-flask/api/routes/withdrawals.py`.
- On-chain processing runs in `api-server-flask/background.py`.
- User balance is calculated in `api-server-flask/api/common/data_helpers.py`.
- The Ethereum transfer service lives in `tether_on_eth/`.

### Key constraints

1. Deposits are hard-wired to `usdt` or `stripe`.
2. Withdrawals are hard-wired to `/api/v1/withdrawal-usd`, but the background worker interprets that as Ethereum USDT.
3. User balance is a single `usd` ledger, not a per-asset ledger.
4. The existing `usdt-api` service is Ethereum-specific and derives deterministic Ethereum addresses.

### Relevant file references

- `api-server-flask/api/routes/deposits.py`
- `api-server-flask/api/routes/withdrawals.py`
- `api-server-flask/background.py`
- `api-server-flask/api/common/data_helpers.py`
- `api-server-flask/api/common/models.py`
- `postgres/init.sql`
- `frontend/src/views/payments/RefillUSDT.js`
- `frontend/src/views/profile/WithdrawalUSDT.js`
- `tether_on_eth/index.js`
- `tether_on_eth/hdWallet.js`

## What Solana USDC Adds Technically

Adding Solana USDC is not just a new button. It adds a second settlement rail with different address, token-account, and confirmation rules.

### Solana-specific requirements

- Native mainnet USDC on Solana has a canonical mint and 6 decimals.
- Token balances live in token accounts, commonly Associated Token Accounts (ATAs), not only in wallet addresses.
- Recipient validation must confirm the target is a valid wallet or token account for the expected mint and token program.
- If the recipient ATA does not exist, the sender may need to create it and pay rent.
- Confirmation logic differs from Ethereum. For crediting deposits, `confirmed` or stronger is safer than `processed`. For higher-value withdrawals, `finalized` is safer.
- Production use requires a real RPC and monitoring strategy. Public Solana RPC endpoints do not provide production SLA.

## What This Means For Searchable

The current `usd` balance model can stay for v1, but deposit and withdrawal records need to become rail-aware.

### Minimum backend changes

1. Generalize deposit types from `usdt|stripe` to explicit rails, for example:
   - `eth_usdt`
   - `sol_usdc`
   - `stripe`
2. Generalize withdrawals so the client submits a rail and destination, instead of using a single implicit `/withdrawal-usd` flow.
3. Add explicit metadata for:
   - `asset`
   - `network`
   - `provider`
   - `recipient_type`
   - `deposit_address` or `recipient_address`
   - `token_account`
   - `tx_hash` or Solana signature
   - confirmation status and timestamps
4. Split background processing per rail, or move to provider webhooks where supported.

### Minimum schema changes

The current schema is too restrictive for multi-rail support.

- `withdrawal.currency` is constrained to `usd`
- `withdrawal.type` is constrained to `bank_transfer`
- `invoice.currency` and `payment.currency` are constrained to `usd`
- `deposit.currency` and `deposit.type` are inconsistent with how the rest of the ledger works

For v1, keep the user balance in `usd`, but make `deposit` and `withdrawal` records explicitly track the settlement rail. That avoids a full accounting rewrite while still preserving operational correctness.

## Architecture Options

### Option A: Build a new `solana-usdc-api` service

This mirrors the existing `tether_on_eth` service and matches the implementation direction now chosen for this repo.

- Keep the current `usdt-api` service for Ethereum USDT.
- Add a sibling Solana service with endpoints for:
  - health and wallet inspection
  - deterministic deposit address generation
  - USDC balance lookup
  - transaction lookup and status checks
  - withdrawals from the master wallet
  - sweeping funds from deposit wallets
  - SOL funding for rent and transaction fees when needed

This keeps the rail architecture consistent between Ethereum and Solana.

### Option B: Keep self-custody Ethereum USDT, add Solana USDC through a provider

This remains a valid alternative if operational burden becomes too high.

- Keep the current `usdt-api` service for Ethereum USDT.
- Add Solana USDC through a provider API that supports:
  - deposit addresses or pay-ins
  - payouts
  - webhook or status callbacks

This reduces custom Solana infrastructure, but creates an asymmetric architecture across rails.

### Required capabilities for a self-managed Solana service

- derive or allocate deposit addresses or token accounts
- monitor transfers on Solana
- validate mint and token program
- sweep or recognize funds correctly
- send withdrawals
- create ATAs when needed
- manage SOL fee balances

This gives more control, but it is materially more work and increases ops risk than a provider integration.

## Recommended Path

Use a self-managed dual-service design first:

1. Keep Ethereum USDT on the existing `usdt-api`
2. Add Solana USDC through a sibling `usdc_on_solana` service
3. Keep user balances in `usd`
4. Make deposits and withdrawals rail-aware in the database and API

That keeps the operational model consistent with the current codebase and avoids introducing a second custody pattern before the balance system is generalized.

## Frontend Changes

The current screens are Ethereum-USDT-specific.

Replace:

- `frontend/src/views/payments/RefillUSDT.js`
- `frontend/src/views/profile/WithdrawalUSDT.js`

With rail-aware flows:

- choose rail: `Ethereum USDT` or `Solana USDC`
- show the correct destination format and instructions
- validate destination addresses based on rail
- show chain-specific warnings and confirmation messaging

## Operational Changes

For both rails:

- deduplicate credits by transaction hash or signature
- store enough metadata to reconcile every on-chain event
- alert on low hot-wallet gas or fee balance
- alert on stuck withdrawals and duplicate deposits

For Solana specifically:

- hard-allow the USDC mint
- hard-allow the expected token program
- decide whether v1 auto-creates recipient ATAs or rejects missing ones
- remember that the wallet keypair is cluster-agnostic, but test USDC distribution is commonly documented for Solana Devnet rather than Solana Testnet

## Estimated Scope

Approximate implementation effort:

- Provider-backed Solana USDC rail: 1-2 engineering weeks after provider onboarding
- Self-custody Solana USDC rail: 2-4+ engineering weeks, depending on operational hardening

These estimates are engineering judgment, not vendor guarantees.

## Sources

Official Solana docs:

- https://solana.com/docs/payments/how-payments-work
- https://solana.com/docs/payments/send-payments/verify-address
- https://solana.com/docs/payments/production-readiness
- https://solana.com/docs/payments/accept-payments/verification-tools
- https://solana.com/docs/payments/accept-payments/indexing
- https://solana.com/docs/rpc/http/getsignaturestatuses
- https://solana.com/docs/rpc/http/getsignaturesforaddress

Official Circle docs:

- https://developers.circle.com/circle-mint/supported-chains-and-currencies
- https://developers.circle.com/circle-mint/receive-stablecoin-payin
- https://developers.circle.com/circle-mint/send-stablecoin-payout
- https://developers.circle.com/stablecoins/quickstart-transfer-10-usdc-on-solana

# USDC on Solana — Implementation and Verification

Last updated: 2026-04-13

## What Was Implemented

The frontend and backend now support USDC deposits and withdrawals on Solana Devnet as the primary crypto payment rail. The old Ethereum USDT references have been cleaned up across all user-facing surfaces.

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  React UI   │────▶│  Flask API       │────▶│  usdc-solana-api     │
│  /refill-usdc│     │  deposits.py     │     │  (port 3200)         │
│  /withdrawal │     │  withdrawals.py  │     │  Solana Devnet RPC   │
│    -usdc     │     │  background.py   │     └──────────────────────┘
└─────────────┘     └──────────────────┘
```

- **Frontend**: Single config source at `frontend/src/utils/cryptoPaymentConfig.js` drives all UI labels, routes, and address validation.
- **Backend API**: `deposits.py` and `withdrawals.py` accept `usdc_solana` as a deposit/withdrawal type alongside `stripe` and legacy `usdt`.
- **Background worker**: `background.py` polls the `usdc-solana-api` service for deposit confirmations and processes withdrawals.
- **Solana service**: `usdc_on_solana/` — self-managed service that handles address generation, balance checks, transfers, and sweeps on Solana.

### Database

The `deposit` and `withdrawal` tables accept `usdc_solana` as a type value. User balance remains a single `usd` ledger — deposits credit USD, withdrawals debit USD, regardless of the settlement rail.

### Routes

| Route | Purpose | Legacy alias |
|-------|---------|-------------|
| `/refill-usdc` | Deposit USDC to fund balance | `/refill-usdt` |
| `/withdrawal-usdc` | Withdraw balance as USDC | `/withdrawal-usdt` |

Legacy aliases resolve to the same components for backward compatibility.

### Key Config (`cryptoPaymentConfig.js`)

| Constant | Value |
|----------|-------|
| `CRYPTO_PAYMENT_RAIL` | `usdc_solana` |
| `CRYPTO_PAYMENT_ASSET` | `USDC` |
| `CRYPTO_PAYMENT_NETWORK` | `Solana Devnet` |
| `CRYPTO_PAYMENT_NETWORK_SHORT` | `Solana` |

All UI components import from this file. To switch networks (e.g., devnet → mainnet), update this file and the backend environment variables.

### Files Changed

**Frontend (config and routing):**
- `frontend/src/utils/cryptoPaymentConfig.js` — central config
- `frontend/src/routes/SearchableRoutes.js` — route definitions

**Frontend (payment flows):**
- `frontend/src/views/payments/RefillUSDT.js` — deposit page
- `frontend/src/views/profile/WithdrawalUSDT.js` — withdrawal page
- `frontend/src/components/Deposit/DepositComponent.js` — deposit dialog
- `frontend/src/components/WithdrawalDialog.js` — withdrawal dialog
- `frontend/src/components/Payment/PayButton.js` — payment menu
- `frontend/src/components/Payment/RefillBalanceDialog.js` — refill prompt
- `frontend/src/components/FloatingMenu/FloatingBottomBar.js` — bottom nav
- `frontend/src/components/FloatingMenu/FloatingMenu.js` — floating menu

**Frontend (copy and labels):**
- `frontend/src/views/profile/Profile.js` — profile page withdrawal dialog
- `frontend/src/views/profile/Dashboard.js` — balance display
- `frontend/src/views/landing/LandingV2.js` — landing page copy
- `frontend/src/views/landing/Landing.js` — old landing page copy
- `frontend/src/views/static/FAQ.js` — FAQ copy
- `frontend/src/views/Invite.js` — invite page copy
- `frontend/src/components/common/PriceDisplay.js` — currency labels
- `frontend/src/views/onboarding/Onboarding4.js` — onboarding

**Frontend (mocks and tests):**
- `frontend/src/mocks/mockData.js` — mock withdrawal/deposit data
- `frontend/src/mocks/mockBackend.js` — mock API responses
- `frontend/src/utils/testIds.js` — test ID constants
- `frontend/src/views/profile/Dashboard.working.test.js` — test assertions

**Backend:**
- `api-server-flask/api/__init__.py` — schema constraints
- `api-server-flask/api/routes/deposits.py` — deposit endpoint
- `api-server-flask/api/routes/withdrawals.py` — withdrawal endpoint
- `api-server-flask/background.py` — background processing
- `api-server-flask/api/common/health_checker.py` — health checks
- `postgres/init.sql` — database schema

**Infrastructure:**
- `docker-compose.yml` — usdc-solana-api service
- `docker-compose.local.yml` — local dev config
- `usdc_on_solana/` — Solana USDC service (new)

---

## How to Verify USDC on Solana Devnet

### Prerequisites

You need:
- A Solana wallet (CLI or Phantom browser extension)
- Devnet SOL for transaction fees
- Devnet USDC tokens

### Step 1: Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

Add to your shell profile if prompted:

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Step 2: Create a Devnet Wallet

```bash
# Generate a new keypair
solana-keygen new --outfile ~/.config/solana/devnet.json

# Point CLI at devnet
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/devnet.json

# Print your wallet address
solana address
```

**Alternative: Phantom wallet** — install the browser extension, go to Settings > Developer Settings, enable Devnet.

### Step 3: Get Devnet SOL

SOL is needed to pay Solana transaction fees (~0.000005 SOL per transfer).

```bash
solana airdrop 2
```

Or use the web faucet: https://faucet.solana.com

### Step 4: Get Devnet USDC

**Option A — Circle faucet (easiest):**

1. Go to https://faucet.circle.com
2. Select **Solana** and **Devnet**
3. Paste your wallet address
4. Receive 10 USDC

**Option B — CLI with SPL Token:**

```bash
# The devnet USDC mint address:
# 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Create your USDC token account
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# If you have mint authority, mint tokens:
spl-token mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 100
```

### Step 5: Verify a Deposit

1. Start the app locally (frontend + backend + usdc-solana-api)
2. Navigate to `http://localhost:3002/refill-usdc`
3. Enter a deposit amount and submit
4. The app returns a **wallet address** and **token account** — copy the token account
5. Send USDC to the token account:

```bash
spl-token transfer \
  4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
  <AMOUNT> \
  <TOKEN_ACCOUNT_FROM_APP> \
  --fund-recipient
```

6. The background worker polls for incoming transfers and credits your balance

### Step 6: Verify a Withdrawal

1. Navigate to `http://localhost:3002/withdrawal-usdc`
2. Enter your Solana wallet address and an amount
3. Submit — the backend sends USDC from the service wallet to your address
4. Confirm receipt:

```bash
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### Step 7: Verify on Solana Explorer

Open https://explorer.solana.com/?cluster=devnet and:

- Search by **wallet address** to see all transactions for that account
- Search by **transaction signature** to see a specific transfer
- Check token balances under the "Tokens" tab of any account

### Quick Reference Commands

```bash
# Check SOL balance (for fees)
solana balance

# Check USDC token balance
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# List all your token accounts
spl-token accounts

# View transaction details
solana confirm <SIGNATURE> -v

# Solana Explorer links
# Account:     https://explorer.solana.com/address/<ADDRESS>?cluster=devnet
# Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### Verified Test Results (2026-04-12)

| Test | Result |
|------|--------|
| `npm run build` | Passes (no compile errors) |
| `/refill-usdc` deposit | HTTP 200, deposit created on Devnet |
| Service wallet | `4nMpgUxqA6qVTvaktxj7pBJkzUnJQArxGxnxvY2vS6E3` |
| Service token account | `DUFYCJ2h8ej1PoEmV8Ds3BNr1GxziduzwhZoddHYkqMG` |
| `/withdrawal-usdc` withdrawal | HTTP 200, withdrawal #4, amount 0.05, fee 0.0005 |
| Withdrawal signature | `3as7Ly9G5boooZeAULfkZtw8BofBUaWVam3HqqxCeYNjZfKME9r1DgzDfRN5EJnzZry5ZSycEbAcD1TBmJ9cziNh` |
| Legacy route `/refill-usdt` | Redirects to USDC refill UI |
| Legacy route `/withdrawal-usdt` | Redirects to USDC withdrawal UI |
| Post-test balance | $0.60 |

---

## Moving to Mainnet

When ready to move from Devnet to Mainnet:

1. **`cryptoPaymentConfig.js`**: Change `CRYPTO_PAYMENT_NETWORK` from `Solana Devnet` to `Solana`
2. **Backend env vars**: Set `SOLANA_NETWORK=mainnet-beta`, update `SOLANA_USDC_MINT` to the mainnet USDC mint (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
3. **RPC endpoint**: Switch from devnet RPC to a production RPC provider (Helius, QuickNode, Triton, etc.)
4. **Fund the service wallet**: Send mainnet SOL (for fees) and mainnet USDC to the service wallet
5. **Remove devnet test data** from the database

## What's Left

- Remaining file renames: `RefillUSDT.js` → `RefillUSDC.js`, `WithdrawalUSDT.js` → `WithdrawalUSDC.js` (cosmetic, internal only)
- Static asset: `coinEthereum` icon export in `frontend/src/assets/images/icons/commerce/index.js` (unused in USDC flows)
- Backend health checker still references Ethereum wallet monitoring — update when Ethereum USDT is fully retired
- Profile.js has a simplified withdrawal dialog — consider routing to `/withdrawal-usdc` instead of duplicating the form

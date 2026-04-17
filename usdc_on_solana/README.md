# Solana USDC Service

REST service for Solana USDC operations, modeled after `tether_on_eth/`.

Core endpoints:

- `GET /health`
- `GET /balance/:address`
- `GET /sol-balance/:address`
- `POST /receive`
- `POST /zero-balance-address`
- `POST /send`
- `GET /tx-status/:signature`
- `POST /sweep`
- `GET /transactions/:address`
- `GET /master-wallet`
- `POST /fund-rent`

Expected environment variables:

- `SOLANA_RPC_URL`
- `SOLANA_NETWORK`
- `SOLANA_USDC_MINT`
- `SOLANA_USDC_DECIMALS`
- `SOLANA_PRIVATE_KEYPAIR`
- `SOLANA_PORT`

Notes:

- The wallet keypair is network-agnostic, but test USDC liquidity for Solana is commonly distributed on Devnet.
- The service returns both the owner wallet address and the USDC associated token account for deposit flows.

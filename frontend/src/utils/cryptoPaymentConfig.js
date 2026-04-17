export const CRYPTO_PAYMENT_RAIL = 'usdc_solana';
export const CRYPTO_PAYMENT_ASSET = 'USDC';
export const CRYPTO_PAYMENT_NETWORK = 'Solana Devnet';
export const CRYPTO_PAYMENT_NETWORK_SHORT = 'Solana';
export const CRYPTO_PAYMENT_LABEL = `${CRYPTO_PAYMENT_ASSET} on ${CRYPTO_PAYMENT_NETWORK}`;
export const CRYPTO_PAYMENT_REFILL_ROUTE = '/refill-usdc';
export const CRYPTO_PAYMENT_WITHDRAW_ROUTE = '/withdrawal-usdc';
export const CRYPTO_PAYMENT_LEGACY_REFILL_ROUTE = '/refill-usdt';
export const CRYPTO_PAYMENT_LEGACY_WITHDRAW_ROUTE = '/withdrawal-usdt';
export const CRYPTO_PAYMENT_WALLET_LABEL = 'Solana wallet address';
export const CRYPTO_PAYMENT_TOKEN_ACCOUNT_LABEL = 'Associated token account';

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const isValidSolanaAddress = (address = '') => SOLANA_ADDRESS_RE.test(address.trim());

export const getCryptoDepositPurchaseMessage = (amount) =>
  `Deposit address created! Send $${amount.toFixed(2)} ${CRYPTO_PAYMENT_ASSET} on ${CRYPTO_PAYMENT_NETWORK} to continue.`;

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bs58 = require('bs58');
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} = require('@solana/spl-token');
const DeterministicWallet = require('./deterministicWallet');

const app = express();
app.use(express.json());
app.use(cors());

app.set('trust proxy', true);

app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    console.error(`Request timeout for ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_USDC_MINT = process.env.SOLANA_USDC_MINT;
const SOLANA_USDC_DECIMALS = parseInt(process.env.SOLANA_USDC_DECIMALS || '6', 10);
const SOLANA_PORT = parseInt(process.env.SOLANA_PORT || '3200', 10);

if (!SOLANA_USDC_MINT) {
  throw new Error('SOLANA_USDC_MINT is required');
}

const usdcMint = new PublicKey(SOLANA_USDC_MINT);
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

function parseSecretKey(secretValue) {
  if (!secretValue) {
    throw new Error('SOLANA_PRIVATE_KEYPAIR is required');
  }

  try {
    const parsed = JSON.parse(secretValue);
    if (Array.isArray(parsed)) {
      return Uint8Array.from(parsed);
    }
  } catch (jsonError) {
    // Fall through to base58 decoding.
  }

  try {
    return bs58.decode(secretValue);
  } catch (bs58Error) {
    throw new Error('SOLANA_PRIVATE_KEYPAIR must be a JSON array or a base58-encoded secret key');
  }
}

const masterSecretKey = parseSecretKey(process.env.SOLANA_PRIVATE_KEYPAIR);
const masterWallet = Keypair.fromSecretKey(masterSecretKey);
const deterministicWallet = new DeterministicWallet(masterSecretKey);

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 200;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await delay(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
}

function parsePositiveIntegerAmount(rawAmount) {
  if (rawAmount === undefined || rawAmount === null) {
    throw new Error('amount is required');
  }

  const normalized = rawAmount.toString().trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error('amount must be a positive integer string in base units');
  }

  const amount = BigInt(normalized);
  if (amount <= 0n) {
    throw new Error('amount must be greater than zero');
  }

  return amount;
}

function formatLamportsAsSol(lamports) {
  return (Number(lamports) / LAMPORTS_PER_SOL).toString();
}

function publicKeyFromValue(value, fieldName = 'address') {
  try {
    return new PublicKey(value);
  } catch (error) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function getAssociatedTokenAddress(ownerPublicKey) {
  return getAssociatedTokenAddressSync(usdcMint, ownerPublicKey, false, TOKEN_PROGRAM_ID);
}

async function maybeTokenAccountForMint(publicKey) {
  const parsedInfo = await connection.getParsedAccountInfo(publicKey, 'confirmed');
  const parsedData = parsedInfo.value && parsedInfo.value.data && parsedInfo.value.data.parsed;

  if (!parsedData || parsedData.type !== 'account') {
    return null;
  }

  const info = parsedData.info;
  if (info.mint !== usdcMint.toBase58()) {
    return null;
  }

  return {
    publicKey,
    owner: new PublicKey(info.owner),
    amount: BigInt(info.tokenAmount.amount),
    decimals: info.tokenAmount.decimals,
  };
}

async function getBalanceInfoForAddress(address) {
  const publicKey = publicKeyFromValue(address);

  const tokenAccountInfo = await maybeTokenAccountForMint(publicKey);
  if (tokenAccountInfo) {
    return {
      addressType: 'token_account',
      owner: tokenAccountInfo.owner.toBase58(),
      tokenAccounts: [publicKey.toBase58()],
      balance: tokenAccountInfo.amount,
    };
  }

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { mint: usdcMint },
    'confirmed'
  );

  let balance = 0n;
  const tokenAccountAddresses = [];
  for (const account of tokenAccounts.value) {
    const amount = BigInt(account.account.data.parsed.info.tokenAmount.amount);
    balance += amount;
    tokenAccountAddresses.push(account.pubkey.toBase58());
  }

  return {
    addressType: 'wallet',
    owner: publicKey.toBase58(),
    tokenAccounts: tokenAccountAddresses,
    balance,
  };
}

async function resolveRecipient(toValue, payerPublicKey) {
  const publicKey = publicKeyFromValue(toValue, 'recipient');

  const tokenAccountInfo = await maybeTokenAccountForMint(publicKey);
  if (tokenAccountInfo) {
    return {
      addressType: 'token_account',
      owner: tokenAccountInfo.owner,
      tokenAccount: publicKey,
      createInstruction: null,
    };
  }

  const tokenAccount = getAssociatedTokenAddress(publicKey);
  const tokenAccountInfoRaw = await connection.getAccountInfo(tokenAccount, 'confirmed');
  const createInstruction = tokenAccountInfoRaw
    ? null
    : createAssociatedTokenAccountInstruction(
        payerPublicKey,
        tokenAccount,
        publicKey,
        usdcMint,
        TOKEN_PROGRAM_ID
      );

  return {
    addressType: 'wallet',
    owner: publicKey,
    tokenAccount,
    createInstruction,
  };
}

async function summarizeUsdcTransaction(signature) {
  const transaction = await connection.getParsedTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!transaction) {
    return {
      signature,
      status: 'sent',
    };
  }

  let usdcAmount = null;
  let source = null;
  let destination = null;

  for (const instruction of transaction.transaction.message.instructions) {
    const parsed = instruction.parsed;
    if (!parsed || !parsed.info) {
      continue;
    }

    const info = parsed.info;
    const mintMatches = !info.mint || info.mint === usdcMint.toBase58();
    const isTransferInstruction = parsed.type === 'transfer' || parsed.type === 'transferChecked';

    if (!isTransferInstruction || !mintMatches) {
      continue;
    }

    usdcAmount = info.tokenAmount ? info.tokenAmount.amount : info.amount || null;
    source = info.source || info.authority || null;
    destination = info.destination || null;
    break;
  }

  return {
    signature,
    status: transaction.meta && transaction.meta.err ? 'failed' : 'complete',
    slot: transaction.slot.toString(),
    blockTime: transaction.blockTime,
    usdcAmount,
    source,
    destination,
    fee: transaction.meta ? transaction.meta.fee.toString() : null,
  };
}

app.get('/health', async (req, res) => {
  try {
    await rateLimit();
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const solBalance = await connection.getBalance(masterWallet.publicKey, 'confirmed');
    const usdcBalanceInfo = await getBalanceInfoForAddress(masterWallet.publicKey.toBase58());

    res.json({
      status: 'healthy',
      service: 'usdc-solana-api',
      timestamp: new Date().toISOString(),
      network: SOLANA_NETWORK,
      rpc_url: SOLANA_RPC_URL,
      latest_blockhash: latestBlockhash.blockhash,
      master_wallet: masterWallet.publicKey.toBase58(),
      sol_balance_lamports: solBalance.toString(),
      sol_balance_sol: formatLamportsAsSol(solBalance),
      usdc_mint: usdcMint.toBase58(),
      usdc_balance: usdcBalanceInfo.balance.toString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'usdc-solana-api',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.get('/balance/:address', async (req, res) => {
  try {
    await rateLimit();
    const balanceInfo = await getBalanceInfoForAddress(req.params.address);
    res.json({
      address: req.params.address,
      addressType: balanceInfo.addressType,
      owner: balanceInfo.owner,
      tokenAccounts: balanceInfo.tokenAccounts,
      balance: balanceInfo.balance.toString(),
      mint: usdcMint.toBase58(),
      decimals: SOLANA_USDC_DECIMALS,
    });
  } catch (error) {
    console.error('USDC balance error:', error);
    res.status(500).json({
      error: 'Error fetching Solana USDC balance',
      details: error.message,
      address: req.params.address,
    });
  }
});

app.get('/sol-balance/:address', async (req, res) => {
  try {
    await rateLimit();
    const publicKey = publicKeyFromValue(req.params.address);
    const balance = await connection.getBalance(publicKey, 'confirmed');
    res.json({
      address: publicKey.toBase58(),
      balance: balance.toString(),
      balanceSol: formatLamportsAsSol(balance),
    });
  } catch (error) {
    console.error('SOL balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/receive', async (req, res) => {
  try {
    const { deposit_id: depositIdRaw } = req.body || {};
    const depositId = parseInt(depositIdRaw, 10);

    if (!Number.isInteger(depositId) || depositId < 0) {
      return res.status(400).json({ error: 'deposit_id must be a non-negative integer' });
    }

    const keypair = deterministicWallet.generateKeypair(depositId);
    const tokenAccount = getAssociatedTokenAddress(keypair.publicKey);

    res.json({
      address: keypair.publicKey.toBase58(),
      token_account: tokenAccount.toBase58(),
      deposit_id: depositId,
    });
  } catch (error) {
    console.error('Receive address generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/zero-balance-address', async (req, res) => {
  try {
    const MAX_ATTEMPTS = 100;
    const MIN_INDEX = 10;
    const MAX_INDEX = 2147483647;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const index = Math.floor(Math.random() * (MAX_INDEX - MIN_INDEX)) + MIN_INDEX;
      const keypair = deterministicWallet.generateKeypair(index);
      const balanceInfo = await getBalanceInfoForAddress(keypair.publicKey.toBase58());

      if (balanceInfo.balance === 0n) {
        const tokenAccount = getAssociatedTokenAddress(keypair.publicKey);
        return res.json({
          address: keypair.publicKey.toBase58(),
          token_account: tokenAccount.toBase58(),
          index,
          attempts: attempt,
        });
      }
    }

    res.status(500).json({
      error: 'Could not find zero-balance address after maximum attempts',
      attempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error('Zero-balance address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/send', async (req, res) => {
  try {
    await rateLimit();

    const { to, amount: rawAmount, request_id: requestId } = req.body || {};
    if (!to) {
      return res.status(400).json({ error: 'to is required' });
    }

    const amount = parsePositiveIntegerAmount(rawAmount);
    const sourceTokenAccount = getAssociatedTokenAddress(masterWallet.publicKey);
    const sourceInfo = await connection.getAccountInfo(sourceTokenAccount, 'confirmed');
    if (!sourceInfo) {
      return res.status(400).json({ error: 'Master wallet USDC token account does not exist' });
    }

    const recipient = await resolveRecipient(to, masterWallet.publicKey);
    const transaction = new Transaction();

    if (recipient.createInstruction) {
      transaction.add(recipient.createInstruction);
    }

    transaction.add(
      createTransferCheckedInstruction(
        sourceTokenAccount,
        usdcMint,
        recipient.tokenAccount,
        masterWallet.publicKey,
        amount,
        SOLANA_USDC_DECIMALS,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [masterWallet], {
      commitment: 'confirmed',
    });

    res.json({
      status: 'complete',
      signature,
      request_id: requestId || null,
      recipient_owner: recipient.owner.toBase58(),
      recipient_token_account: recipient.tokenAccount.toBase58(),
      amount: amount.toString(),
      mint: usdcMint.toBase58(),
    });
  } catch (error) {
    console.error('USDC send error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

app.get('/master-wallet', async (req, res) => {
  try {
    await rateLimit();
    const solBalance = await connection.getBalance(masterWallet.publicKey, 'confirmed');
    const usdcBalanceInfo = await getBalanceInfoForAddress(masterWallet.publicKey.toBase58());

    res.json({
      address: masterWallet.publicKey.toBase58(),
      solBalance: solBalance.toString(),
      solBalanceSol: formatLamportsAsSol(solBalance),
      usdcBalance: usdcBalanceInfo.balance.toString(),
      usdcBalanceUi: (Number(usdcBalanceInfo.balance) / 10 ** SOLANA_USDC_DECIMALS).toFixed(SOLANA_USDC_DECIMALS),
      tokenAccounts: usdcBalanceInfo.tokenAccounts,
      mint: usdcMint.toBase58(),
    });
  } catch (error) {
    console.error('Master wallet error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/tx-status/:signature', async (req, res) => {
  try {
    await rateLimit();

    const { signature } = req.params;
    const statuses = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = statuses && statuses.value ? statuses.value[0] : null;

    if (!status) {
      return res.json({
        signature,
        status: 'sent',
      });
    }

    if (status.err) {
      return res.json({
        signature,
        status: 'failed',
        err: status.err,
        confirmationStatus: status.confirmationStatus,
      });
    }

    const summary = await summarizeUsdcTransaction(signature);
    const mappedStatus =
      status.confirmationStatus === 'processed' ? 'sent' : summary.status || 'complete';

    res.json({
      signature,
      status: mappedStatus,
      confirmationStatus: status.confirmationStatus,
      confirmations: status.confirmations,
      slot: status.slot ? status.slot.toString() : null,
      usdcAmount: summary.usdcAmount,
      source: summary.source,
      destination: summary.destination,
      fee: summary.fee,
      blockTime: summary.blockTime,
    });
  } catch (error) {
    console.error('Transaction status error:', error);
    res.json({
      signature: req.params.signature,
      status: 'sent',
      error: error.message,
    });
  }
});

app.post('/sweep', async (req, res) => {
  try {
    await rateLimit();

    const {
      from_address: fromAddress,
      deposit_id: depositIdRaw,
      amount: rawAmount,
      to,
    } = req.body || {};

    const depositId = parseInt(depositIdRaw, 10);
    if (!Number.isInteger(depositId) || depositId < 0) {
      return res.status(400).json({ error: 'deposit_id must be a non-negative integer' });
    }

    if (!fromAddress || !deterministicWallet.verifyAddress(depositId, fromAddress)) {
      return res.status(400).json({ error: 'Address does not match deposit ID' });
    }

    const amount = parsePositiveIntegerAmount(rawAmount);
    const depositWallet = deterministicWallet.generateKeypair(depositId);
    const sourceTokenAccount = getAssociatedTokenAddress(depositWallet.publicKey);
    const sourceInfo = await connection.getAccountInfo(sourceTokenAccount, 'confirmed');
    if (!sourceInfo) {
      return res.status(400).json({ error: 'Deposit wallet USDC token account does not exist' });
    }

    const recipient = await resolveRecipient(to || masterWallet.publicKey.toBase58(), masterWallet.publicKey);
    const transaction = new Transaction();

    if (recipient.createInstruction) {
      transaction.add(recipient.createInstruction);
    }

    transaction.add(
      createTransferCheckedInstruction(
        sourceTokenAccount,
        usdcMint,
        recipient.tokenAccount,
        depositWallet.publicKey,
        amount,
        SOLANA_USDC_DECIMALS,
        [],
        TOKEN_PROGRAM_ID
      )
    );
    transaction.feePayer = masterWallet.publicKey;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [masterWallet, depositWallet],
      { commitment: 'confirmed' }
    );

    res.json({
      success: true,
      signature,
      from: depositWallet.publicKey.toBase58(),
      from_token_account: sourceTokenAccount.toBase58(),
      to: recipient.owner.toBase58(),
      to_token_account: recipient.tokenAccount.toBase58(),
      amount: amount.toString(),
    });
  } catch (error) {
    console.error('Sweep error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/transactions/:address', async (req, res) => {
  try {
    await rateLimit();

    const balanceInfo = await getBalanceInfoForAddress(req.params.address);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const signaturesById = new Map();

    for (const tokenAccountAddress of balanceInfo.tokenAccounts) {
      const tokenAccount = new PublicKey(tokenAccountAddress);
      const signatures = await connection.getSignaturesForAddress(tokenAccount, { limit }, 'confirmed');

      for (const entry of signatures) {
        if (!signaturesById.has(entry.signature)) {
          signaturesById.set(entry.signature, entry);
        }
      }
    }

    const sortedEntries = Array.from(signaturesById.values())
      .sort((a, b) => b.slot - a.slot)
      .slice(0, limit);

    const transactions = [];
    for (const entry of sortedEntries) {
      const summary = await summarizeUsdcTransaction(entry.signature);
      transactions.push({
        signature: entry.signature,
        slot: entry.slot.toString(),
        blockTime: entry.blockTime,
        memo: entry.memo,
        confirmationStatus: entry.confirmationStatus,
        err: entry.err,
        status: summary.status,
        value: summary.usdcAmount,
        source: summary.source,
        destination: summary.destination,
      });
    }

    res.json({
      address: req.params.address,
      addressType: balanceInfo.addressType,
      tokenAccounts: balanceInfo.tokenAccounts,
      transactions,
    });
  } catch (error) {
    console.error('Transactions lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/fund-rent', async (req, res) => {
  try {
    await rateLimit();

    const { to, amount } = req.body || {};
    const lamports = parsePositiveIntegerAmount(amount);
    if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
      return res.status(400).json({ error: 'amount is too large' });
    }
    const recipient = publicKeyFromValue(to, 'recipient');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: masterWallet.publicKey,
        toPubkey: recipient,
        lamports: Number(lamports),
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [masterWallet], {
      commitment: 'confirmed',
    });

    res.json({
      success: true,
      signature,
      from: masterWallet.publicKey.toBase58(),
      to: recipient.toBase58(),
      amount: lamports.toString(),
    });
  } catch (error) {
    console.error('Fund rent error:', error);
    res.status(500).json({ error: error.message });
  }
});

if (require.main === module) {
  app.listen(SOLANA_PORT, () => {
    console.log(`Solana USDC service listening on port ${SOLANA_PORT}`);
    console.log(`RPC URL: ${SOLANA_RPC_URL}`);
    console.log(`Network: ${SOLANA_NETWORK}`);
    console.log(`Master wallet: ${masterWallet.publicKey.toBase58()}`);
    console.log(`USDC mint: ${usdcMint.toBase58()}`);
  });
}

module.exports = {
  app,
  connection,
  deterministicWallet,
  masterWallet,
  parseSecretKey,
};

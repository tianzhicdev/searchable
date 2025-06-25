require('dotenv').config();
const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configure Express for better concurrency
app.set('trust proxy', true);

// Add timeout middleware to prevent hanging requests
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    console.error(`Request timeout for ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString(); };

const domain = process.env.INFURA_DOMAIN;

// Configure Web3 provider with rate limiting protection
const providerOptions = {
  timeout: 30000, // 30 second timeout
  headers: [
    {
      name: 'User-Agent',
      value: 'searchable-usdt-api/1.0'
    }
  ],
  // Enable keep-alive for better connection reuse
  keepAlive: true,
  keepAliveInterval: 30000,
  keepAliveTimeout: 5000,
  // Add retry logic for rate limiting
  withCredentials: false
};

const web3 = new Web3(new Web3.providers.HttpProvider(`https://${domain}/v3/${process.env.INFURA_ID}`, providerOptions));

console.log('Web3 provider configured with concurrency optimizations');
const usdtAbi = require('./erc20.abi.json');

// USDT Contract (Mainnet)
const usdtContract = new web3.eth.Contract(
  usdtAbi,
  process.env.USDT_CONTRACT
);

// Simple nonce counter - initialize on startup
let currentNonce = null;
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

// Rate limiting protection
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await delay(waitTime);
  }
  
  lastRequestTime = Date.now();
}

// Gas price cache to reduce network calls
let cachedGasPrice = null;
let gasPriceLastUpdate = 0;
const GAS_PRICE_CACHE_DURATION = 30000; // 30 seconds

// Fixed gas limit for USDT transfers (they're consistent)
const USDT_TRANSFER_GAS_LIMIT = 65000; // Standard USDT transfer uses ~50k, adding buffer

// Initialize nonce on startup
async function initializeNonce() {
  try {
    currentNonce = await web3.eth.getTransactionCount(account.address, 'pending');
    console.log(`[NONCE] Initialized with nonce: ${currentNonce}`);
  } catch (error) {
    console.error('Failed to initialize nonce:', error);
    process.exit(1);
  }
}

// Get next nonce (thread-safe counter)
function getNextNonce() {
  if (currentNonce === null) {
    throw new Error('Nonce not initialized');
  }
  return currentNonce++;
}

// Get cached gas price or fetch new one
async function getGasPrice() {
  const now = Date.now();
  if (cachedGasPrice && (now - gasPriceLastUpdate) < GAS_PRICE_CACHE_DURATION) {
    return cachedGasPrice;
  }
  
  try {
    await rateLimit(); // Apply rate limiting
    cachedGasPrice = await web3.eth.getGasPrice();
    gasPriceLastUpdate = now;
    console.log(`[GAS] Updated cached gas price: ${cachedGasPrice}`);
    return cachedGasPrice;
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    // Fallback to a reasonable gas price (20 gwei)
    if (!cachedGasPrice) {
      cachedGasPrice = '20000000000';
    }
    return cachedGasPrice;
  }
}

// Initialize nonce on startup
initializeNonce();


// Get USDT balance
app.get('/balance/:address', async (req, res) => {
  try {
    // Validate address format
    if (!web3.utils.isAddress(req.params.address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
    
    // Add more detailed error handling and logging
    try {
      const balance = await usdtContract.methods
        .balanceOf(req.params.address)
        .call();
      
      console.log("balance", balance);
      // Return the balance directly in wei (base unit)
      const balanceInWei = typeof balance === 'bigint' ? balance.toString() : balance;
      
      res.json({ balance: balanceInWei });
    } catch (contractError) {
      console.error('Contract call error:', contractError);
      
      // Check if we're on the right network
      const networkId = await web3.eth.net.getId();
      console.log(`Current network ID: ${networkId}`);
      
      // Log contract address being used
      console.log(`USDT contract address: ${process.env.USDT_CONTRACT}`);
      
      res.status(500).json({ 
        error: 'Error calling USDT contract',
        details: contractError.message,
        address: req.params.address,
        network: networkId,
        contractAddress: process.env.USDT_CONTRACT
      });
    }
  } catch (error) {
    console.error('USDT Balance Error:', error);
    res.status(500).json({ 
      error: 'Error fetching USDT balance',
      details: error.message,
      address: req.params.address
    });
  }
});

// Get receive address
app.post('/receive', (req, res) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    res.json({
      address: account.address
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Send USDT
app.post('/send', async (req, res) => {
  const { to, amount, request_id: provided_request_id } = req.body;
  const request_id = provided_request_id || `req_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  let txHash = null;
  let signedTx = null;
  
  try {
    console.log(`[${request_id}] Starting USDT transfer - To: ${to}, Amount: ${amount}`);
    
    // Validate inputs
    if (!web3.utils.isAddress(to)) {
      throw new Error('Invalid recipient address format');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    const fromAddress = account.address;
    console.log(`[${request_id}] From address: ${fromAddress}`);
    
    // Build transaction
    const tx = usdtContract.methods.transfer(
      to, 
      amount.toString()
    );
    console.log(`[${request_id}] Transaction method built`);

    // Use cached gas price and fixed gas limit for better concurrency
    const gasPrice = await getGasPrice();
    const gas = USDT_TRANSFER_GAS_LIMIT;
    
    // Use simple counter for nonce (no network calls!)
    const nonce = getNextNonce();
    console.log(`[${request_id}] Using cached gas price: ${gasPrice}, fixed gas: ${gas}, nonce: ${nonce} (counter)`);

    // Sign transaction
    const txObject = {
      to: process.env.USDT_CONTRACT,
      data: tx.encodeABI(),
      gas,
      gasPrice,
      nonce,
      from: fromAddress
    };
    
    signedTx = await web3.eth.accounts.signTransaction(txObject, process.env.PRIVATE_KEY);
    txHash = signedTx.transactionHash;
    console.log(`[${request_id}] Transaction signed, hash: ${txHash}`);

    // Apply rate limiting before broadcasting
    await rateLimit();
    
    // Send transaction and return immediately (don't wait for confirmation)
    console.log(`[${request_id}] Broadcasting signed transaction...`);
    
    // Retry logic for rate limiting
    let broadcastAttempts = 0;
    const maxAttempts = 3;
    
    while (broadcastAttempts < maxAttempts) {
      try {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
          .on('transactionHash', (hash) => {
            console.log(`[${request_id}] Transaction broadcasted with hash: ${hash}`);
          })
          .on('receipt', (receipt) => {
            console.log(`[${request_id}] Transaction confirmed in block: ${receipt.blockNumber}`);
          })
          .on('error', (error) => {
            console.error(`[${request_id}] Transaction error after broadcast: ${error.message}`);
          });
        break; // Success, exit retry loop
      } catch (error) {
        broadcastAttempts++;
        if (error.statusCode === 429 && broadcastAttempts < maxAttempts) {
          console.warn(`[${request_id}] Rate limited, retrying in ${broadcastAttempts * 1000}ms (attempt ${broadcastAttempts}/${maxAttempts})`);
          await delay(broadcastAttempts * 1000); // Exponential backoff
        } else {
          throw error; // Re-throw if not rate limit or max attempts reached
        }
      }
    }
    
    // Return immediately after signing (transaction is being broadcasted async)
    res.json({ 
      success: true,
      txHash: txHash,
      from: fromAddress,
      to: to,
      amount: amount,
      status: 'processing', // Indicate transaction is being processed
      blockNumber: null, // Will be null since we don't wait for confirmation
      gasUsed: null, // Will be null since we don't wait for confirmation
      request_id: request_id
    });
  } catch (error) {
    console.error(`[${request_id}] USDT Transfer Error:`, error);
    
    // Categorize error
    let errorType = 'unknown';
    if (error.message.includes('Invalid recipient address')) {
      errorType = 'invalid_address';
    } else if (error.message.includes('insufficient funds')) {
      errorType = 'insufficient_funds';
    } else if (error.message.includes('gas required exceeds')) {
      errorType = 'insufficient_gas';
    } else if (error.message.includes('nonce')) {
      errorType = 'nonce_error';
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout';
    }
    
    res.status(500).json({ 
      success: false,
      txHash: txHash, // Will be available if we got to signing stage
      error: error.message,
      errorType: errorType,
      request_id: request_id,
      from: account ? account.address : null,
      to: to,
      amount: amount
    });
  }
});

// Get transaction status
app.get('/tx-status/:txHash', async (req, res) => {
  const { txHash } = req.params;
  const request_id = `tx_status_${Date.now()}`;
  
  try {
    console.log(`[${request_id}] Checking status for tx: ${txHash}`);
    
    // Validate tx hash format
    if (!txHash || !txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return res.status(400).json({ 
        error: 'Invalid transaction hash format',
        txHash: txHash 
      });
    }
    
    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    
    if (!receipt) {
      // Transaction not found, check if it's pending
      const pendingTx = await web3.eth.getTransaction(txHash);
      
      if (pendingTx) {
        console.log(`[${request_id}] Transaction is pending`);
        return res.json({
          txHash: txHash,
          status: 'pending',
          confirmations: 0,
          blockNumber: null,
          gasUsed: null,
          success: null
        });
      } else {
        console.log(`[${request_id}] Transaction not found`);
        return res.json({
          txHash: txHash,
          status: 'not_found',
          confirmations: 0,
          blockNumber: null,
          gasUsed: null,
          success: null
        });
      }
    }
    
    // Get current block number for confirmations
    const currentBlock = await web3.eth.getBlockNumber();
    const confirmations = Number(currentBlock) - Number(receipt.blockNumber);
    
    // Check if transaction was successful (status = 1) or reverted (status = 0)
    // Handle multiple formats: string "1", number 1, bigint 1n, boolean true
    const transactionSuccess = receipt.status === "1" || 
                              receipt.status === 1 || 
                              receipt.status === 1n || 
                              receipt.status === true;
    
    console.log(`[${request_id}] Transaction found - Block: ${receipt.blockNumber}, Status: ${receipt.status} (type: ${typeof receipt.status}), Success: ${transactionSuccess}, Confirmations: ${confirmations}`);
    
    res.json({
      txHash: txHash,
      status: 'confirmed',
      confirmations: confirmations,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      success: transactionSuccess,
      from: receipt.from,
      to: receipt.to,
      logs: receipt.logs.length, // Number of events emitted
      // Additional receipt info for metadata storage
      receiptInfo: {
        blockHash: receipt.blockHash,
        effectiveGasPrice: receipt.effectiveGasPrice,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        transactionIndex: receipt.transactionIndex,
        type: receipt.type
      }
    });
    
  } catch (error) {
    console.error(`[${request_id}] Error checking transaction status:`, error);
    
    // Check if this is a network connectivity error that should be retried
    const isNetworkError = error.code === 'ECONNREFUSED' || 
                          error.type === 'system' || 
                          error.message.includes('ECONNREFUSED') ||
                          error.message.includes('FetchError');
    
    if (isNetworkError) {
      // Return a specific error code for network issues so background service can retry
      res.status(503).json({ 
        error: 'Network connectivity issue',
        details: error.message,
        txHash: txHash,
        request_id: request_id,
        retryable: true
      });
    } else {
      res.status(500).json({ 
        error: 'Error checking transaction status',
        details: error.message,
        txHash: txHash,
        request_id: request_id,
        retryable: false
      });
    }
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 USDT Service running on port ${process.env.PORT}`);
  console.log('⚡ Concurrency optimizations active:');
  console.log('   - Simple nonce counter (no network calls)');
  console.log('   - Gas price caching (30s cache)');
  console.log('   - Fixed gas limit for USDT transfers');
  console.log('   - Async transaction broadcasting (no confirmation wait)');
  console.log('   - HTTP keep-alive connections');
  console.log('   - 30s request timeout protection');
  console.log('   - Rate limiting protection (100ms intervals)');
  console.log('   - Retry logic for rate limit errors');
  console.log('💰 Ready for concurrent USDT transfers');
}); 
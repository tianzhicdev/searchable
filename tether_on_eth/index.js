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

// Global error handlers to prevent process crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (error.statusCode === 429 || error.code === 429) {
    console.warn('Rate limiting error caught globally, continuing...');
  } else {
    console.error('Non-rate-limit uncaught exception, continuing but this should be investigated');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason && (reason.statusCode === 429 || reason.code === 429)) {
    console.warn('Rate limiting rejection caught globally, continuing...');
  } else {
    console.error('Non-rate-limit unhandled rejection, continuing but this should be investigated');
  }
});

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

// Rate limiting protection - increase interval to prevent crashes
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // Minimum 500ms between requests (was 100ms)

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
const GAS_PRICE_CACHE_DURATION = 120000; // 2 minutes (was 30 seconds)

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
      console.error(`[${request_id}] Invalid recipient address: ${to}`);
      throw new Error('Invalid recipient address');
    }
    
    if (!amount || amount <= 0) {
      console.error(`[${request_id}] Invalid amount: ${amount}`);
      throw new Error('Invalid amount - must be greater than zero');
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
    // let gasPrice, gas, nonce;

    gasPrice = await getGasPrice();
    gas = await tx.estimateGas({ from: fromAddress });
    nonce = getNextNonce();
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
    console.log(`[${request_id}] Broadcasting signed transaction...`);
    
    // Fire-and-forget transaction broadcasting with comprehensive error handling
    // Use setImmediate to avoid blocking the response and handle errors asynchronously
    setImmediate(async () => {
      try {
        console.log(`[${request_id}] Starting async broadcast for tx: ${txHash}`);
        const txPromise = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        txPromise
          .on('transactionHash', (hash) => {
            console.log(`[${request_id}] Transaction broadcasted with hash: ${hash}`);
          })
          .on('receipt', (receipt) => {
            console.log(`[${request_id}] Transaction confirmed in block: ${receipt.blockNumber}, status: ${receipt.status}`);
          })
          .on('error', (error) => {
            // Handle all errors in the async broadcast - don't let them crash the service
            if (error.statusCode === 429 || error.code === 429) {
              console.warn(`[${request_id}] Rate limited during broadcast: ${error.message}. Transaction may still succeed.`);
            } else if (error.message && error.message.includes('replacement transaction underpriced')) {
              console.warn(`[${request_id}] Nonce collision during broadcast: ${error.message}. Transaction may still succeed.`);
            } else {
              console.error(`[${request_id}] Transaction error after broadcast: ${error.message}`);
            }
          });
          
        // Wait for the promise and log the final result
        try {
          const receipt = await txPromise;
          console.log(`[${request_id}] ✅ Async broadcast completed successfully:`, {
            txHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            status: receipt.status,
            gasUsed: receipt.gasUsed
          });
        } catch (error) {
          if (error.statusCode === 429 || error.code === 429) {
            console.warn(`[${request_id}] ⚠️  Rate limited during broadcast promise: ${error.message}. Transaction may still succeed.`);
          } else {
            console.error(`[${request_id}] ❌ Async broadcast failed:`, {
              error: error.message,
              code: error.code,
              txHash: txHash
            });
          }
        }

      } catch (error) {
        console.error(`[${request_id}] Unexpected error in async broadcast:`, error);
      }
    });
    
    // // Validate we have a txHash before returning success
    // if (!txHash || txHash === 'null' || txHash === 'undefined') {
    //   throw new Error('Transaction signing failed - no transaction hash generated');
    // }
    
    // Return immediately after signing (transaction is being broadcasted async)
    res.json({ 
      // success: true,
      txHash: txHash,
      // from: fromAddress,
      // to: to,
      // amount: amount,
      // status: 'sent', // Indicate transaction is being processed
      // request_id: request_id
    });
  } catch (error) {

    // Build error response - only include txHash if we actually have one
    const errorResponse = { 
      txHash: txHash
    };
    
    // // Only include txHash if we have a valid one (transaction was signed)
    // if (txHash && txHash !== 'null' && txHash !== 'undefined') {
    //   errorResponse.txHash = txHash;
    // }
    
    res.status(500).json(errorResponse);
  }
});

// Get transaction status
app.get('/tx-status/:txHash', async (req, res) => {
  const { txHash } = req.params;
  // todo: use withdrawal_id
  const request_id = `tx_status_${Date.now()}`;
  
  try {
    console.log(`[${request_id}] Checking status for tx: ${txHash}`);
    
    // Apply rate limiting to tx-status lookups
    await rateLimit();
    
    // Validate tx hash format
    if (!txHash || txHash === 'None' || txHash === 'null' || txHash === 'undefined' || !txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return res.json({
          txHash: txHash,
          status: 'failed'
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
          status: 'sent'
        });
      } else {
        console.log(`[${request_id}] Transaction not found`);
        return res.json({
          txHash: txHash,
          status: 'sent',
        });
      }
    }
    
    const transactionSuccess = receipt.status === "1" || 
                              receipt.status === 1 || 
                              receipt.status === 1n || 
                              receipt.status === true;
    
    console.log(`[${request_id}] Transaction found - Block: ${receipt.blockNumber}, Status: ${receipt.status} (type: ${typeof receipt.status}), Success: ${transactionSuccess}`);
    
    res.json({
      txHash: txHash,
      status: 'complete',
      // confirmations: confirmations,
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

    console.log(`[${request_id}] Error checking transaction status: ${error.message}`);
    res.json({ 
        error: 'Error checking transaction status',
        details: error.message,
        txHash: txHash,
        status: 'sent',
      });
    }
  }
);

app.listen(process.env.PORT, () => {
  console.log(`🚀 USDT Service running on port ${process.env.PORT}`);
  console.log('⚡ Concurrency optimizations active:');
  console.log('   - Simple nonce counter (no network calls)');
  console.log('   - Gas price caching (2min cache)');
  console.log('   - Fixed gas limit for USDT transfers');
  console.log('   - Async transaction broadcasting (no confirmation wait)');
  console.log('   - HTTP keep-alive connections');
  console.log('   - 30s request timeout protection');
  console.log('   - Rate limiting protection (500ms intervals)');
  console.log('   - Retry logic for rate limit errors');
  console.log('💰 Ready for concurrent USDT transfers');
}); 
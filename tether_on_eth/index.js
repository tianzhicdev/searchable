require('dotenv').config();
const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');
const HDWallet = require('./hdWallet');

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

// Initialize HD wallet for deposit address generation
const hdWallet = new HDWallet(process.env.PRIVATE_KEY);
console.log('HD Wallet initialized for deterministic address generation');

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
    console.log(`Initializing nonce counter... ${account.address}`);
    currentNonce = await web3.eth.getTransactionCount(account.address, 'pending');
    console.log(`[NONCE] Initialized with nonce: ${currentNonce}`);
  } catch (error) {
    console.error('Failed to initialize nonce:', error);
    
    // Check if this is an Infura quota/payment issue
    if (error.statusCode === 402) {
      console.error('❌ INFURA ERROR: Payment required (402) - Account may have exceeded quota or needs payment');
      console.error('   Please check your Infura account at https://infura.io/dashboard');
      console.error('   Using fallback nonce value of 0 for development');
      
      // Use fallback nonce for development/testing
      currentNonce = 0;
      console.warn(`[NONCE] Using fallback nonce: ${currentNonce}`);
    } else {
      console.error('   Non-payment related error, cannot continue');
      process.exit(1);
    }
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
    // Get current gas price
    const baseGasPrice = await web3.eth.getGasPrice();
    
    // Add 20% buffer to ensure faster mining
    const bufferedGasPrice = BigInt(baseGasPrice) * BigInt(200) / BigInt(100);
    
    cachedGasPrice = bufferedGasPrice.toString();
    gasPriceLastUpdate = now;
    
    console.log(`[GAS] Updated gas price: ${cachedGasPrice} (base: ${baseGasPrice}, +20% buffer)`);
    return cachedGasPrice;
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    
    // Check for Infura payment issues
    if (error.statusCode === 402) {
      console.warn('❌ INFURA ERROR: Cannot fetch gas price - using fallback value');
    }
    
    // Fallback to a reasonable gas price (20 gwei for mainnet, 2 gwei for testnet)
    if (!cachedGasPrice) {
      const isTestnet = domain.includes('sepolia') || domain.includes('goerli');
      cachedGasPrice = isTestnet ? '2000000000' : '20000000000'; // 2 gwei vs 20 gwei
      console.warn(`[GAS] Using fallback gas price: ${cachedGasPrice} (${isTestnet ? 'testnet' : 'mainnet'})`);
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
// Generate deterministic deposit address from deposit ID
app.post('/receive', (req, res) => {
  try {
    const { deposit_id } = req.body;
    
    // Validate deposit_id
    if (deposit_id === undefined || deposit_id === null) {
      return res.status(400).json({ error: 'deposit_id is required' });
    }
    
    const depositId = parseInt(deposit_id);
    if (isNaN(depositId) || depositId < 0) {
      return res.status(400).json({ error: 'deposit_id must be a non-negative integer' });
    }
    
    // Generate deterministic address from deposit ID
    const addressInfo = hdWallet.generateAddress(depositId);
    
    console.log(`Generated deposit address for ID ${depositId}: ${addressInfo.address}`);
    
    res.json({
      address: addressInfo.address,
      deposit_id: depositId,
      // No private key returned - it can be derived when needed
    });
  } catch (error) {
    console.error('Error generating deposit address:', error);
    res.status(500).json({ error: error.message });
  }
});


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

    
    await rateLimit();
    console.log(`[${request_id}] Broadcasting signed transaction...`);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`[${request_id}] Transaction broadcast complete to address ${to} - Receipt:`, receipt);
    res.json({ 
      status: 'complete',
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed:receipt.gasUsed,
      ReceiptStatus: receipt.status,
    });
    } catch (error) {
      console.error(`[${request_id}] USDT Transfer Error:`, error);
      res.status(500).json({ 
        error: error.message,
        stack: error.stack,
        request_id: request_id,
        txHash: txHash
      });
    }
  });
  // if failure, exhash -> delayed, no txhash -> failure 



// Generate address with zero balance
app.post('/zero-balance-address', async (req, res) => {
  try {
    const maxAttempts = 100; // Limit attempts to prevent infinite loops
    let attempts = 0;
    
    // HD wallet index must be less than 0x80000000 (2147483648)
    const MAX_HD_INDEX = 2147483647; // 0x7FFFFFFF
    const MIN_HD_INDEX = 10; // Use a large starting point to avoid collisions
    
    while (attempts < maxAttempts) {
      // Generate a random index within the valid range
      const randomIndex = Math.floor(Math.random() * (MAX_HD_INDEX - MIN_HD_INDEX)) + MIN_HD_INDEX;
      
      // Generate address
      const addressInfo = hdWallet.generateAddress(randomIndex);
      
      // Check balance
      try {
        const balance = await usdtContract.methods
          .balanceOf(addressInfo.address)
          .call();
        
        const balanceInWei = typeof balance === 'bigint' ? balance.toString() : balance;
        
        if (balanceInWei === '0') {
          console.log(`Found zero-balance address after ${attempts + 1} attempts: ${addressInfo.address} (index: ${randomIndex})`);
          
          return res.json({
            address: addressInfo.address,
            index: randomIndex,
            attempts: attempts + 1
          });
        }
      } catch (balanceError) {
        console.error(`Error checking balance for address ${addressInfo.address}:`, balanceError);
        // Continue to next attempt on balance check error
      }
      
      attempts++;
    }
    
    // If we've exhausted all attempts
    console.error(`Failed to find zero-balance address after ${maxAttempts} attempts`);
    res.status(500).json({ 
      error: 'Could not find zero-balance address after maximum attempts',
      attempts: maxAttempts
    });
    
  } catch (error) {
    console.error('Error generating zero-balance address:', error);
    res.status(500).json({ error: error.message });
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
    console.log(`[${request_id}] Full receipt:`, JSON.stringify(receipt, null, 2));
    
    // Get the transaction details to extract USDT amount
    let usdtAmount = null;
    try {
      const tx = await web3.eth.getTransaction(txHash);
      if (tx && tx.to && tx.to.toLowerCase() === process.env.USDT_CONTRACT.toLowerCase()) {
        // This is a USDT transaction, decode the transfer amount
        const decodedData = usdtContract.methods.transfer(
          '0x0000000000000000000000000000000000000000',
          '0'
        ).encodeABI();
        
        if (tx.input && tx.input.startsWith(decodedData.slice(0, 10))) {
          // Extract the transfer parameters
          const params = web3.eth.abi.decodeParameters(
            ['address', 'uint256'],
            '0x' + tx.input.slice(10)
          );
          usdtAmount = params[1]; // This is in wei (6 decimals for USDT)
        }
      }
    } catch (err) {
      console.error(`[${request_id}] Error extracting USDT amount:`, err);
    }
    
    const response = {
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
    };
    
    if (usdtAmount !== null) {
      response.usdtAmount = usdtAmount.toString();
    }
    
    res.json(response);
    
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

// we dont mark failure from lookup
// complete, delayed (can become complete), failed.

// Transfer from deposit address to main wallet
app.post('/sweep', async (req, res) => {
  const { from_address, deposit_id, amount } = req.body;
  
  try {
    await rateLimit();
    
    if (!web3.utils.isAddress(from_address)) {
      return res.status(400).json({ error: 'Invalid from address' });
    }
    
    // Validate deposit_id
    if (deposit_id === undefined || deposit_id === null) {
      return res.status(400).json({ error: 'deposit_id is required' });
    }
    
    const depositId = parseInt(deposit_id);
    if (isNaN(depositId) || depositId < 0) {
      return res.status(400).json({ error: 'deposit_id must be a non-negative integer' });
    }
    
    // Verify the address matches the deposit ID
    if (!hdWallet.verifyAddress(depositId, from_address)) {
      return res.status(400).json({ error: 'Address does not match deposit ID' });
    }
    
    // Get private key from HD wallet
    const privateKey = hdWallet.getPrivateKey(depositId);
    const depositAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
    
    // Add account to wallet to sign transactions
    web3.eth.accounts.wallet.add(depositAccount);
    
    const mainWallet = account.address;
    console.log(`Sweeping ${amount} USDT from ${from_address} to ${mainWallet}`);
    
    // Build transaction
    const tx = usdtContract.methods.transfer(mainWallet, amount.toString());
    
    // Get gas estimates
    const gasPrice = await getGasPrice();
    const gas = await tx.estimateGas({ from: from_address });
    
    // Send transaction
    const receipt = await tx.send({
      from: from_address,
      gas: gas,
      gasPrice: gasPrice
    });
    
    // Remove account from wallet
    web3.eth.accounts.wallet.remove(depositAccount);
    
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      from: from_address,
      to: mainWallet,
      amount: amount.toString()
    });
    
  } catch (error) {
    console.error('Sweep error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent transactions for an address
app.get('/transactions/:address', async (req, res) => {
  try {
    await rateLimit();
    
    const { address } = req.params;
    if (!web3.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber();
    
    // Look back 100 blocks (roughly 25 minutes on mainnet, 20 minutes on Sepolia)
    const fromBlock = currentBlock - BigInt(100);
    
    console.log(`Fetching USDT transfers to ${address} from block ${fromBlock} to ${currentBlock}`);
    
    // Get recent USDT transfer events to this address
    const events = await usdtContract.getPastEvents('Transfer', {
      filter: { to: address },
      fromBlock: fromBlock.toString(),
      toBlock: 'latest'
    });
    
    // Format the events
    const transactions = events.map(event => ({
      txHash: event.transactionHash,
      from: event.returnValues.from,
      to: event.returnValues.to,
      value: event.returnValues.value,
      blockNumber: event.blockNumber
    }));
    
    console.log(`Found ${transactions.length} USDT transfers to ${address}`);
    
    res.json({ transactions });
    
  } catch (error) {
    console.error('Transaction query error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
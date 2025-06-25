require('dotenv').config();
const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString(); };

const domain = process.env.INFURA_DOMAIN;
const web3 = new Web3(`https://${domain}/v3/${process.env.INFURA_ID}`);
const usdtAbi = require('./erc20.abi.json');

// USDT Contract (Mainnet)
const usdtContract = new web3.eth.Contract(
  usdtAbi,
  process.env.USDT_CONTRACT
);

// Simple nonce counter - initialize on startup
let currentNonce = null;
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

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

    // Estimate gas
    const gas = await tx.estimateGas({ from: fromAddress });
    const gasPrice = await web3.eth.getGasPrice();
    
    // Use simple counter for nonce (no network calls!)
    const nonce = getNextNonce();
    console.log(`[${request_id}] Gas estimation - gas: ${gas}, gasPrice: ${gasPrice}, nonce: ${nonce} (counter)`);

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

    // Send transaction
    console.log(`[${request_id}] Sending signed transaction...`);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`[${request_id}] Transaction confirmed, blockNumber: ${receipt.blockNumber}, gasUsed: ${receipt.gasUsed}`);
    
    res.json({ 
      success: true,
      txHash: receipt.transactionHash,
      from: fromAddress,
      to: to,
      amount: amount,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
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
    const transactionSuccess = receipt.status === true || receipt.status === 1 || receipt.status === '0x1';
    
    console.log(`[${request_id}] Transaction found - Block: ${receipt.blockNumber}, Status: ${receipt.status}, Success: ${transactionSuccess}, Confirmations: ${confirmations}`);
    
    res.json({
      txHash: txHash,
      status: 'confirmed',
      confirmations: confirmations,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      success: transactionSuccess,
      from: receipt.from,
      to: receipt.to,
      logs: receipt.logs.length // Number of events emitted
    });
    
  } catch (error) {
    console.error(`[${request_id}] Error checking transaction status:`, error);
    res.status(500).json({ 
      error: 'Error checking transaction status',
      details: error.message,
      txHash: txHash,
      request_id: request_id
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log('USDT Service initialized with simple nonce counter');
}); 
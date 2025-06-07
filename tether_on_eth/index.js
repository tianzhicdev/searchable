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
  const request_id = `req_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  const { to, amount } = req.body;
  
  try {
    // Create account from private key first
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    const fromAddress = account.address;
    console.log(`[${request_id}] Transfer details - From: ${fromAddress}, To: ${to}, Amount: ${amount}`);
    const tx = usdtContract.methods.transfer(
      to, 
      amount.toString()
    );
    console.log(`[${request_id}] tx`, tx);

    const gas = await tx.estimateGas({ from: fromAddress });
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    console.log(`[${request_id}] gas`, gas);
    console.log(`[${request_id}] gasPrice`, gasPrice);
    console.log(`[${request_id}] nonce`, nonce);

    const signedTx = await web3.eth.accounts.signTransaction({
      to: process.env.USDT_CONTRACT,
      data: tx.encodeABI(),
      gas,
      gasPrice,
      nonce,
      from: fromAddress
    }, process.env.PRIVATE_KEY);
    
    console.log(`[${request_id}] signedTx`, signedTx);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`[${request_id}] receipt`, receipt);
    res.json({ 
      txHash: receipt.transactionHash,
      from: fromAddress,
      to: to,
      amount: amount,
      request_id: request_id
    });
  } catch (error) {
    console.error(`[${request_id}] USDT Transfer Error:`, error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      request_id: request_id
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
}); 
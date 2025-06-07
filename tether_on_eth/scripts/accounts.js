const { ethers } = require("ethers");
require('dotenv').config();

// Function to create a wallet from a private key
function createWallet(privateKey) {
  return new ethers.Wallet(privateKey);
}

// Function to derive additional addresses from a wallet
function deriveAdditionalAddresses(wallet, count) {
  const addresses = [wallet.address]; // Include the primary address
  
  // Create HD node from the wallet
  const hdNode = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(wallet.mnemonic.phrase)
  );
  
  // Derive additional addresses
  for (let i = 1; i < count; i++) {
    // For an HD node wallet, we need to use the child method instead of derivePath
    // since we're already working with a derived node
    const derivedWallet = hdNode.deriveChild(i);
    addresses.push(derivedWallet.address);
  }
  
  return addresses;
}

// Create 5 test accounts, each with 1 private key and 3 addresses
function createTestAccounts(count = 5, addressesPerAccount = 3) {
  const accounts = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random wallet
    // Create a deterministic wallet using a fixed seed for testing
    const wallet = ethers.Wallet.fromPhrase("test test test test test test test test test test test junk");
    const privateKey = wallet.privateKey;
    
    // Derive addresses
    const addresses = deriveAdditionalAddresses(wallet, addressesPerAccount);
    
    accounts.push({
      privateKey,
      addresses
    });
  }
  
  return accounts;
}

// Generate the test accounts
const testAccounts = createTestAccounts();

// Display the accounts
console.log("Test Accounts:");
testAccounts.forEach((account, index) => {
  console.log(`\nAccount ${index + 1}:`);
  console.log(`Private Key: ${account.privateKey}`);
  console.log("Addresses:");
  account.addresses.forEach((address, addrIndex) => {
    console.log(`  Address ${addrIndex + 1}: ${address}`);
  });
});

module.exports = {
  createTestAccounts,
  testAccounts
};

const { HDNodeWallet, Wallet, keccak256 } = require('ethers');
const { Web3 } = require('web3');

/**
 * HD Wallet module for generating deterministic addresses from a master private key
 * Uses BIP44 standard: m/44'/60'/0'/0/{index}
 * where index is the deposit ID
 */
class HDWallet {
  constructor(masterPrivateKey) {
    // Ensure private key has 0x prefix
    const privateKey = masterPrivateKey.startsWith('0x') ? masterPrivateKey : `0x${masterPrivateKey}`;
    
    // Create a wallet from the private key
    const wallet = new Wallet(privateKey);
    
    // Use the private key to create a seed for HD wallet
    // We hash the private key to create deterministic entropy
    const seed = keccak256(privateKey);
    
    // Create HD wallet from seed
    this.masterNode = HDNodeWallet.fromSeed(seed);
    
    // Standard Ethereum derivation path
    this.basePath = "m/44'/60'/0'/0";
    
    // Web3 instance for address validation
    this.web3 = new Web3();
  }
  
  /**
   * Generate a deposit address from a deposit ID
   * @param {number} depositId - The deposit ID from database
   * @returns {object} - Object containing address (no private key exposed)
   */
  generateAddress(depositId) {
    if (typeof depositId !== 'number' || depositId < 0) {
      throw new Error('Deposit ID must be a non-negative number');
    }
    
    // Derive child wallet from deposit ID
    const path = `${this.basePath}/${depositId}`;
    const childNode = this.masterNode.derivePath(path);
    
    return {
      address: childNode.address,
      depositId: depositId,
      path: path
    };
  }
  
  /**
   * Get the private key for a specific deposit ID (for sweeping funds)
   * This should only be called when absolutely necessary
   * @param {number} depositId - The deposit ID
   * @returns {string} - The private key for this deposit address
   */
  getPrivateKey(depositId) {
    if (typeof depositId !== 'number' || depositId < 0) {
      throw new Error('Deposit ID must be a non-negative number');
    }
    
    const path = `${this.basePath}/${depositId}`;
    const childNode = this.masterNode.derivePath(path);
    
    return childNode.privateKey;
  }
  
  /**
   * Verify that an address matches the expected address for a deposit ID
   * @param {number} depositId - The deposit ID
   * @param {string} address - The address to verify
   * @returns {boolean} - True if address matches
   */
  verifyAddress(depositId, address) {
    const generated = this.generateAddress(depositId);
    return generated.address.toLowerCase() === address.toLowerCase();
  }
  
  /**
   * Generate multiple addresses at once (for bulk operations)
   * @param {number} startId - Starting deposit ID
   * @param {number} count - Number of addresses to generate
   * @returns {array} - Array of address objects
   */
  generateBulkAddresses(startId, count) {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      addresses.push(this.generateAddress(startId + i));
    }
    return addresses;
  }
}

module.exports = HDWallet;
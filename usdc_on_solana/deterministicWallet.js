const crypto = require('crypto');
const { Keypair } = require('@solana/web3.js');

class DeterministicWallet {
  constructor(masterSecretKey) {
    if (!(masterSecretKey instanceof Uint8Array) || masterSecretKey.length < 32) {
      throw new Error('masterSecretKey must be a Uint8Array with at least 32 bytes');
    }

    this.masterSeed = Uint8Array.from(masterSecretKey.slice(0, 32));
  }

  deriveSeed(index) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('index must be a non-negative integer');
    }

    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(this.masterSeed));
    hash.update(Buffer.from(`:${index}`, 'utf8'));
    return Uint8Array.from(hash.digest().subarray(0, 32));
  }

  generateKeypair(index) {
    return Keypair.fromSeed(this.deriveSeed(index));
  }

  verifyAddress(index, address) {
    return this.generateKeypair(index).publicKey.toBase58() === address;
  }
}

module.exports = DeterministicWallet;

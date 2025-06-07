require("@nomicfoundation/hardhat-ignition-ethers");
require("dotenv").config();

module.exports = {
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/068a094036f34c2cb825a85dd138def6",
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.28",
      }
    ],
  },
};

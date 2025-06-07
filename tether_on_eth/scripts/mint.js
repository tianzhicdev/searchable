async function main() {
    
    // Get the token contract instance using the deployed address
    const tokenAddress = "0xEE33cf9005d929AA282a56055a1e503988dE9d2f";
    
    const myToken = await ethers.getContractAt("USDZ", tokenAddress);
    const [deployer] = await ethers.getSigners();
    // Mint additional tokens to the deployer
    const mintAmount = 5000; // Amount to mint
    console.log(`Minting ${mintAmount} tokens to ${deployer.address}...`);
    
    // The deployer already has the initial supply, this is just additional minting
    const mintTx = await myToken.mint(deployer.address, mintAmount);
    await mintTx.wait();
    
    console.log(`Connected to USDZ token at address: ${tokenAddress}`);
    // Get and log the updated balance
    const deployerBalance = await myToken.balanceOf(deployer.address);
    console.log(`Deployer balance after minting: ${deployerBalance} tokens`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
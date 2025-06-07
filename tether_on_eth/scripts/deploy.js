// Deploying contract with account: 0x15F30C25727c8FD6BbAC0F338A6fe1BDE9D4d391
// Token deployed to: 0x58B0FB168aEa62D8276AE96090b503FfD75ac882

async function main() {    
  const tokenAmount = 1000000;
    const decimals = 18;
    const initialSupply = ethers.parseUnits(tokenAmount.toString(), decimals);
    
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contract with account:", deployer.address);
    const myToken = await ethers.deployContract("USDZ", [initialSupply]);
    
    await myToken.waitForDeployment();
    console.log("Token deployed to:", await myToken.getAddress());
}



// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
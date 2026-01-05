const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 QBS Token Setup Script");
  console.log("========================");
  
  const contractAddress = process.argv[2];
  if (!contractAddress) {
    console.error("❌ Please provide contract address as argument");
    console.log("Usage: npx hardhat run scripts/setup.cjs --network sepolia 0xYourContractAddress");
    process.exit(1);
  }
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // Connect to the deployed contract
  const QBSToken = await ethers.getContractFactory("QBSToken");
  const qbsToken = QBSToken.attach(contractAddress);
  
  console.log("🔗 Connected to QBS Token at:", contractAddress);
  
  try {
    // Check contract info
    const name = await qbsToken.name();
    const symbol = await qbsToken.symbol();
    const totalSupply = await qbsToken.totalSupply();
    const maxSupply = await qbsToken.MAX_SUPPLY();
    
    console.log("\n📊 Contract Status:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Total Supply:", ethers.formatEther(totalSupply), "QBS");
    console.log("   Max Supply:", ethers.formatEther(maxSupply), "QBS");
    
    // Check if deployer is authorized miner
    const isAuthorized = await qbsToken.isAuthorizedMiner(deployer.address);
    console.log("   Deployer is authorized miner:", isAuthorized);
    
    if (!isAuthorized) {
      console.log("\n🔐 Authorizing deployer as miner...");
      const authTx = await qbsToken.authorizeMiner(deployer.address);
      await authTx.wait();
      console.log("✅ Deployer authorized as miner");
    }
    
    // Get deployer balance
    const balance = await qbsToken.balanceOf(deployer.address);
    console.log("   Deployer QBS balance:", ethers.formatEther(balance), "QBS");
    
    // Test minting if balance is low
    if (balance < ethers.parseEther("0.001")) {
      console.log("\n🧪 Minting test tokens...");
      const testAmount = ethers.parseEther("0.01"); // 0.01 QBS
      const mintTx = await qbsToken.mintMiningReward(
        deployer.address,
        testAmount,
        "SETUP-TEST-001",
        "B"
      );
      await mintTx.wait();
      console.log("✅ Test tokens minted");
      
      const newBalance = await qbsToken.balanceOf(deployer.address);
      console.log("   New balance:", ethers.formatEther(newBalance), "QBS");
    }
    
    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📝 Configuration for networkConfig.ts:");
    console.log(`${network.chainId}: '${contractAddress}', // ${network.name}`);
    
    console.log("\n🚀 Ready to use!");
    console.log("Your QBS token contract is configured and ready for mining rewards.");
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    
    if (error.message.includes("Ownable")) {
      console.log("\n💡 Tip: Make sure you're using the wallet that deployed the contract");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });
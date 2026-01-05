const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting QBS Token deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // Deploy the QBS Token contract
  console.log("🔨 Deploying QBS Token contract...");
  const QBSToken = await ethers.getContractFactory("QBSToken");
  
  // Deploy with the deployer as the initial owner
  const qbsToken = await QBSToken.deploy(deployer.address);
  await qbsToken.waitForDeployment();
  
  const contractAddress = await qbsToken.getAddress();
  console.log("✅ QBS Token deployed to:", contractAddress);
  
  // Verify deployment by checking some contract properties
  const name = await qbsToken.name();
  const symbol = await qbsToken.symbol();
  const decimals = await qbsToken.decimals();
  const totalSupply = await qbsToken.totalSupply();
  const maxSupply = await qbsToken.MAX_SUPPLY();
  
  console.log("\n📊 Contract Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Initial Supply:", ethers.formatEther(totalSupply), "QBS");
  console.log("   Max Supply:", ethers.formatEther(maxSupply), "QBS");
  
  // Authorize the deployer as a miner for testing
  console.log("\n🔐 Authorizing deployer as miner...");
  const authTx = await qbsToken.authorizeMiner(deployer.address);
  await authTx.wait();
  console.log("✅ Deployer authorized as miner");
  
  // Test minting a small reward
  console.log("\n🧪 Testing mining reward...");
  const testAmount = ethers.parseEther("0.001"); // 0.001 QBS
  const mintTx = await qbsToken.mintMiningReward(
    deployer.address,
    testAmount,
    "TEST-BLOCK-001",
    "A"
  );
  await mintTx.wait();
  console.log("✅ Test mining reward minted successfully");
  
  const newBalance = await qbsToken.balanceOf(deployer.address);
  console.log("   New balance:", ethers.formatEther(newBalance), "QBS");
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Address:", contractAddress);
  console.log("🔗 Add this address to your networkConfig.ts file");
  
  // Network-specific explorer URLs
  const explorerUrls = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
    1337: "http://localhost:8545"
  };
  
  const explorerUrl = explorerUrls[network.chainId.toString()];
  if (explorerUrl && network.chainId !== 1337n) {
    console.log("🔍 View on Explorer:", `${explorerUrl}/address/${contractAddress}`);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    timestamp: new Date().toISOString(),
    transactionHash: qbsToken.deploymentTransaction()?.hash
  };
  
  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update services/networkConfig.ts with the contract address");
  console.log("2. Verify the contract on the block explorer (optional)");
  console.log("3. Test the integration with your application");
  console.log("4. Authorize additional miners if needed");
  
  if (network.chainId === 11155111n || network.chainId === 80001n) {
    console.log("\n🧪 Testnet Deployment Complete!");
    console.log("You can now test the full cryptocurrency functionality.");
  } else if (network.chainId === 1n || network.chainId === 137n) {
    console.log("\n🚀 Mainnet Deployment Complete!");
    console.log("⚠️  Remember to get a security audit before going live!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
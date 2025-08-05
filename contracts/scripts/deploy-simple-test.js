const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Deploying SimpleTest contract to Hedera testnet...");
  
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your private key configuration.");
  }
  
  const deployer = signers[0];
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  if (balance < ethers.parseEther("1")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deployment.");
  }

  // Deploy SimpleTest contract
  console.log("\n📦 Deploying SimpleTest contract...");
  const SimpleTest = await ethers.getContractFactory("SimpleTest");
  
  const simpleTest = await SimpleTest.deploy("Hello Hedera Testnet!", {
    gasLimit: 1000000,
    gasPrice: 370000000000 // 370 gwei
  });
  
  console.log("⏳ Deployment transaction sent:", simpleTest.deploymentTransaction().hash);
  
  await simpleTest.waitForDeployment();
  
  const contractAddress = await simpleTest.getAddress();
  console.log("✅ SimpleTest deployed to:", contractAddress);

  // Test contract interaction
  console.log("\n🔧 Testing contract interaction...");
  
  try {
    const message = await simpleTest.getMessage();
    console.log("📝 Message:", message);
    
    const number = await simpleTest.getNumber();
    console.log("🔢 Number:", number.toString());
    
    const owner = await simpleTest.getOwner();
    console.log("👤 Owner:", owner);
    
    const blockNumber = await simpleTest.getBlockNumber();
    console.log("📦 Block number:", blockNumber.toString());
    
    const timestamp = await simpleTest.getTimestamp();
    console.log("⏰ Timestamp:", timestamp.toString());
    
    console.log("\n✅ Contract interaction successful!");
    
    // Test contract update
    console.log("\n📝 Testing contract update...");
    const updateTx = await simpleTest.setMessage("Updated message on Hedera!", {
      gasLimit: 100000,
      gasPrice: 370000000000
    });
    
    console.log("⏳ Update transaction sent:", updateTx.hash);
    await updateTx.wait();
    console.log("✅ Message updated");
    
    const newMessage = await simpleTest.getMessage();
    console.log("📝 New message:", newMessage);
    
  } catch (error) {
    console.error("❌ Contract interaction failed:", error.message);
  }

  console.log("\n🎉 SimpleTest deployment completed!");
  console.log(`🔗 View on explorer: https://hashscan.io/testnet/contract/${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: "Hedera Testnet",
    chainId: 296,
    contractAddress: contractAddress,
    deploymentHash: simpleTest.deploymentTransaction().hash,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  
  const fs = require("fs");
  const path = require("path");
  
  const outputFile = path.join(__dirname, "../deployments/simple-test-hedera.json");
  const outputDir = path.dirname(outputFile);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${outputFile}`);
  
  return deploymentInfo;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;

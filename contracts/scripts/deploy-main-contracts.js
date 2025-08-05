const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying main trading contracts to Hedera testnet...");
  
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your private key configuration.");
  }
  
  const deployer = signers[0];
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  if (balance < ethers.parseEther("10")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deployment.");
  }

  const deployedContracts = {};

  try {
    // Step 1: Deploy Stock Token Factory
    console.log("\n📦 Step 1: Deploying NigerianStockTokenFactory...");
    const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
    const factory = await NigerianStockTokenFactory.deploy(deployer.address, {
      gasLimit: 8000000,
      gasPrice: 370000000000 // 370 gwei
    });
    
    console.log("⏳ Factory deployment transaction:", factory.deploymentTransaction().hash);
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    deployedContracts.factory = factoryAddress;
    console.log("✅ NigerianStockTokenFactory deployed to:", factoryAddress);

    // Step 2: Deploy NGN Stablecoin
    console.log("\n📦 Step 2: Deploying NGN Stablecoin...");
    const NGNStablecoin = await ethers.getContractFactory("NGNStablecoin");
    
    const stablecoinConfig = {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      decimals: 18,
      maxSupply: ethers.parseEther("1000000000"), // 1 billion NGN
      mintingCap: ethers.parseEther("10000000"), // 10 million NGN daily cap
      lastMintReset: 0,
      currentDayMinted: 0,
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true
    };

    const ngnStablecoin = await NGNStablecoin.deploy(deployer.address, stablecoinConfig, {
      gasLimit: 8000000,
      gasPrice: 370000000000
    });
    
    console.log("⏳ NGN deployment transaction:", ngnStablecoin.deploymentTransaction().hash);
    await ngnStablecoin.waitForDeployment();
    
    const ngnStablecoinAddress = await ngnStablecoin.getAddress();
    deployedContracts.ngnStablecoin = ngnStablecoinAddress;
    console.log("✅ NGN Stablecoin deployed to:", ngnStablecoinAddress);

    // Step 3: Deploy StockNGNDEX
    console.log("\n📦 Step 3: Deploying StockNGNDEX...");
    const StockNGNDEX = await ethers.getContractFactory("StockNGNDEX");
    
    const dexConfig = {
      defaultFeeRate: 30, // 0.3%
      maxPriceImpact: 1000, // 10%
      minLiquidity: ethers.parseEther("1000"), // 1000 NGN minimum
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false
    };

    const stockNGNDEX = await StockNGNDEX.deploy(ngnStablecoinAddress, deployer.address, dexConfig, {
      gasLimit: 8000000,
      gasPrice: 370000000000
    });
    
    console.log("⏳ DEX deployment transaction:", stockNGNDEX.deploymentTransaction().hash);
    await stockNGNDEX.waitForDeployment();
    
    const stockNGNDEXAddress = await stockNGNDEX.getAddress();
    deployedContracts.stockNGNDEX = stockNGNDEXAddress;
    console.log("✅ StockNGNDEX deployed to:", stockNGNDEXAddress);

    // Step 4: Deploy TradingPairManager
    console.log("\n📦 Step 4: Deploying TradingPairManager...");
    const TradingPairManager = await ethers.getContractFactory("TradingPairManager");
    
    const managerConfig = {
      defaultFeeRate: 30, // 0.3%
      defaultLiquidityTarget: ethers.parseEther("50000"), // 50K NGN
      defaultRebalanceThreshold: 2000, // 20%
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400 // 24 hours
    };
    
    const tradingPairManager = await TradingPairManager.deploy(
      ngnStablecoinAddress,
      stockNGNDEXAddress,
      factoryAddress,
      deployer.address,
      managerConfig,
      {
        gasLimit: 8000000,
        gasPrice: 370000000000
      }
    );
    
    console.log("⏳ Manager deployment transaction:", tradingPairManager.deploymentTransaction().hash);
    await tradingPairManager.waitForDeployment();
    
    const tradingPairManagerAddress = await tradingPairManager.getAddress();
    deployedContracts.tradingPairManager = tradingPairManagerAddress;
    console.log("✅ TradingPairManager deployed to:", tradingPairManagerAddress);

    // Step 5: Configure contracts
    console.log("\n⚙️  Step 5: Configuring contracts...");
    
    // Grant DEX minter role for NGN stablecoin
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const minterTx = await ngnStablecoin.grantRole(MINTER_ROLE, stockNGNDEXAddress, {
      gasLimit: 200000,
      gasPrice: 370000000000
    });
    await minterTx.wait();
    console.log("✅ Granted minter role to DEX");

    // Grant trading pair manager admin role
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const adminTx = await stockNGNDEX.grantRole(ADMIN_ROLE, tradingPairManagerAddress, {
      gasLimit: 200000,
      gasPrice: 370000000000
    });
    await adminTx.wait();
    console.log("✅ Granted admin role to TradingPairManager");

    // Step 6: Save deployment information
    const network = await ethers.provider.getNetwork();
    const deploymentInfo = {
      network: {
        name: "Hedera Testnet",
        chainId: Number(network.chainId)
      },
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: deployedContracts,
      gasUsed: {
        estimated: "~15-20 HBAR total"
      }
    };

    // Save to deployments directory
    const outputDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `hedera-main-contracts-${deploymentInfo.network.chainId}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n📄 Deployment info saved to: ${outputFile}`);
    
    console.log("\n🎉 Main contracts deployed successfully on Hedera Testnet!");
    console.log("\n📋 Deployment Summary:");
    console.log(`   🏭 Factory: ${deployedContracts.factory}`);
    console.log(`   💰 NGN Stablecoin: ${deployedContracts.ngnStablecoin}`);
    console.log(`   🔄 DEX: ${deployedContracts.stockNGNDEX}`);
    console.log(`   📊 Trading Manager: ${deployedContracts.tradingPairManager}`);
    
    console.log("\n🔗 Explorer Links:");
    console.log(`   🏭 Factory: https://hashscan.io/testnet/contract/${deployedContracts.factory}`);
    console.log(`   💰 NGN Token: https://hashscan.io/testnet/contract/${deployedContracts.ngnStablecoin}`);
    console.log(`   🔄 DEX: https://hashscan.io/testnet/contract/${deployedContracts.stockNGNDEX}`);
    console.log(`   📊 Manager: https://hashscan.io/testnet/contract/${deployedContracts.tradingPairManager}`);
    
    return deploymentInfo;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Try getting more HBAR from the faucet: https://portal.hedera.com/faucet");
    } else if (error.message.includes("gas")) {
      console.log("💡 Try adjusting gas settings for Hedera");
    }
    
    throw error;
  }
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

import hre from "hardhat";
import { ethers } from "hardhat";
import { NIGERIAN_STOCKS } from "../src/constants/nigerian-stocks";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  network: any;
  deployer: string;
  factoryAddress: string;
  ngnStablecoin: string;
  stockNGNDEX: string;
  tradingPairManager: string;
  deployedAt: string;
  totalTokens: number;
  tokens: Array<{
    symbol: string;
    name: string;
    companyName: string;
    address: string;
    maxSupply: string;
  }>;
}

async function main(): Promise<DeploymentResult> {
  console.log("🚀 Starting complete deployment of Nigerian Stock Trading System on Hedera Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  if (balance < ethers.parseEther("10")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deployment.");
  }

  // Step 1: Deploy Stock Token Factory
  console.log("\n📦 Step 1: Deploying NigerianStockFactory...");
  const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
  const factory = await NigerianStockFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ NigerianStockFactory deployed to:", factoryAddress);

  // Step 2: Deploy NGN Stablecoin
  console.log("\n📦 Step 2: Deploying NGN Stablecoin...");
  const NGNStablecoin = await ethers.getContractFactory("NGNStablecoin");
  
  const stablecoinConfig = {
    name: "Nigerian Naira Stablecoin",
    symbol: "NGN",
    maxSupply: ethers.parseEther("1000000000"), // 1 billion NGN
    mintingCap: ethers.parseEther("10000000"), // 10 million NGN daily cap
    mintingEnabled: true,
    burningEnabled: true,
    transfersEnabled: true
  };

  const ngnStablecoin = await NGNStablecoin.deploy(deployer.address, stablecoinConfig);
  await ngnStablecoin.waitForDeployment();
  
  const ngnStablecoinAddress = await ngnStablecoin.getAddress();
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

  const stockNGNDEX = await StockNGNDEX.deploy(ngnStablecoinAddress, dexConfig);
  await stockNGNDEX.waitForDeployment();
  
  const stockNGNDEXAddress = await stockNGNDEX.getAddress();
  console.log("✅ StockNGNDEX deployed to:", stockNGNDEXAddress);

  // Step 4: Deploy TradingPairManager
  console.log("\n📦 Step 4: Deploying TradingPairManager...");
  const TradingPairManager = await ethers.getContractFactory("TradingPairManager");
  
  const tradingPairManager = await TradingPairManager.deploy(
    stockNGNDEXAddress,
    ngnStablecoinAddress,
    factoryAddress
  );
  await tradingPairManager.waitForDeployment();
  
  const tradingPairManagerAddress = await tradingPairManager.getAddress();
  console.log("✅ TradingPairManager deployed to:", tradingPairManagerAddress);

  // Step 5: Configure contracts
  console.log("\n⚙️  Step 5: Configuring contracts...");
  
  // Grant DEX minter role for NGN stablecoin
  const MINTER_ROLE = await ngnStablecoin.MINTER_ROLE();
  await ngnStablecoin.grantRole(MINTER_ROLE, stockNGNDEXAddress);
  console.log("✅ Granted minter role to DEX");

  // Grant trading pair manager admin role
  const ADMIN_ROLE = await stockNGNDEX.ADMIN_ROLE();
  await stockNGNDEX.grantRole(ADMIN_ROLE, tradingPairManagerAddress);
  console.log("✅ Granted admin role to TradingPairManager");

  // Step 6: Deploy Stock Tokens
  console.log(`\n📦 Step 6: Deploying ${NIGERIAN_STOCKS.length} stock tokens...`);
  
  // Prepare deployment data
  const deploymentData = NIGERIAN_STOCKS.map(stock => ({
    name: `${stock.name} Token`,
    symbol: stock.symbol,
    stockSymbol: stock.symbol,
    companyName: stock.name,
    maxSupply: ethers.parseUnits(stock.totalSupply, stock.decimals),
    initialSupply: "0" // Start with 0 initial supply
  }));

  // Deploy tokens in batches for Hedera
  const batchSize = 5;
  const deployedTokens: any[] = [];
  
  for (let i = 0; i < deploymentData.length; i += batchSize) {
    const batch = deploymentData.slice(i, i + batchSize);
    console.log(`\n📦 Deploying batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(deploymentData.length / batchSize)}...`);
    
    try {
      const tx = await factory.batchDeployStockTokens(batch, deployer.address);
      const receipt = await tx.wait();
      
      console.log(`✅ Batch deployed successfully. Gas used: ${receipt?.gasUsed}`);
      
      // Get deployed token addresses
      for (const stock of batch) {
        const tokenAddress = await factory.getTokenAddress(stock.stockSymbol);
        deployedTokens.push({
          symbol: stock.stockSymbol,
          name: stock.name,
          companyName: stock.companyName,
          address: tokenAddress,
          maxSupply: stock.maxSupply.toString()
        });
        console.log(`  📍 ${stock.stockSymbol}: ${tokenAddress}`);
      }
      
      // Add delay between batches for Hedera
      if (i + batchSize < deploymentData.length) {
        console.log("⏳ Waiting 5 seconds before next batch...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ Error deploying batch:`, error);
      throw error;
    }
  }

  // Verify all tokens were deployed
  const totalTokens = await factory.getTokenCount();
  console.log(`\n✅ Total tokens deployed: ${totalTokens}`);

  // Step 7: Save deployment information
  const network = await ethers.provider.getNetwork();
  const deploymentInfo: DeploymentResult = {
    network: {
      name: "Hedera Testnet",
      chainId: Number(network.chainId)
    },
    deployer: deployer.address,
    factoryAddress: factoryAddress,
    ngnStablecoin: ngnStablecoinAddress,
    stockNGNDEX: stockNGNDEXAddress,
    tradingPairManager: tradingPairManagerAddress,
    deployedAt: new Date().toISOString(),
    totalTokens: Number(totalTokens),
    tokens: deployedTokens
  };

  // Save to deployments directory
  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `hedera-testnet-complete-${deploymentInfo.network.chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${outputFile}`);
  
  // Step 8: Generate frontend configuration
  console.log("\n📄 Step 8: Generating frontend configuration...");
  await generateFrontendConfig(deploymentInfo);
  
  console.log("\n🎉 Complete Nigerian Stock Trading System deployed successfully on Hedera Testnet!");
  console.log("\n📋 Deployment Summary:");
  console.log(`   🏭 Factory: ${factoryAddress}`);
  console.log(`   💰 NGN Stablecoin: ${ngnStablecoinAddress}`);
  console.log(`   🔄 DEX: ${stockNGNDEXAddress}`);
  console.log(`   📊 Trading Manager: ${tradingPairManagerAddress}`);
  console.log(`   🏢 Stock Tokens: ${totalTokens}`);
  
  return deploymentInfo;
}

async function generateFrontendConfig(deploymentInfo: DeploymentResult) {
  // Update frontend contract configuration
  const frontendConfigPath = path.join(__dirname, "../../frontend/src/config/hedera-contracts.json");
  
  const frontendConfig = {
    chainId: deploymentInfo.network.chainId,
    name: deploymentInfo.network.name,
    factoryAddress: deploymentInfo.factoryAddress,
    ngnStablecoin: deploymentInfo.ngnStablecoin,
    stockNGNDEX: deploymentInfo.stockNGNDEX,
    tradingPairManager: deploymentInfo.tradingPairManager,
    blockExplorer: "https://hashscan.io/testnet",
    deployedAt: deploymentInfo.deployedAt,
    totalTokens: deploymentInfo.totalTokens,
    tokens: deploymentInfo.tokens.reduce((acc, token) => {
      acc[token.symbol] = token.address;
      return acc;
    }, {} as Record<string, string>)
  };

  // Ensure frontend config directory exists
  const frontendConfigDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log(`✅ Frontend config saved to: ${frontendConfigPath}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;

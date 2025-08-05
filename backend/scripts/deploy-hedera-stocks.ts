import hre from "hardhat";
import { ethers } from "hardhat";
import { NIGERIAN_STOCKS } from "../src/constants/nigerian-stocks";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment of Nigerian Stock Exchange tokens on Hedera Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  // Deploy factory contract first
  console.log("\n📦 Deploying NigerianStockFactory...");
  const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
  const factory = await NigerianStockFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ NigerianStockFactory deployed to:", factoryAddress);

  // Prepare deployment data from constants
  const deploymentData = NIGERIAN_STOCKS.map(stock => ({
    name: `${stock.name} Token`,
    symbol: stock.symbol,
    stockSymbol: stock.symbol,
    companyName: stock.name,
    maxSupply: ethers.parseUnits(stock.totalSupply, stock.decimals),
    initialSupply: "0" // Start with 0 initial supply
  }));

  console.log(`\n🏭 Deploying ${NIGERIAN_STOCKS.length} stock tokens...`);
  
  // Deploy all tokens in smaller batches for Hedera
  const batchSize = 5; // Smaller batches for Hedera
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
  
  // Save deployment information
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    factoryAddress: factoryAddress,
    deployedAt: new Date().toISOString(),
    totalTokens: Number(totalTokens),
    tokens: deployedTokens
  };

  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `nigerian-stocks-hedera-${deploymentInfo.network.chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${outputFile}`);
  console.log("\n🎉 All Nigerian Stock Exchange tokens deployed successfully on Hedera!");
  
  return {
    factory: factoryAddress,
    tokens: deployedTokens
  };
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

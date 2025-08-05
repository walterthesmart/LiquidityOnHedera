import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import fs from "fs";

// Load environment variables
dotenvConfig({ path: resolve(__dirname, "..", ".env") });

// Complete Nigerian stocks data (all 39 stocks for comprehensive deployment)
const NIGERIAN_STOCKS = [
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Token",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "Dangote Cement Plc",
    sector: "Industrial Goods",
    marketCap: 7710000000000, // 7.71 trillion NGN
  },
  {
    symbol: "MTNN",
    name: "MTN Nigeria Token",
    totalSupply: "20354513050000000000000000000", // ~20.35 billion * 10^18
    companyName: "MTN Nigeria Communications Plc",
    sector: "Telecommunications",
    marketCap: 4050000000000, // 4.05 trillion NGN
  },
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Token",
    totalSupply: "31396493786000000000000000000", // ~31.4 billion * 10^18
    companyName: "Zenith Bank Plc",
    sector: "Banking",
    marketCap: 1200000000000, // 1.2 trillion NGN
  },
  {
    symbol: "GTCO",
    name: "Guaranty Trust Token",
    totalSupply: "29431127496000000000000000000", // ~29.4 billion * 10^18
    companyName: "Guaranty Trust Holding Company Plc",
    sector: "Banking",
    marketCap: 1100000000000, // 1.1 trillion NGN
  },
  {
    symbol: "NB",
    name: "Nigerian Breweries Token",
    totalSupply: "8020000000000000000000000000", // 8.02 billion * 10^18
    companyName: "Nigerian Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 675000000000, // 675 billion NGN
  },
  {
    symbol: "ACCESS",
    name: "Access Holdings Token",
    totalSupply: "35687500000000000000000000000", // ~35.7 billion * 10^18
    companyName: "Access Holdings Plc",
    sector: "Banking",
    marketCap: 630000000000, // 630 billion NGN
  },
  {
    symbol: "BUACEMENT",
    name: "BUA Cement Token",
    totalSupply: "16000000000000000000000000000", // 16 billion * 10^18
    companyName: "BUA Cement Plc",
    sector: "Industrial Goods",
    marketCap: 1476000000000, // 1.476 trillion NGN
  },
  {
    symbol: "AIRTELAFRI",
    name: "Airtel Africa Token",
    totalSupply: "3700000000000000000000000000", // 3.7 billion * 10^18
    companyName: "Airtel Africa Plc",
    sector: "Telecommunications",
    marketCap: 1795000000000, // 1.795 trillion NGN
  },
  {
    symbol: "FBNH",
    name: "FBN Holdings Token",
    totalSupply: "35895292792000000000000000000", // ~35.9 billion * 10^18
    companyName: "FBN Holdings Plc",
    sector: "Banking",
    marketCap: 461000000000, // 461 billion NGN
  },
  {
    symbol: "UBA",
    name: "United Bank for Africa Token",
    totalSupply: "35130641814000000000000000000", // ~35.1 billion * 10^18
    companyName: "United Bank for Africa Plc",
    sector: "Banking",
    marketCap: 498000000000, // 498 billion NGN
  },
  {
    symbol: "NESTLE",
    name: "Nestle Nigeria Token",
    totalSupply: "1500000000000000000000000000", // 1.5 billion * 10^18
    companyName: "Nestle Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 1748000000000, // 1.748 trillion NGN
  },
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Token",
    totalSupply: "5882353000000000000000000000", // ~5.88 billion * 10^18
    companyName: "Seplat Energy Plc",
    sector: "Oil & Gas",
    marketCap: 2800000000000, // 2.8 trillion NGN
  },
  {
    symbol: "STANBIC",
    name: "Stanbic IBTC Holdings Token",
    totalSupply: "15557000000000000000000000000", // ~15.56 billion * 10^18
    companyName: "Stanbic IBTC Holdings Plc",
    sector: "Banking",
    marketCap: 797000000000, // 797 billion NGN
  },
  {
    symbol: "OANDO",
    name: "Oando Token",
    totalSupply: "8000000000000000000000000000", // 8 billion * 10^18
    companyName: "Oando Plc",
    sector: "Oil & Gas",
    marketCap: 67600000000, // 67.6 billion NGN
  },
  {
    symbol: "LAFARGE",
    name: "Lafarge Africa Token",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "Lafarge Africa Plc",
    sector: "Industrial Goods",
    marketCap: 395000000000, // 395 billion NGN
  },
  {
    symbol: "CONOIL",
    name: "Conoil Token",
    totalSupply: "1200000000000000000000000000", // 1.2 billion * 10^18
    companyName: "Conoil Plc",
    sector: "Oil & Gas",
    marketCap: 25000000000, // 25 billion NGN
  },
  {
    symbol: "WAPCO",
    name: "Lafarge Africa Token (WAPCO)",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "West African Portland Cement Company",
    sector: "Industrial Goods",
    marketCap: 395000000000, // 395 billion NGN
  },
  {
    symbol: "FLOURMILL",
    name: "Flour Mills of Nigeria Token",
    totalSupply: "39000000000000000000000000000", // 39 billion * 10^18
    companyName: "Flour Mills of Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 1170000000000, // 1.17 trillion NGN
  },
  {
    symbol: "PRESCO",
    name: "Presco Token",
    totalSupply: "8000000000000000000000000000", // 8 billion * 10^18
    companyName: "Presco Plc",
    sector: "Agriculture",
    marketCap: 800000000000, // 800 billion NGN
  },
  {
    symbol: "CADBURY",
    name: "Cadbury Nigeria Token",
    totalSupply: "1800000000000000000000000000", // 1.8 billion * 10^18
    companyName: "Cadbury Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 27000000000, // 27 billion NGN
  },
  {
    symbol: "GUINNESS",
    name: "Guinness Nigeria Token",
    totalSupply: "2000000000000000000000000000", // 2 billion * 10^18
    companyName: "Guinness Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 168000000000, // 168 billion NGN
  },
  {
    symbol: "INTBREW",
    name: "International Breweries Token",
    totalSupply: "9000000000000000000000000000", // 9 billion * 10^18
    companyName: "International Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 45000000000, // 45 billion NGN
  },
  {
    symbol: "CHAMPION",
    name: "Champion Breweries Token",
    totalSupply: "2500000000000000000000000000", // 2.5 billion * 10^18
    companyName: "Champion Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 7500000000, // 7.5 billion NGN
  },
  {
    symbol: "UNILEVER",
    name: "Unilever Nigeria Token",
    totalSupply: "6000000000000000000000000000", // 6 billion * 10^18
    companyName: "Unilever Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 90000000000, // 90 billion NGN
  },
  {
    symbol: "TRANSCORP",
    name: "Transnational Corporation Token",
    totalSupply: "40000000000000000000000000000", // 40 billion * 10^18
    companyName: "Transnational Corporation Plc",
    sector: "Conglomerates",
    marketCap: 40000000000, // 40 billion NGN
  },
  {
    symbol: "BUAFOODS",
    name: "BUA Foods Token",
    totalSupply: "18000000000000000000000000000", // 18 billion * 10^18
    companyName: "BUA Foods Plc",
    sector: "Consumer Goods",
    marketCap: 1800000000000, // 1.8 trillion NGN
  },
  {
    symbol: "DANGSUGAR",
    name: "Dangote Sugar Token",
    totalSupply: "12150000000000000000000000000", // 12.15 billion * 10^18
    companyName: "Dangote Sugar Refinery Plc",
    sector: "Consumer Goods",
    marketCap: 364500000000, // 364.5 billion NGN
  },
  {
    symbol: "UACN",
    name: "UAC of Nigeria Token",
    totalSupply: "2925000000000000000000000000", // 2.925 billion * 10^18
    companyName: "UAC of Nigeria Plc",
    sector: "Conglomerates",
    marketCap: 29250000000, // 29.25 billion NGN
  },
  {
    symbol: "PZ",
    name: "PZ Cussons Nigeria Token",
    totalSupply: "3970000000000000000000000000", // 3.97 billion * 10^18
    companyName: "PZ Cussons Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 59550000000, // 59.55 billion NGN
  },
  {
    symbol: "TOTAL",
    name: "TotalEnergies Marketing Nigeria Token",
    totalSupply: "339500000000000000000000000", // 339.5 million * 10^18
    companyName: "TotalEnergies Marketing Nigeria Plc",
    sector: "Oil & Gas",
    marketCap: 135800000000, // 135.8 billion NGN
  },
  {
    symbol: "ETERNA",
    name: "Eterna Token",
    totalSupply: "1305000000000000000000000000", // 1.305 billion * 10^18
    companyName: "Eterna Plc",
    sector: "Oil & Gas",
    marketCap: 13050000000, // 13.05 billion NGN
  },
  {
    symbol: "GEREGU",
    name: "Geregu Power Token",
    totalSupply: "2500000000000000000000000000", // 2.5 billion * 10^18
    companyName: "Geregu Power Plc",
    sector: "Utilities",
    marketCap: 1250000000000, // 1.25 trillion NGN
  },
  {
    symbol: "TRANSPOWER",
    name: "Transcorp Power Token",
    totalSupply: "7500000000000000000000000000", // 7.5 billion * 10^18
    companyName: "Transcorp Power Plc",
    sector: "Utilities",
    marketCap: 75000000000, // 75 billion NGN
  },
  {
    symbol: "FIDSON",
    name: "Fidson Healthcare Token",
    totalSupply: "2295000000000000000000000000", // 2.295 billion * 10^18
    companyName: "Fidson Healthcare Plc",
    sector: "Healthcare",
    marketCap: 137700000000, // 137.7 billion NGN
  },
  {
    symbol: "MAYBAKER",
    name: "May & Baker Nigeria Token",
    totalSupply: "1725000000000000000000000000", // 1.725 billion * 10^18
    companyName: "May & Baker Nigeria Plc",
    sector: "Healthcare",
    marketCap: 17250000000, // 17.25 billion NGN
  },
  {
    symbol: "OKOMUOIL",
    name: "The Okomu Oil Palm Company Token",
    totalSupply: "954000000000000000000000000", // 954 million * 10^18
    companyName: "The Okomu Oil Palm Company Plc",
    sector: "Agriculture",
    marketCap: 286200000000, // 286.2 billion NGN
  },
  {
    symbol: "LIVESTOCK",
    name: "Livestock Feeds Token",
    totalSupply: "3000000000000000000000000000", // 3 billion * 10^18
    companyName: "Livestock Feeds Plc",
    sector: "Agriculture",
    marketCap: 6000000000, // 6 billion NGN
  },
  {
    symbol: "CWG",
    name: "CWG Token",
    totalSupply: "2525000000000000000000000000", // 2.525 billion * 10^18
    companyName: "CWG Plc",
    sector: "ICT",
    marketCap: 25250000000, // 25.25 billion NGN
  },
  {
    symbol: "TRANSCOHOT",
    name: "Transcorp Hotels Token",
    totalSupply: "10240000000000000000000000000", // 10.24 billion * 10^18
    companyName: "Transcorp Hotels Plc",
    sector: "Services",
    marketCap: 512000000000, // 512 billion NGN
  },
];

interface DeploymentResult {
  network: string;
  chainId: string;
  deployer: string;
  factoryAddress: string;
  deployedAt: string;
  totalTokens: number;
  totalGasUsed: bigint;
  estimatedCostETH: string;
  batchSize: number;
  tokens: Array<{
    symbol: string;
    name: string;
    companyName: string;
    address: string;
    maxSupply: string;
    deploymentGas: string;
    sector: string;
  }>;
}

async function estimateGasCosts() {
  console.log("⛽ Estimating gas costs for Sepolia deployment...");

  const [deployer] = await ethers.getSigners();
  const gasPrice = await ethers.provider.getFeeData();

  console.log(`   Current gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} gwei`);
  console.log(
    `   Max fee per gas: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0n, "gwei")} gwei`
  );

  // Estimate factory deployment
  const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
  const deployTx = await NigerianStockTokenFactory.getDeployTransaction(deployer.address);
  const factoryGasEstimate = await ethers.provider.estimateGas(deployTx);

  // Estimate token deployment (approximate)
  const tokenGasEstimate = 2500000n; // Approximate gas per token deployment
  const totalTokens = BigInt(NIGERIAN_STOCKS.length);

  const totalGasEstimate = factoryGasEstimate + tokenGasEstimate * totalTokens;
  const estimatedCost = totalGasEstimate * (gasPrice.gasPrice || 0n);

  console.log(`   Factory deployment gas: ${factoryGasEstimate.toLocaleString()}`);
  console.log(`   Per token gas estimate: ${tokenGasEstimate.toLocaleString()}`);
  console.log(`   Total tokens to deploy: ${NIGERIAN_STOCKS.length}`);
  console.log(`   Total gas estimate: ${totalGasEstimate.toLocaleString()}`);
  console.log(`   Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);

  return {
    factoryGas: factoryGasEstimate,
    tokenGas: tokenGasEstimate,
    totalGas: totalGasEstimate,
    estimatedCost: ethers.formatEther(estimatedCost),
  };
}

async function deployToSepolia(): Promise<DeploymentResult> {
  console.log("\n🚀 Starting Sepolia deployment of Nigerian Stock Exchange tokens...");
  console.log("================================================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low ETH balance. You may need more ETH for deployment.");
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
  }

  // Estimate costs
  const gasEstimates = await estimateGasCosts();

  console.log("\n📦 Deploying NigerianStockTokenFactory...");

  const deploymentResult: DeploymentResult = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    factoryAddress: "",
    deployedAt: new Date().toISOString(),
    totalTokens: NIGERIAN_STOCKS.length,
    totalGasUsed: 0n,
    estimatedCostETH: gasEstimates.estimatedCost,
    batchSize: 5, // Deploy in batches of 5 to manage gas limits and avoid timeouts
    tokens: [],
  };

  let totalGasUsed = 0n;

  try {
    // Step 1: Deploy the Factory Contract
    const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
    const factory = await NigerianStockTokenFactory.deploy(deployer.address);
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    deploymentResult.factoryAddress = factoryAddress;

    const factoryDeployTx = factory.deploymentTransaction();
    if (factoryDeployTx) {
      const receipt = await factoryDeployTx.wait();
      if (receipt) {
        totalGasUsed += receipt.gasUsed;
        console.log(`   ✅ Factory deployed at: ${factoryAddress}`);
        console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   🔗 Transaction: https://sepolia.etherscan.io/tx/${receipt.hash}`);
      }
    }

    // Step 2: Deploy All Nigerian Stock Tokens in Batches
    console.log(`\n🏭 Deploying all ${NIGERIAN_STOCKS.length} Nigerian stock tokens...`);
    console.log(`   Using batch size of ${deploymentResult.batchSize} for gas optimization`);

    const batchSize = deploymentResult.batchSize;
    const totalBatches = Math.ceil(NIGERIAN_STOCKS.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, NIGERIAN_STOCKS.length);
      const batch = NIGERIAN_STOCKS.slice(startIndex, endIndex);

      console.log(
        `\n📦 Batch ${batchIndex + 1}/${totalBatches} (Tokens ${startIndex + 1}-${endIndex})`
      );
      console.log(`   Deploying ${batch.length} tokens in this batch...`);

      for (let i = 0; i < batch.length; i++) {
        const stock = batch[i];
        const globalIndex = startIndex + i;
        console.log(
          `\n   [${globalIndex + 1}/${NIGERIAN_STOCKS.length}] Deploying ${stock.symbol}...`
        );

        try {
          // Prepare stock metadata
          const stockMetadata = {
            symbol: stock.symbol,
            companyName: stock.companyName,
            sector: stock.sector,
            totalShares: stock.totalSupply,
            marketCap: stock.marketCap,
            isActive: true,
            lastUpdated: Math.floor(Date.now() / 1000),
          };

          // Deploy token through factory
          const tx = await factory.deployStockToken(
            stock.name,
            stock.symbol,
            stock.totalSupply,
            stockMetadata,
            deployer.address
          );

          const receipt = await tx.wait();
          if (receipt) {
            totalGasUsed += receipt.gasUsed;

            // Get the deployed token address from events
            const event = receipt.logs.find((log) => {
              try {
                const parsed = factory.interface.parseLog(log);
                return parsed?.name === "StockTokenDeployed";
              } catch {
                return false;
              }
            });

            if (event) {
              const parsedEvent = factory.interface.parseLog(event);
              const tokenAddress = parsedEvent?.args[1];

              deploymentResult.tokens.push({
                symbol: stock.symbol,
                name: stock.name,
                companyName: stock.companyName,
                address: tokenAddress,
                maxSupply: stock.totalSupply,
                deploymentGas: receipt.gasUsed.toString(),
                sector: stock.sector,
              });

              console.log(`      ✅ ${stock.symbol} deployed at: ${tokenAddress}`);
              console.log(`      🏢 Company: ${stock.companyName}`);
              console.log(`      🏷️  Sector: ${stock.sector}`);
              console.log(`      ⛽ Gas used: ${receipt.gasUsed.toString()}`);
              console.log(`      🔗 Transaction: https://sepolia.etherscan.io/tx/${receipt.hash}`);
            }
          }

          // Delay to avoid rate limiting and network congestion
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`      ❌ Failed to deploy ${stock.symbol}:`, error);
          // Continue with other tokens
        }
      }

      // Longer delay between batches to avoid overwhelming the network
      if (batchIndex < totalBatches - 1) {
        console.log(`\n   ⏳ Waiting 10 seconds before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    deploymentResult.totalGasUsed = totalGasUsed;

    // Step 3: Save deployment results
    await saveDeploymentResults(deploymentResult);

    // Step 4: Generate frontend configuration
    await generateFrontendConfig(deploymentResult);

    console.log(
      "\n🎉 Complete Nigerian Stock Exchange deployment on Sepolia completed successfully!"
    );
    console.log("================================================================================");
    console.log(`📊 Deployment Summary:`);
    console.log(`   Factory Address: ${deploymentResult.factoryAddress}`);
    console.log(
      `   Tokens Deployed: ${deploymentResult.tokens.length}/${deploymentResult.totalTokens}`
    );
    console.log(`   Batch Size Used: ${deploymentResult.batchSize} tokens per batch`);
    console.log(
      `   Total Batches: ${Math.ceil(deploymentResult.totalTokens / deploymentResult.batchSize)}`
    );
    console.log(`   Total Gas Used: ${totalGasUsed.toLocaleString()}`);
    console.log(`   Estimated Cost: ${deploymentResult.estimatedCostETH} ETH`);
    console.log(
      `   Block Explorer: https://sepolia.etherscan.io/address/${deploymentResult.factoryAddress}`
    );

    // Show sector breakdown
    const sectorCounts = deploymentResult.tokens.reduce(
      (acc, token) => {
        acc[token.sector] = (acc[token.sector] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`\n📈 Sector Breakdown:`);
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count} tokens`);
    });

    console.log("================================================================================");

    return deploymentResult;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

async function saveDeploymentResults(result: DeploymentResult) {
  const deploymentsDir = resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `nigerian-stocks-sepolia-${result.chainId}.json`;
  const filepath = resolve(deploymentsDir, filename);

  // Convert BigInt to string for JSON serialization
  const serializedResult = {
    ...result,
    totalGasUsed: result.totalGasUsed.toString(),
  };

  fs.writeFileSync(filepath, JSON.stringify(serializedResult, null, 2));
  console.log(`\n💾 Deployment results saved to: ${filepath}`);
}

async function generateFrontendConfig(result: DeploymentResult) {
  const frontendDir = resolve(__dirname, "..", "..", "front-end", "src", "config");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const sepoliaConfig = {
    chainId: parseInt(result.chainId),
    name: "Ethereum Sepolia Testnet",
    factoryAddress: result.factoryAddress,
    blockExplorer: "https://sepolia.etherscan.io",
    tokens: result.tokens.reduce(
      (acc, token) => {
        acc[token.symbol] = token.address;
        return acc;
      },
      {} as Record<string, string>
    ),
    deployedAt: result.deployedAt,
    totalTokens: result.tokens.length,
  };

  const configPath = resolve(frontendDir, "sepolia-contracts.json");
  fs.writeFileSync(configPath, JSON.stringify(sepoliaConfig, null, 2));
  console.log(`\n🎨 Frontend configuration saved to: ${configPath}`);
}

// Main execution
async function main() {
  try {
    await deployToSepolia();
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { deployToSepolia, NIGERIAN_STOCKS };

import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import fs from "fs";

// Load environment variables
dotenvConfig({ path: resolve(__dirname, "..", ".env") });

// Nigerian stocks data (all 39 stocks from the backend)
const NIGERIAN_STOCKS = [
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Plc",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "Dangote Cement Plc",
    sector: "Industrial Goods",
    marketCap: 7710000000000, // 7.71 trillion NGN
  },
  {
    symbol: "MTNN",
    name: "MTN Nigeria Communications Plc",
    totalSupply: "20354513050000000000000000000", // ~20.35 billion * 10^18
    companyName: "MTN Nigeria Communications Plc",
    sector: "Telecommunications",
    marketCap: 4050000000000, // 4.05 trillion NGN
  },
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Plc",
    totalSupply: "31396493786000000000000000000", // ~31.4 billion * 10^18
    companyName: "Zenith Bank Plc",
    sector: "Banking",
    marketCap: 1200000000000, // 1.2 trillion NGN
  },
  {
    symbol: "GTCO",
    name: "Guaranty Trust Holding Company Plc",
    totalSupply: "29431127496000000000000000000", // ~29.4 billion * 10^18
    companyName: "Guaranty Trust Holding Company Plc",
    sector: "Banking",
    marketCap: 1100000000000, // 1.1 trillion NGN
  },
  {
    symbol: "NB",
    name: "Nigerian Breweries Plc",
    totalSupply: "8020000000000000000000000000", // 8.02 billion * 10^18
    companyName: "Nigerian Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 675000000000, // 675 billion NGN
  },
  {
    symbol: "ACCESS",
    name: "Access Holdings Plc",
    totalSupply: "35687500000000000000000000000", // ~35.7 billion * 10^18
    companyName: "Access Holdings Plc",
    sector: "Banking",
    marketCap: 630000000000, // 630 billion NGN
  },
  {
    symbol: "BUACEMENT",
    name: "BUA Cement Plc",
    totalSupply: "16000000000000000000000000000", // 16 billion * 10^18
    companyName: "BUA Cement Plc",
    sector: "Industrial Goods",
    marketCap: 1476000000000, // 1.476 trillion NGN
  },
  {
    symbol: "AIRTELAFRI",
    name: "Airtel Africa Plc",
    totalSupply: "3700000000000000000000000000", // 3.7 billion * 10^18
    companyName: "Airtel Africa Plc",
    sector: "Telecommunications",
    marketCap: 1795000000000, // 1.795 trillion NGN
  },
  {
    symbol: "FBNH",
    name: "FBN Holdings Plc",
    totalSupply: "35895292792000000000000000000", // ~35.9 billion * 10^18
    companyName: "FBN Holdings Plc",
    sector: "Banking",
    marketCap: 461000000000, // 461 billion NGN
  },
  {
    symbol: "UBA",
    name: "United Bank for Africa Plc",
    totalSupply: "35130641814000000000000000000", // ~35.1 billion * 10^18
    companyName: "United Bank for Africa Plc",
    sector: "Banking",
    marketCap: 498000000000, // 498 billion NGN
  },
  {
    symbol: "NESTLE",
    name: "Nestle Nigeria Plc",
    totalSupply: "1500000000000000000000000000", // 1.5 billion * 10^18
    companyName: "Nestle Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 1748000000000, // 1.748 trillion NGN
  },
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Plc",
    totalSupply: "5882353000000000000000000000", // ~5.88 billion * 10^18
    companyName: "Seplat Energy Plc",
    sector: "Oil & Gas",
    marketCap: 2800000000000, // 2.8 trillion NGN
  },
  {
    symbol: "STANBIC",
    name: "Stanbic IBTC Holdings Plc",
    totalSupply: "15557000000000000000000000000", // ~15.56 billion * 10^18
    companyName: "Stanbic IBTC Holdings Plc",
    sector: "Banking",
    marketCap: 797000000000, // 797 billion NGN
  },
  {
    symbol: "OANDO",
    name: "Oando Plc",
    totalSupply: "8000000000000000000000000000", // 8 billion * 10^18
    companyName: "Oando Plc",
    sector: "Oil & Gas",
    marketCap: 67600000000, // 67.6 billion NGN
  },
  {
    symbol: "LAFARGE",
    name: "Lafarge Africa Plc",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "Lafarge Africa Plc",
    sector: "Industrial Goods",
    marketCap: 395000000000, // 395 billion NGN
  },
  {
    symbol: "CONOIL",
    name: "Conoil Plc",
    totalSupply: "1200000000000000000000000000", // 1.2 billion * 10^18
    companyName: "Conoil Plc",
    sector: "Oil & Gas",
    marketCap: 25000000000, // 25 billion NGN
  },
  {
    symbol: "WAPCO",
    name: "Lafarge Africa Plc (WAPCO)",
    totalSupply: "17040000000000000000000000000", // 17.04 billion * 10^18
    companyName: "West African Portland Cement Company",
    sector: "Industrial Goods",
    marketCap: 395000000000, // 395 billion NGN
  },
  {
    symbol: "FLOURMILL",
    name: "Flour Mills of Nigeria Plc",
    totalSupply: "39000000000000000000000000000", // 39 billion * 10^18
    companyName: "Flour Mills of Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 1170000000000, // 1.17 trillion NGN
  },
  {
    symbol: "PRESCO",
    name: "Presco Plc",
    totalSupply: "8000000000000000000000000000", // 8 billion * 10^18
    companyName: "Presco Plc",
    sector: "Agriculture",
    marketCap: 800000000000, // 800 billion NGN
  },
  {
    symbol: "CADBURY",
    name: "Cadbury Nigeria Plc",
    totalSupply: "1800000000000000000000000000", // 1.8 billion * 10^18
    companyName: "Cadbury Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 27000000000, // 27 billion NGN
  },
  {
    symbol: "GUINNESS",
    name: "Guinness Nigeria Plc",
    totalSupply: "2000000000000000000000000000", // 2 billion * 10^18
    companyName: "Guinness Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 168000000000, // 168 billion NGN
  },
  {
    symbol: "INTBREW",
    name: "International Breweries Plc",
    totalSupply: "9000000000000000000000000000", // 9 billion * 10^18
    companyName: "International Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 45000000000, // 45 billion NGN
  },
  {
    symbol: "CHAMPION",
    name: "Champion Breweries Plc",
    totalSupply: "2500000000000000000000000000", // 2.5 billion * 10^18
    companyName: "Champion Breweries Plc",
    sector: "Consumer Goods",
    marketCap: 7500000000, // 7.5 billion NGN
  },
  {
    symbol: "UNILEVER",
    name: "Unilever Nigeria Plc",
    totalSupply: "6000000000000000000000000000", // 6 billion * 10^18
    companyName: "Unilever Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 90000000000, // 90 billion NGN
  },
  {
    symbol: "TRANSCORP",
    name: "Transnational Corporation Plc",
    totalSupply: "40000000000000000000000000000", // 40 billion * 10^18
    companyName: "Transnational Corporation Plc",
    sector: "Conglomerates",
    marketCap: 40000000000, // 40 billion NGN
  },
  {
    symbol: "BUAFOODS",
    name: "BUA Foods Plc",
    totalSupply: "18000000000000000000000000000", // 18 billion * 10^18
    companyName: "BUA Foods Plc",
    sector: "Consumer Goods",
    marketCap: 1800000000000, // 1.8 trillion NGN
  },
  {
    symbol: "DANGSUGAR",
    name: "Dangote Sugar Refinery Plc",
    totalSupply: "12150000000000000000000000000", // 12.15 billion * 10^18
    companyName: "Dangote Sugar Refinery Plc",
    sector: "Consumer Goods",
    marketCap: 364500000000, // 364.5 billion NGN
  },
  {
    symbol: "UACN",
    name: "UAC of Nigeria Plc",
    totalSupply: "2925000000000000000000000000", // 2.925 billion * 10^18
    companyName: "UAC of Nigeria Plc",
    sector: "Conglomerates",
    marketCap: 29250000000, // 29.25 billion NGN
  },
  {
    symbol: "PZ",
    name: "PZ Cussons Nigeria Plc",
    totalSupply: "3970000000000000000000000000", // 3.97 billion * 10^18
    companyName: "PZ Cussons Nigeria Plc",
    sector: "Consumer Goods",
    marketCap: 59550000000, // 59.55 billion NGN
  },
  {
    symbol: "TOTAL",
    name: "TotalEnergies Marketing Nigeria Plc",
    totalSupply: "339500000000000000000000000", // 339.5 million * 10^18
    companyName: "TotalEnergies Marketing Nigeria Plc",
    sector: "Oil & Gas",
    marketCap: 135800000000, // 135.8 billion NGN
  },
  {
    symbol: "ETERNA",
    name: "Eterna Plc",
    totalSupply: "1305000000000000000000000000", // 1.305 billion * 10^18
    companyName: "Eterna Plc",
    sector: "Oil & Gas",
    marketCap: 13050000000, // 13.05 billion NGN
  },
  {
    symbol: "GEREGU",
    name: "Geregu Power Plc",
    totalSupply: "2500000000000000000000000000", // 2.5 billion * 10^18
    companyName: "Geregu Power Plc",
    sector: "Utilities",
    marketCap: 1250000000000, // 1.25 trillion NGN
  },
  {
    symbol: "TRANSPOWER",
    name: "Transcorp Power Plc",
    totalSupply: "7500000000000000000000000000", // 7.5 billion * 10^18
    companyName: "Transcorp Power Plc",
    sector: "Utilities",
    marketCap: 75000000000, // 75 billion NGN
  },
  {
    symbol: "FIDSON",
    name: "Fidson Healthcare Plc",
    totalSupply: "2295000000000000000000000000", // 2.295 billion * 10^18
    companyName: "Fidson Healthcare Plc",
    sector: "Healthcare",
    marketCap: 137700000000, // 137.7 billion NGN
  },
  {
    symbol: "MAYBAKER",
    name: "May & Baker Nigeria Plc",
    totalSupply: "1725000000000000000000000000", // 1.725 billion * 10^18
    companyName: "May & Baker Nigeria Plc",
    sector: "Healthcare",
    marketCap: 17250000000, // 17.25 billion NGN
  },
  {
    symbol: "OKOMUOIL",
    name: "The Okomu Oil Palm Company Plc",
    totalSupply: "954000000000000000000000000", // 954 million * 10^18
    companyName: "The Okomu Oil Palm Company Plc",
    sector: "Agriculture",
    marketCap: 286200000000, // 286.2 billion NGN
  },
  {
    symbol: "LIVESTOCK",
    name: "Livestock Feeds Plc",
    totalSupply: "3000000000000000000000000000", // 3 billion * 10^18
    companyName: "Livestock Feeds Plc",
    sector: "Agriculture",
    marketCap: 6000000000, // 6 billion NGN
  },
  {
    symbol: "CWG",
    name: "CWG Plc",
    totalSupply: "2525000000000000000000000000", // 2.525 billion * 10^18
    companyName: "CWG Plc",
    sector: "ICT",
    marketCap: 25250000000, // 25.25 billion NGN
  },
  {
    symbol: "TRANSCOHOT",
    name: "Transcorp Hotels Plc",
    totalSupply: "10240000000000000000000000000", // 10.24 billion * 10^18
    companyName: "Transcorp Hotels Plc",
    sector: "Services",
    marketCap: 512000000000, // 512 billion NGN
  },
];

interface DeploymentResult {
  factoryAddress: string;
  deployedTokens: {
    symbol: string;
    name: string;
    address: string;
    totalSupply: string;
  }[];
  network: string;
  deployer: string;
  gasUsed: string;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Nigerian Stock Token deployment on Bitfinity EVM...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📋 Deployment Details:");
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(
    `   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );

  let totalGasUsed = 0n;
  const deploymentResult: DeploymentResult = {
    factoryAddress: "",
    deployedTokens: [],
    network: network.name,
    deployer: deployer.address,
    gasUsed: "0",
    timestamp: Date.now(),
  };

  try {
    // Step 1: Deploy the Factory Contract
    console.log("\n📦 Deploying NigerianStockTokenFactory...");
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
      }
    }

    // Step 2: Deploy Individual Stock Tokens
    console.log("\n🏭 Deploying Nigerian Stock Tokens...");

    for (let i = 0; i < NIGERIAN_STOCKS.length; i++) {
      const stock = NIGERIAN_STOCKS[i];
      console.log(`\n   [${i + 1}/${NIGERIAN_STOCKS.length}] Deploying ${stock.symbol}...`);

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

          // Get deployed token address
          const tokenAddress = await factory.getTokenAddress(stock.symbol);

          deploymentResult.deployedTokens.push({
            symbol: stock.symbol,
            name: stock.name,
            address: tokenAddress,
            totalSupply: stock.totalSupply,
          });

          console.log(`      ✅ ${stock.symbol} deployed at: ${tokenAddress}`);
          console.log(`      ⛽ Gas used: ${receipt.gasUsed.toString()}`);
        }
      } catch (error) {
        console.error(`      ❌ Failed to deploy ${stock.symbol}:`, error);
      }
    }

    // Step 3: Verify Factory Statistics
    console.log("\n📊 Verifying deployment...");
    const factoryStats = await factory.getFactoryStats();
    console.log(`   Total deployed tokens: ${factoryStats._totalDeployedTokens}`);
    console.log(`   Total market cap: ${factoryStats._totalMarketCap} NGN`);
    console.log(`   Total symbols: ${factoryStats._totalSymbols}`);

    // Step 4: Save deployment results
    deploymentResult.gasUsed = totalGasUsed.toString();

    const deploymentFile = `deployments/${network.name}-${Date.now()}.json`;
    const deploymentDir = resolve(__dirname, "..", "deployments");

    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(
      resolve(deploymentDir, `${network.name}-latest.json`),
      JSON.stringify(deploymentResult, null, 2)
    );

    fs.writeFileSync(
      resolve(deploymentDir, deploymentFile),
      JSON.stringify(deploymentResult, null, 2)
    );

    console.log("\n🎉 Deployment completed successfully!");
    console.log(`   📄 Results saved to: deployments/${network.name}-latest.json`);
    console.log(`   ⛽ Total gas used: ${totalGasUsed.toString()}`);
    console.log(`   💰 Estimated cost: ${ethers.formatEther(totalGasUsed * 20000000000n)} ETH`);

    // Step 5: Display summary
    console.log("\n📋 Deployment Summary:");
    console.log(`   🏭 Factory Address: ${factoryAddress}`);
    console.log(`   🪙 Tokens Deployed: ${deploymentResult.deployedTokens.length}`);
    console.log("\n   📜 Token Addresses:");

    deploymentResult.deployedTokens.forEach((token, index) => {
      console.log(`      ${index + 1}. ${token.symbol}: ${token.address}`);
    });
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

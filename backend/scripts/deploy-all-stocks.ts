import hre from "hardhat";
// @ts-ignore - Hardhat runtime environment extension
const ethers = hre.ethers;
import { NigerianStockFactory } from "../typechain-types";
import * as fs from "fs";
import * as path from "path";

// Nigerian Stock Exchange data - 38 stocks
const NIGERIAN_STOCKS = [
  {
    symbol: 'DANGCEM',
    name: 'Dangote Cement Token',
    companyName: 'Dangote Cement Plc',
    totalSupply: '17040000000000000000000000000', // 17.04 billion * 10^18
  },
  {
    symbol: 'MTNN',
    name: 'MTN Nigeria Token',
    companyName: 'MTN Nigeria Communications Plc',
    totalSupply: '20354513050000000000000000000', // ~20.35 billion * 10^18
  },
  {
    symbol: 'ZENITHBANK',
    name: 'Zenith Bank Token',
    companyName: 'Zenith Bank Plc',
    totalSupply: '31396493786000000000000000000', // ~31.4 billion * 10^18
  },
  {
    symbol: 'GTCO',
    name: 'GTCO Token',
    companyName: 'Guaranty Trust Holding Company Plc',
    totalSupply: '29431127496000000000000000000', // ~29.4 billion * 10^18
  },
  {
    symbol: 'NB',
    name: 'Nigerian Breweries Token',
    companyName: 'Nigerian Breweries Plc',
    totalSupply: '8020000000000000000000000000', // 8.02 billion * 10^18
  },
  {
    symbol: 'ACCESS',
    name: 'Access Holdings Token',
    companyName: 'Access Holdings Plc',
    totalSupply: '35687500000000000000000000000', // ~35.7 billion * 10^18
  },
  {
    symbol: 'BUACEMENT',
    name: 'BUA Cement Token',
    companyName: 'BUA Cement Plc',
    totalSupply: '16000000000000000000000000000', // 16 billion * 10^18
  },
  {
    symbol: 'AIRTELAFRI',
    name: 'Airtel Africa Token',
    companyName: 'Airtel Africa Plc',
    totalSupply: '3700000000000000000000000000', // 3.7 billion * 10^18
  },
  {
    symbol: 'FBNH',
    name: 'FBN Holdings Token',
    companyName: 'FBN Holdings Plc',
    totalSupply: '35895292792000000000000000000', // ~35.9 billion * 10^18
  },
  {
    symbol: 'UBA',
    name: 'UBA Token',
    companyName: 'United Bank for Africa Plc',
    totalSupply: '35130641814000000000000000000', // ~35.1 billion * 10^18
  },
  {
    symbol: 'NESTLE',
    name: 'Nestle Nigeria Token',
    companyName: 'Nestle Nigeria Plc',
    totalSupply: '1500000000000000000000000000', // 1.5 billion * 10^18
  },
  {
    symbol: 'SEPLAT',
    name: 'Seplat Energy Token',
    companyName: 'Seplat Energy Plc',
    totalSupply: '5882353000000000000000000000', // ~5.88 billion * 10^18
  },
  {
    symbol: 'STANBIC',
    name: 'Stanbic IBTC Token',
    companyName: 'Stanbic IBTC Holdings Plc',
    totalSupply: '15557000000000000000000000000', // ~15.56 billion * 10^18
  },
  {
    symbol: 'OANDO',
    name: 'Oando Token',
    companyName: 'Oando Plc',
    totalSupply: '8000000000000000000000000000', // 8 billion * 10^18
  },
  {
    symbol: 'LAFARGE',
    name: 'Lafarge Africa Token',
    companyName: 'Lafarge Africa Plc',
    totalSupply: '17040000000000000000000000000', // 17.04 billion * 10^18
  },
  {
    symbol: 'CONOIL',
    name: 'Conoil Token',
    companyName: 'Conoil Plc',
    totalSupply: '1200000000000000000000000000', // 1.2 billion * 10^18
  },
  {
    symbol: 'WAPCO',
    name: 'WAPCO Token',
    companyName: 'Lafarge Africa Plc (WAPCO)',
    totalSupply: '17040000000000000000000000000', // 17.04 billion * 10^18
  },
  {
    symbol: 'FLOURMILL',
    name: 'Flour Mills Token',
    companyName: 'Flour Mills of Nigeria Plc',
    totalSupply: '39000000000000000000000000000', // 39 billion * 10^18
  },
  {
    symbol: 'PRESCO',
    name: 'Presco Token',
    companyName: 'Presco Plc',
    totalSupply: '8000000000000000000000000000', // 8 billion * 10^18
  },
  {
    symbol: 'CADBURY',
    name: 'Cadbury Nigeria Token',
    companyName: 'Cadbury Nigeria Plc',
    totalSupply: '1800000000000000000000000000', // 1.8 billion * 10^18
  },
  {
    symbol: 'GUINNESS',
    name: 'Guinness Nigeria Token',
    companyName: 'Guinness Nigeria Plc',
    totalSupply: '2000000000000000000000000000', // 2 billion * 10^18
  },
  {
    symbol: 'INTBREW',
    name: 'International Breweries Token',
    companyName: 'International Breweries Plc',
    totalSupply: '9000000000000000000000000000', // 9 billion * 10^18
  },
  {
    symbol: 'CHAMPION',
    name: 'Champion Breweries Token',
    companyName: 'Champion Breweries Plc',
    totalSupply: '2500000000000000000000000000', // 2.5 billion * 10^18
  },
  {
    symbol: 'UNILEVER',
    name: 'Unilever Nigeria Token',
    companyName: 'Unilever Nigeria Plc',
    totalSupply: '6000000000000000000000000000', // 6 billion * 10^18
  },
  {
    symbol: 'TRANSCORP',
    name: 'Transcorp Token',
    companyName: 'Transnational Corporation Plc',
    totalSupply: '40000000000000000000000000000', // 40 billion * 10^18
  },
  {
    symbol: 'BUAFOODS',
    name: 'BUA Foods Token',
    companyName: 'BUA Foods Plc',
    totalSupply: '18000000000000000000000000000', // 18 billion * 10^18
  },
  {
    symbol: 'DANGSUGAR',
    name: 'Dangote Sugar Token',
    companyName: 'Dangote Sugar Refinery Plc',
    totalSupply: '12150000000000000000000000000', // 12.15 billion * 10^18
  },
  {
    symbol: 'UACN',
    name: 'UACN Token',
    companyName: 'UAC of Nigeria Plc',
    totalSupply: '2925000000000000000000000000', // 2.925 billion * 10^18
  },
  {
    symbol: 'PZ',
    name: 'PZ Cussons Token',
    companyName: 'PZ Cussons Nigeria Plc',
    totalSupply: '3970000000000000000000000000', // 3.97 billion * 10^18
  },
  {
    symbol: 'TOTAL',
    name: 'TotalEnergies Token',
    companyName: 'TotalEnergies Marketing Nigeria Plc',
    totalSupply: '339500000000000000000000000', // 339.5 million * 10^18
  },
  {
    symbol: 'ETERNA',
    name: 'Eterna Token',
    companyName: 'Eterna Plc',
    totalSupply: '1305000000000000000000000000', // 1.305 billion * 10^18
  },
  {
    symbol: 'GEREGU',
    name: 'Geregu Power Token',
    companyName: 'Geregu Power Plc',
    totalSupply: '2500000000000000000000000000', // 2.5 billion * 10^18
  },
  {
    symbol: 'TRANSPOWER',
    name: 'Transcorp Power Token',
    companyName: 'Transcorp Power Plc',
    totalSupply: '7500000000000000000000000000', // 7.5 billion * 10^18
  },
  {
    symbol: 'FIDSON',
    name: 'Fidson Healthcare Token',
    companyName: 'Fidson Healthcare Plc',
    totalSupply: '2295000000000000000000000000', // 2.295 billion * 10^18
  },
  {
    symbol: 'MAYBAKER',
    name: 'May & Baker Token',
    companyName: 'May & Baker Nigeria Plc',
    totalSupply: '1725000000000000000000000000', // 1.725 billion * 10^18
  },
  {
    symbol: 'OKOMUOIL',
    name: 'Okomu Oil Token',
    companyName: 'The Okomu Oil Palm Company Plc',
    totalSupply: '954000000000000000000000000', // 954 million * 10^18
  },
  {
    symbol: 'LIVESTOCK',
    name: 'Livestock Feeds Token',
    companyName: 'Livestock Feeds Plc',
    totalSupply: '3000000000000000000000000000', // 3 billion * 10^18
  },
  {
    symbol: 'CWG',
    name: 'CWG Token',
    companyName: 'CWG Plc',
    totalSupply: '2525000000000000000000000000', // 2.525 billion * 10^18
  },
  {
    symbol: 'TRANSCOHOT',
    name: 'Transcorp Hotels Token',
    companyName: 'Transcorp Hotels Plc',
    totalSupply: '10240000000000000000000000000', // 10.24 billion * 10^18
  }
];

async function main() {
  console.log("🚀 Starting deployment of Nigerian Stock Exchange tokens on Bitfinity EVM...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BTF");

  // Deploy factory contract first
  console.log("\n📦 Deploying NigerianStockFactory...");
  const NigerianStockFactory = await ethers.getContractFactory("NigerianStockFactory");
  const factory = await NigerianStockFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ NigerianStockFactory deployed to:", factoryAddress);

  // Prepare deployment data
  const deploymentData = NIGERIAN_STOCKS.map(stock => ({
    name: stock.name,
    symbol: stock.symbol,
    stockSymbol: stock.symbol,
    companyName: stock.companyName,
    maxSupply: stock.totalSupply,
    initialSupply: "0" // Start with 0 initial supply
  }));

  console.log(`\n🏭 Deploying ${NIGERIAN_STOCKS.length} stock tokens...`);
  
  // Deploy all tokens in batches to avoid gas limit issues
  const batchSize = 10;
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
          maxSupply: stock.maxSupply
        });
        console.log(`  📍 ${stock.stockSymbol}: ${tokenAddress}`);
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

  const outputFile = path.join(outputDir, `nigerian-stocks-${deploymentInfo.network.chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${outputFile}`);
  console.log("\n🎉 All Nigerian Stock Exchange tokens deployed successfully!");
  
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

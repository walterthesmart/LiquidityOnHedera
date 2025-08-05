const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Nigerian stocks data
const NIGERIAN_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement Plc', totalSupply: '17040000000', decimals: 18 },
  { symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', totalSupply: '20354513050', decimals: 18 },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', totalSupply: '31396493786', decimals: 18 },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding Company Plc', totalSupply: '29431127496', decimals: 18 },
  { symbol: 'NB', name: 'Nigerian Breweries Plc', totalSupply: '8020000000', decimals: 18 },
  { symbol: 'ACCESS', name: 'Access Holdings Plc', totalSupply: '35687500000', decimals: 18 },
  { symbol: 'BUACEMENT', name: 'BUA Cement Plc', totalSupply: '16000000000', decimals: 18 },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa Plc', totalSupply: '3700000000', decimals: 18 },
  { symbol: 'FBNH', name: 'FBN Holdings Plc', totalSupply: '35895292792', decimals: 18 },
  { symbol: 'UBA', name: 'United Bank for Africa Plc', totalSupply: '35130641814', decimals: 18 },
  { symbol: 'NESTLE', name: 'Nestle Nigeria Plc', totalSupply: '1500000000', decimals: 18 },
  { symbol: 'SEPLAT', name: 'Seplat Energy Plc', totalSupply: '5882353000', decimals: 18 },
  { symbol: 'STANBIC', name: 'Stanbic IBTC Holdings Plc', totalSupply: '15557000000', decimals: 18 },
  { symbol: 'OANDO', name: 'Oando Plc', totalSupply: '8000000000', decimals: 18 },
  { symbol: 'LAFARGE', name: 'Lafarge Africa Plc', totalSupply: '17040000000', decimals: 18 },
  { symbol: 'CONOIL', name: 'Conoil Plc', totalSupply: '1200000000', decimals: 18 },
  { symbol: 'WAPCO', name: 'Lafarge Africa Plc (WAPCO)', totalSupply: '17040000000', decimals: 18 },
  { symbol: 'FLOURMILL', name: 'Flour Mills of Nigeria Plc', totalSupply: '39000000000', decimals: 18 },
  { symbol: 'PRESCO', name: 'Presco Plc', totalSupply: '8000000000', decimals: 18 },
  { symbol: 'CADBURY', name: 'Cadbury Nigeria Plc', totalSupply: '1800000000', decimals: 18 },
  { symbol: 'GUINNESS', name: 'Guinness Nigeria Plc', totalSupply: '2000000000', decimals: 18 },
  { symbol: 'INTBREW', name: 'International Breweries Plc', totalSupply: '9000000000', decimals: 18 },
  { symbol: 'CHAMPION', name: 'Champion Breweries Plc', totalSupply: '2500000000', decimals: 18 },
  { symbol: 'UNILEVER', name: 'Unilever Nigeria Plc', totalSupply: '6000000000', decimals: 18 },
  { symbol: 'TRANSCORP', name: 'Transnational Corporation Plc', totalSupply: '40000000000', decimals: 18 },
  { symbol: 'BUAFOODS', name: 'BUA Foods Plc', totalSupply: '18000000000', decimals: 18 },
  { symbol: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', totalSupply: '12150000000', decimals: 18 },
  { symbol: 'UACN', name: 'UAC of Nigeria Plc', totalSupply: '2925000000', decimals: 18 },
  { symbol: 'PZ', name: 'PZ Cussons Nigeria Plc', totalSupply: '3970000000', decimals: 18 },
  { symbol: 'TOTAL', name: 'TotalEnergies Marketing Nigeria Plc', totalSupply: '339500000', decimals: 18 },
  { symbol: 'ETERNA', name: 'Eterna Plc', totalSupply: '1305000000', decimals: 18 },
  { symbol: 'GEREGU', name: 'Geregu Power Plc', totalSupply: '2500000000', decimals: 18 },
  { symbol: 'TRANSPOWER', name: 'Transcorp Power Plc', totalSupply: '7500000000', decimals: 18 },
  { symbol: 'FIDSON', name: 'Fidson Healthcare Plc', totalSupply: '2295000000', decimals: 18 },
  { symbol: 'MAYBAKER', name: 'May & Baker Nigeria Plc', totalSupply: '1725000000', decimals: 18 },
  { symbol: 'OKOMUOIL', name: 'The Okomu Oil Palm Company Plc', totalSupply: '954000000', decimals: 18 },
  { symbol: 'LIVESTOCK', name: 'Livestock Feeds Plc', totalSupply: '3000000000', decimals: 18 },
  { symbol: 'CWG', name: 'CWG Plc', totalSupply: '2525000000', decimals: 18 },
  { symbol: 'TRANSCOHOT', name: 'Transcorp Hotels Plc', totalSupply: '10240000000', decimals: 18 }
];

async function main() {
  console.log("🚀 Starting deployment of Nigerian Stock Trading System on Hedera Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  if (balance < ethers.parseEther("10")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deployment.");
  }

  // Step 1: Deploy Stock Token Factory
  console.log("\n📦 Step 1: Deploying NigerianStockTokenFactory...");
  const NigerianStockTokenFactory = await ethers.getContractFactory("NigerianStockTokenFactory");
  const factory = await NigerianStockTokenFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ NigerianStockTokenFactory deployed to:", factoryAddress);

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

  // Step 6: Deploy Stock Tokens (first 10 for testing)
  console.log(`\n📦 Step 6: Deploying first 10 stock tokens...`);
  
  const deployedTokens = [];
  const tokensToDeployFirst = NIGERIAN_STOCKS.slice(0, 10); // Deploy first 10 for testing
  
  for (let i = 0; i < tokensToDeployFirst.length; i++) {
    const stock = tokensToDeployFirst[i];
    console.log(`\n📦 Deploying ${i + 1}/10: ${stock.symbol}...`);
    
    try {
      const tx = await factory.deployStockToken(
        `${stock.name} Token`,
        stock.symbol,
        stock.symbol,
        stock.name,
        ethers.parseUnits(stock.totalSupply, stock.decimals),
        "0", // Start with 0 initial supply
        deployer.address
      );
      await tx.wait();
      
      const tokenAddress = await factory.getTokenAddress(stock.symbol);
      deployedTokens.push({
        symbol: stock.symbol,
        name: `${stock.name} Token`,
        companyName: stock.name,
        address: tokenAddress,
        maxSupply: ethers.parseUnits(stock.totalSupply, stock.decimals).toString()
      });
      console.log(`✅ ${stock.symbol}: ${tokenAddress}`);
      
      // Add delay between deployments
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error deploying ${stock.symbol}:`, error.message);
    }
  }

  // Verify tokens were deployed
  const totalTokens = await factory.getTokenCount();
  console.log(`\n✅ Total tokens deployed: ${totalTokens}`);
  
  // Step 7: Save deployment information
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
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

  const outputFile = path.join(outputDir, `hedera-testnet-${deploymentInfo.network.chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${outputFile}`);
  
  console.log("\n🎉 Nigerian Stock Trading System deployed successfully on Hedera Testnet!");
  console.log("\n📋 Deployment Summary:");
  console.log(`   🏭 Factory: ${factoryAddress}`);
  console.log(`   💰 NGN Stablecoin: ${ngnStablecoinAddress}`);
  console.log(`   🔄 DEX: ${stockNGNDEXAddress}`);
  console.log(`   📊 Trading Manager: ${tradingPairManagerAddress}`);
  console.log(`   🏢 Stock Tokens: ${totalTokens}`);
  
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

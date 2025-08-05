const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Nigerian stocks data
const NIGERIAN_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement Plc', totalSupply: '17040000000', decimals: 18, sector: 'Industrial Goods' },
  { symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', totalSupply: '20354513050', decimals: 18, sector: 'ICT' },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', totalSupply: '31396493786', decimals: 18, sector: 'Banking' },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding Company Plc', totalSupply: '29431127496', decimals: 18, sector: 'Banking' },
  { symbol: 'NB', name: 'Nigerian Breweries Plc', totalSupply: '8020000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'ACCESS', name: 'Access Holdings Plc', totalSupply: '35687500000', decimals: 18, sector: 'Banking' },
  { symbol: 'BUACEMENT', name: 'BUA Cement Plc', totalSupply: '16000000000', decimals: 18, sector: 'Industrial Goods' },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa Plc', totalSupply: '3700000000', decimals: 18, sector: 'ICT' },
  { symbol: 'FBNH', name: 'FBN Holdings Plc', totalSupply: '35895292792', decimals: 18, sector: 'Banking' },
  { symbol: 'UBA', name: 'United Bank for Africa Plc', totalSupply: '35130641814', decimals: 18, sector: 'Banking' },
  { symbol: 'NESTLE', name: 'Nestle Nigeria Plc', totalSupply: '1500000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'SEPLAT', name: 'Seplat Energy Plc', totalSupply: '5882353000', decimals: 18, sector: 'Oil & Gas' },
  { symbol: 'STANBIC', name: 'Stanbic IBTC Holdings Plc', totalSupply: '15557000000', decimals: 18, sector: 'Banking' },
  { symbol: 'OANDO', name: 'Oando Plc', totalSupply: '8000000000', decimals: 18, sector: 'Oil & Gas' },
  { symbol: 'LAFARGE', name: 'Lafarge Africa Plc', totalSupply: '17040000000', decimals: 18, sector: 'Industrial Goods' },
  { symbol: 'CONOIL', name: 'Conoil Plc', totalSupply: '1200000000', decimals: 18, sector: 'Oil & Gas' },
  { symbol: 'WAPCO', name: 'Lafarge Africa Plc (WAPCO)', totalSupply: '17040000000', decimals: 18, sector: 'Industrial Goods' },
  { symbol: 'FLOURMILL', name: 'Flour Mills of Nigeria Plc', totalSupply: '39000000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'PRESCO', name: 'Presco Plc', totalSupply: '8000000000', decimals: 18, sector: 'Agriculture' },
  { symbol: 'CADBURY', name: 'Cadbury Nigeria Plc', totalSupply: '1800000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'GUINNESS', name: 'Guinness Nigeria Plc', totalSupply: '2000000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'INTBREW', name: 'International Breweries Plc', totalSupply: '9000000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'CHAMPION', name: 'Champion Breweries Plc', totalSupply: '2500000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'UNILEVER', name: 'Unilever Nigeria Plc', totalSupply: '6000000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'TRANSCORP', name: 'Transnational Corporation Plc', totalSupply: '40000000000', decimals: 18, sector: 'Conglomerates' },
  { symbol: 'BUAFOODS', name: 'BUA Foods Plc', totalSupply: '18000000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', totalSupply: '12150000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'UACN', name: 'UAC of Nigeria Plc', totalSupply: '2925000000', decimals: 18, sector: 'Conglomerates' },
  { symbol: 'PZ', name: 'PZ Cussons Nigeria Plc', totalSupply: '3970000000', decimals: 18, sector: 'Consumer Goods' },
  { symbol: 'TOTAL', name: 'TotalEnergies Marketing Nigeria Plc', totalSupply: '339500000', decimals: 18, sector: 'Oil & Gas' },
  { symbol: 'ETERNA', name: 'Eterna Plc', totalSupply: '1305000000', decimals: 18, sector: 'Oil & Gas' },
  { symbol: 'GEREGU', name: 'Geregu Power Plc', totalSupply: '2500000000', decimals: 18, sector: 'Utilities' },
  { symbol: 'TRANSPOWER', name: 'Transcorp Power Plc', totalSupply: '7500000000', decimals: 18, sector: 'Utilities' },
  { symbol: 'FIDSON', name: 'Fidson Healthcare Plc', totalSupply: '2295000000', decimals: 18, sector: 'Healthcare' },
  { symbol: 'MAYBAKER', name: 'May & Baker Nigeria Plc', totalSupply: '1725000000', decimals: 18, sector: 'Healthcare' },
  { symbol: 'OKOMUOIL', name: 'The Okomu Oil Palm Company Plc', totalSupply: '954000000', decimals: 18, sector: 'Agriculture' },
  { symbol: 'LIVESTOCK', name: 'Livestock Feeds Plc', totalSupply: '3000000000', decimals: 18, sector: 'Agriculture' },
  { symbol: 'CWG', name: 'CWG Plc', totalSupply: '2525000000', decimals: 18, sector: 'ICT' }
];

// Deployed factory address
const FACTORY_ADDRESS = "0x01Ea5f246258FA083D0fA98F60379f44588Cc001";

async function main() {
  console.log("🏢 Deploying all 38 Nigerian stock tokens to Hedera testnet...");
  
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your private key configuration.");
  }
  
  const deployer = signers[0];
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");

  if (balance < ethers.parseEther("50")) {
    console.warn("⚠️  Warning: Low balance. You may need more HBAR for deploying all tokens.");
  }

  // Connect to the deployed factory
  const factoryABI = [
    "function deployStockToken(string calldata _name, string calldata _symbol, uint256 _initialSupply, tuple(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap, bool isActive, uint256 lastUpdated) _stockMetadata, address _tokenAdmin) external returns (address)",
    "function getTokenAddress(string calldata _symbol) external view returns (address)",
    "function totalDeployedTokens() external view returns (uint256)",
    "function getAllDeployedSymbols() external view returns (string[] memory)"
  ];
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, deployer);
  
  console.log(`\n📦 Starting deployment of ${NIGERIAN_STOCKS.length} stock tokens...`);
  
  const deployedTokens = [];
  const failedDeployments = [];
  
  // Deploy tokens in batches to avoid overwhelming the network
  const batchSize = 5;
  
  for (let i = 0; i < NIGERIAN_STOCKS.length; i += batchSize) {
    const batch = NIGERIAN_STOCKS.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(NIGERIAN_STOCKS.length / batchSize);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} tokens)...`);
    
    for (const stock of batch) {
      console.log(`\n🏢 Deploying ${stock.symbol} - ${stock.name}...`);
      
      try {
        // Check if token already exists
        try {
          const existingAddress = await factory.getTokenAddress(stock.symbol);
          if (existingAddress !== "0x0000000000000000000000000000000000000000") {
            console.log(`✅ ${stock.symbol} already deployed at: ${existingAddress}`);
            deployedTokens.push({
              symbol: stock.symbol,
              name: stock.name,
              address: existingAddress,
              status: "already_deployed"
            });
            continue;
          }
        } catch (error) {
          // Token doesn't exist, proceed with deployment
        }
        
        // Prepare metadata
        const stockMetadata = {
          symbol: stock.symbol,
          companyName: stock.name,
          sector: stock.sector || "General", // Use stock sector or default
          totalShares: ethers.parseUnits(stock.totalSupply, stock.decimals),
          marketCap: ethers.parseEther("1000000"), // 1M NGN market cap
          isActive: true,
          lastUpdated: Math.floor(Date.now() / 1000)
        };
        
        // Deploy token
        const tx = await factory.deployStockToken(
          `${stock.name} Token`,
          stock.symbol,
          "0", // Initial supply
          stockMetadata,
          deployer.address,
          {
            gasLimit: 2000000,
            gasPrice: 370000000000 // 370 gwei
          }
        );
        
        console.log(`⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Get deployed token address
        const tokenAddress = await factory.getTokenAddress(stock.symbol);
        deployedTokens.push({
          symbol: stock.symbol,
          name: stock.name,
          address: tokenAddress,
          maxSupply: ethers.parseUnits(stock.totalSupply, stock.decimals).toString(),
          status: "newly_deployed",
          transactionHash: tx.hash
        });
        
        console.log(`✅ ${stock.symbol} deployed to: ${tokenAddress}`);
        
      } catch (error) {
        console.error(`❌ Error deploying ${stock.symbol}:`, error.message);
        failedDeployments.push({
          symbol: stock.symbol,
          name: stock.name,
          error: error.message
        });
      }
      
      // Add delay between deployments to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Longer delay between batches
    if (i + batchSize < NIGERIAN_STOCKS.length) {
      console.log("⏳ Waiting 10 seconds before next batch...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Get final statistics
  const totalTokens = await factory.totalDeployedTokens();
  console.log(`\n✅ Deployment completed!`);
  console.log(`📊 Total tokens in factory: ${totalTokens}`);
  console.log(`✅ Successfully deployed: ${deployedTokens.length}`);
  console.log(`❌ Failed deployments: ${failedDeployments.length}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: "Hedera Testnet",
    chainId: 296,
    factoryAddress: FACTORY_ADDRESS,
    deployedAt: new Date().toISOString(),
    totalTokensInFactory: Number(totalTokens),
    successfulDeployments: deployedTokens.length,
    failedDeployments: failedDeployments.length,
    deployedTokens: deployedTokens,
    failedTokens: failedDeployments
  };
  
  const outputDir = path.join(__dirname, "../deployments");
  const outputFile = path.join(outputDir, "hedera-stock-tokens-deployment.json");
  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${outputFile}`);
  
  console.log('\n🎉 Stock token deployment completed!');
  console.log('\n📋 Successfully Deployed Tokens:');
  deployedTokens.forEach(token => {
    console.log(`   🏢 ${token.symbol}: ${token.address}`);
  });
  
  if (failedDeployments.length > 0) {
    console.log('\n❌ Failed Deployments:');
    failedDeployments.forEach(token => {
      console.log(`   ❌ ${token.symbol}: ${token.error}`);
    });
  }
  
  console.log('\n🔗 View Factory on Hedera Explorer:');
  console.log(`   https://hashscan.io/testnet/contract/${FACTORY_ADDRESS}`);
  
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

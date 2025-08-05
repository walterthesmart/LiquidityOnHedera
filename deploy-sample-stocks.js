#!/usr/bin/env node

/**
 * Deploy Sample Stock Tokens to Hedera Testnet
 * 
 * This script deploys a few sample Nigerian stock tokens to test the system
 */

const { ethers } = require("ethers");
const fs = require("fs");

// Sample stocks to deploy
const SAMPLE_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement Plc', totalSupply: '17040000000' },
  { symbol: 'MTNN', name: 'MTN Nigeria Communications Plc', totalSupply: '20354513050' },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', totalSupply: '31396493786' },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding Company Plc', totalSupply: '29431127496' },
  { symbol: 'NB', name: 'Nigerian Breweries Plc', totalSupply: '8020000000' }
];

// Deployed contract addresses
const FACTORY_ADDRESS = "0xf867ace8Ed1F51f50EDc2A7DAe477Ac19cdaCF68";
const HEDERA_RPC = "https://testnet.hashio.io/api";

async function main() {
  console.log("🚀 Deploying sample stock tokens to Hedera testnet...");
  
  // Load environment variables
  require('dotenv').config();
  
  if (!process.env.BITFINITY_PRIVATE_KEY) {
    console.error("❌ BITFINITY_PRIVATE_KEY not found in environment variables");
    process.exit(1);
  }
  
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  const signer = new ethers.Wallet(process.env.BITFINITY_PRIVATE_KEY, provider);
  
  console.log("📝 Using account:", signer.address);
  
  const balance = await provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");
  
  // Factory ABI (simplified)
  const factoryABI = [
    "function deployStockToken(string calldata _name, string calldata _symbol, uint256 _initialSupply, tuple(string symbol, string companyName, uint256 marketCap, uint256 lastUpdated) _stockMetadata, address _tokenAdmin) external returns (address)",
    "function getTokenAddress(string calldata _symbol) external view returns (address)",
    "function totalDeployedTokens() external view returns (uint256)"
  ];
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
  
  console.log("\n📦 Deploying sample stock tokens...");
  
  const deployedTokens = [];
  
  for (let i = 0; i < SAMPLE_STOCKS.length; i++) {
    const stock = SAMPLE_STOCKS[i];
    console.log(`\n📦 Deploying ${i + 1}/${SAMPLE_STOCKS.length}: ${stock.symbol}...`);
    
    try {
      // Check if token already exists
      try {
        const existingAddress = await factory.getTokenAddress(stock.symbol);
        console.log(`✅ ${stock.symbol} already deployed at: ${existingAddress}`);
        deployedTokens.push({
          symbol: stock.symbol,
          name: stock.name,
          address: existingAddress
        });
        continue;
      } catch (error) {
        // Token doesn't exist, proceed with deployment
      }
      
      // Prepare metadata
      const stockMetadata = {
        symbol: stock.symbol,
        companyName: stock.name,
        marketCap: ethers.parseEther("1000000"), // 1M NGN market cap
        lastUpdated: Math.floor(Date.now() / 1000)
      };
      
      // Deploy token
      const tx = await factory.deployStockToken(
        `${stock.name} Token`,
        stock.symbol,
        "0", // Initial supply
        stockMetadata,
        signer.address,
        {
          gasLimit: 3000000,
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
        address: tokenAddress
      });
      
      console.log(`✅ ${stock.symbol} deployed to: ${tokenAddress}`);
      
      // Add delay between deployments
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Error deploying ${stock.symbol}:`, error.message);
    }
  }
  
  // Get total deployed tokens
  const totalTokens = await factory.totalDeployedTokens();
  console.log(`\n✅ Total tokens in factory: ${totalTokens}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: "Hedera Testnet",
    chainId: 296,
    factoryAddress: FACTORY_ADDRESS,
    deployedAt: new Date().toISOString(),
    totalTokens: Number(totalTokens),
    sampleTokens: deployedTokens
  };
  
  fs.writeFileSync('sample-stocks-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📄 Deployment info saved to: sample-stocks-deployment.json');
  
  console.log('\n🎉 Sample stock deployment completed!');
  console.log('\n📋 Deployed Tokens:');
  deployedTokens.forEach(token => {
    console.log(`   🏢 ${token.symbol}: ${token.address}`);
  });
  
  console.log('\n🔗 View on Hedera Explorer:');
  console.log(`   https://hashscan.io/testnet/account/${FACTORY_ADDRESS}`);
  
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

#!/usr/bin/env node

/**
 * Test Hedera Testnet Connection
 * 
 * This script tests the connection to deployed contracts on Hedera testnet
 */

const { ethers } = require("ethers");

// Deployed contract addresses
const CONTRACTS = {
  factory: "0xf867ace8Ed1F51f50EDc2A7DAe477Ac19cdaCF68",
  ngnStablecoin: "0x4bB9F94c2aBd8fd1BA789f8d7f7174e194330628",
  stockNGNDEX: "0x0A34513Cec5f80408B3d5d65F7E129A80adDdb59",
  tradingPairManager: "0xAeB0F58b0F7A01283175eF30BFFF618F872f960e"
};

const HEDERA_RPC = "https://testnet.hashio.io/api";

async function main() {
  console.log("🔍 Testing Hedera testnet connection...");
  
  // Setup provider
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  
  try {
    // Test network connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Test each contract
    console.log("\n📋 Testing deployed contracts...");
    
    // Test Factory
    console.log("\n🏭 Testing NigerianStockTokenFactory...");
    const factoryABI = [
      "function totalDeployedTokens() external view returns (uint256)",
      "function getAllDeployedSymbols() external view returns (string[] memory)"
    ];
    const factory = new ethers.Contract(CONTRACTS.factory, factoryABI, provider);
    
    try {
      const totalTokens = await factory.totalDeployedTokens();
      console.log(`   📊 Total deployed tokens: ${totalTokens}`);
      
      const symbols = await factory.getAllDeployedSymbols();
      console.log(`   🏢 Deployed symbols: ${symbols.join(', ') || 'None yet'}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test NGN Stablecoin
    console.log("\n💰 Testing NGN Stablecoin...");
    const erc20ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function totalSupply() external view returns (uint256)",
      "function decimals() external view returns (uint8)"
    ];
    const ngnToken = new ethers.Contract(CONTRACTS.ngnStablecoin, erc20ABI, provider);
    
    try {
      const name = await ngnToken.name();
      const symbol = await ngnToken.symbol();
      const totalSupply = await ngnToken.totalSupply();
      const decimals = await ngnToken.decimals();
      
      console.log(`   📛 Name: ${name}`);
      console.log(`   🔤 Symbol: ${symbol}`);
      console.log(`   📊 Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
      console.log(`   🔢 Decimals: ${decimals}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test DEX
    console.log("\n🔄 Testing StockNGNDEX...");
    const dexABI = [
      "function getAllStockTokens() external view returns (address[] memory)"
    ];
    const dex = new ethers.Contract(CONTRACTS.stockNGNDEX, dexABI, provider);
    
    try {
      const stockTokens = await dex.getAllStockTokens();
      console.log(`   🏢 Supported stock tokens: ${stockTokens.length}`);
      if (stockTokens.length > 0) {
        console.log(`   📍 First token: ${stockTokens[0]}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test Trading Pair Manager
    console.log("\n📊 Testing TradingPairManager...");
    const managerABI = [
      "function totalManagedPairs() external view returns (uint256)",
      "function getAllManagedTokens() external view returns (address[] memory)"
    ];
    const manager = new ethers.Contract(CONTRACTS.tradingPairManager, managerABI, provider);
    
    try {
      const totalPairs = await manager.totalManagedPairs();
      console.log(`   📊 Total managed pairs: ${totalPairs}`);
      
      const managedTokens = await manager.getAllManagedTokens();
      console.log(`   🏢 Managed tokens: ${managedTokens.length}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log("\n✅ Connection test completed!");
    console.log("\n🔗 Hedera Explorer Links:");
    console.log(`   🏭 Factory: https://hashscan.io/testnet/contract/${CONTRACTS.factory}`);
    console.log(`   💰 NGN Token: https://hashscan.io/testnet/contract/${CONTRACTS.ngnStablecoin}`);
    console.log(`   🔄 DEX: https://hashscan.io/testnet/contract/${CONTRACTS.stockNGNDEX}`);
    console.log(`   📊 Manager: https://hashscan.io/testnet/contract/${CONTRACTS.tradingPairManager}`);
    
    console.log("\n🚀 Next Steps:");
    console.log("   1. Deploy sample stock tokens: node deploy-sample-stocks.js");
    console.log("   2. Start frontend: cd front-end && npm run dev");
    console.log("   3. Connect wallet to Hedera testnet (Chain ID: 296)");
    console.log("   4. Test trading functionality");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    process.exit(1);
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

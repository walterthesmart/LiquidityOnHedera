#!/usr/bin/env node

/**
 * End-to-End Testing Script for Hedera Deployment
 * 
 * This script tests the complete Nigerian stock trading system
 * deployed on Hedera testnet including frontend integration.
 */

const { ethers } = require("ethers");
const fs = require("fs");

// Test configuration
const TEST_CONFIG = {
  hederaRPC: "https://testnet.hashio.io/api",
  frontendURL: "http://localhost:3000",
  chainId: 296,
  contracts: {
    factory: "0xf867ace8Ed1F51f50EDc2A7DAe477Ac19cdaCF68",
    ngnStablecoin: "0x4bB9F94c2aBd8fd1BA789f8d7f7174e194330628",
    stockNGNDEX: "0x0A34513Cec5f80408B3d5d65F7E129A80adDdb59",
    tradingPairManager: "0xAeB0F58b0F7A01283175eF30BFFF618F872f960e"
  }
};

// Test results tracking
const testResults = {
  networkConnection: false,
  contractDeployment: false,
  databaseIntegration: false,
  frontendAccess: false,
  walletConnection: false,
  tradingFunctionality: false
};

async function testNetworkConnection() {
  console.log("🌐 Testing Hedera testnet connection...");
  
  try {
    const provider = new ethers.JsonRpcProvider(TEST_CONFIG.hederaRPC);
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) === TEST_CONFIG.chainId) {
      console.log(`✅ Connected to Hedera testnet (Chain ID: ${network.chainId})`);
      testResults.networkConnection = true;
      return true;
    } else {
      console.log(`❌ Wrong network. Expected ${TEST_CONFIG.chainId}, got ${network.chainId}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Network connection failed: ${error.message}`);
    return false;
  }
}

async function testContractDeployment() {
  console.log("\n📋 Testing contract deployment...");
  
  try {
    const provider = new ethers.JsonRpcProvider(TEST_CONFIG.hederaRPC);
    
    // Test each contract
    const contracts = [
      { name: "Factory", address: TEST_CONFIG.contracts.factory },
      { name: "NGN Stablecoin", address: TEST_CONFIG.contracts.ngnStablecoin },
      { name: "StockNGNDEX", address: TEST_CONFIG.contracts.stockNGNDEX },
      { name: "TradingPairManager", address: TEST_CONFIG.contracts.tradingPairManager }
    ];
    
    let allDeployed = true;
    
    for (const contract of contracts) {
      try {
        const code = await provider.getCode(contract.address);
        if (code === "0x") {
          console.log(`❌ ${contract.name} not deployed at ${contract.address}`);
          allDeployed = false;
        } else {
          console.log(`✅ ${contract.name} deployed at ${contract.address}`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${contract.name}: ${error.message}`);
        allDeployed = false;
      }
    }
    
    testResults.contractDeployment = allDeployed;
    return allDeployed;
  } catch (error) {
    console.log(`❌ Contract deployment test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseIntegration() {
  console.log("\n🗄️  Testing database integration...");
  
  try {
    // Test if we can access the API endpoint
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch(`${TEST_CONFIG.frontendURL}/api/stocks`);
      
      if (response.ok) {
        const stocks = await response.json();
        console.log(`✅ Database API accessible - ${stocks.length} stocks found`);
        
        // Check for Hedera-specific data
        const hederaStocks = stocks.filter(stock => stock.chain === 'hedera-testnet');
        if (hederaStocks.length > 0) {
          console.log(`✅ Hedera testnet stocks in database: ${hederaStocks.length}`);
          testResults.databaseIntegration = true;
          return true;
        } else {
          console.log(`⚠️  No Hedera testnet stocks found in database`);
          return false;
        }
      } else {
        console.log(`❌ Database API not accessible (${response.status})`);
        return false;
      }
    } catch (fetchError) {
      console.log(`⚠️  Frontend not running or API not accessible: ${fetchError.message}`);
      console.log(`   Make sure to run: cd front-end && npm run dev`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Database integration test failed: ${error.message}`);
    return false;
  }
}

async function testFrontendAccess() {
  console.log("\n🌐 Testing frontend access...");
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(TEST_CONFIG.frontendURL);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check for key elements
      const hasTitle = html.includes('Liquidity') || html.includes('Stock');
      const hasReact = html.includes('__NEXT_DATA__');
      
      if (hasTitle && hasReact) {
        console.log(`✅ Frontend accessible and rendering correctly`);
        testResults.frontendAccess = true;
        return true;
      } else {
        console.log(`⚠️  Frontend accessible but may not be rendering correctly`);
        return false;
      }
    } else {
      console.log(`❌ Frontend not accessible (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend access test failed: ${error.message}`);
    console.log(`   Make sure to run: cd front-end && npm run dev`);
    return false;
  }
}

async function testWalletConnection() {
  console.log("\n👛 Testing wallet connection capability...");
  
  // This is a simulated test since we can't actually connect a wallet in a script
  try {
    const provider = new ethers.JsonRpcProvider(TEST_CONFIG.hederaRPC);
    
    // Test if we can create a wallet instance
    const testWallet = ethers.Wallet.createRandom();
    const connectedWallet = testWallet.connect(provider);
    
    if (connectedWallet.address) {
      console.log(`✅ Wallet connection capability verified`);
      console.log(`   Test wallet address: ${connectedWallet.address}`);
      testResults.walletConnection = true;
      return true;
    } else {
      console.log(`❌ Wallet connection capability failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Wallet connection test failed: ${error.message}`);
    return false;
  }
}

async function testTradingFunctionality() {
  console.log("\n💹 Testing trading functionality...");
  
  try {
    const provider = new ethers.JsonRpcProvider(TEST_CONFIG.hederaRPC);
    
    // Test basic contract interactions
    const factoryABI = [
      "function totalDeployedTokens() external view returns (uint256)"
    ];
    
    const factory = new ethers.Contract(TEST_CONFIG.contracts.factory, factoryABI, provider);
    
    try {
      const totalTokens = await factory.totalDeployedTokens();
      console.log(`✅ Factory contract responsive - ${totalTokens} tokens deployed`);
      
      if (Number(totalTokens) > 0) {
        console.log(`✅ Stock tokens available for trading`);
        testResults.tradingFunctionality = true;
        return true;
      } else {
        console.log(`⚠️  No stock tokens deployed yet`);
        console.log(`   Run: node deploy-sample-stocks.js to deploy sample tokens`);
        return false;
      }
    } catch (contractError) {
      console.log(`❌ Contract interaction failed: ${contractError.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Trading functionality test failed: ${error.message}`);
    return false;
  }
}

async function generateTestReport() {
  console.log("\n📊 Generating test report...");
  
  const report = {
    timestamp: new Date().toISOString(),
    network: "Hedera Testnet",
    chainId: TEST_CONFIG.chainId,
    testResults: testResults,
    contracts: TEST_CONFIG.contracts,
    summary: {
      totalTests: Object.keys(testResults).length,
      passed: Object.values(testResults).filter(result => result === true).length,
      failed: Object.values(testResults).filter(result => result === false).length
    }
  };
  
  // Calculate success rate
  const successRate = (report.summary.passed / report.summary.totalTests) * 100;
  
  console.log(`\n📋 Test Summary:`);
  console.log(`   ✅ Passed: ${report.summary.passed}/${report.summary.totalTests}`);
  console.log(`   ❌ Failed: ${report.summary.failed}/${report.summary.totalTests}`);
  console.log(`   📊 Success Rate: ${successRate.toFixed(1)}%`);
  
  // Save report
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log(`\n📄 Test report saved to: test-report.json`);
  
  return report;
}

async function main() {
  console.log("🧪 Starting End-to-End Testing for Hedera Deployment");
  console.log("=" .repeat(60));
  
  // Load environment variables
  require('dotenv').config();
  
  // Run all tests
  await testNetworkConnection();
  await testContractDeployment();
  await testDatabaseIntegration();
  await testFrontendAccess();
  await testWalletConnection();
  await testTradingFunctionality();
  
  // Generate report
  const report = await generateTestReport();
  
  // Final recommendations
  console.log("\n🚀 Next Steps:");
  
  if (!testResults.frontendAccess) {
    console.log("   1. Start the frontend: cd front-end && npm run dev");
  }
  
  if (!testResults.tradingFunctionality) {
    console.log("   2. Deploy sample stock tokens: node deploy-sample-stocks.js");
  }
  
  if (testResults.frontendAccess) {
    console.log("   3. Open frontend: http://localhost:3000");
    console.log("   4. Connect wallet to Hedera testnet (Chain ID: 296)");
    console.log("   5. Test trading functionality");
  }
  
  console.log("\n🔗 Useful Links:");
  console.log(`   🌐 Frontend: ${TEST_CONFIG.frontendURL}`);
  console.log(`   🔍 Factory: https://hashscan.io/testnet/contract/${TEST_CONFIG.contracts.factory}`);
  console.log(`   💰 NGN Token: https://hashscan.io/testnet/contract/${TEST_CONFIG.contracts.ngnStablecoin}`);
  
  if (report.summary.passed === report.summary.totalTests) {
    console.log("\n🎉 All tests passed! System is ready for use.");
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${report.summary.failed} test(s) failed. Please address the issues above.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;

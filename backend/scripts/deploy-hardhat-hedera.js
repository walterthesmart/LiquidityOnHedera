require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

// Nigerian stocks data
const NIGERIAN_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement', companyName: 'Dangote Cement Plc', maxSupply: '1000000' },
  { symbol: 'GTCO', name: 'Guaranty Trust Bank', companyName: 'Guaranty Trust Holding Company Plc', maxSupply: '2000000' },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa', companyName: 'Airtel Africa Plc', maxSupply: '1500000' },
  { symbol: 'BUACEMENT', name: 'BUA Cement', companyName: 'BUA Cement Plc', maxSupply: '800000' },
  { symbol: 'SEPLAT', name: 'Seplat Energy', companyName: 'Seplat Energy Plc', maxSupply: '600000' }
];

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function updateFrontendConfig(deploymentResult) {
  log('\n🔧 Updating frontend configuration...', 'cyan');
  
  const frontendConfigPath = path.join(__dirname, '../../frontend/src/config/hedera-contracts.json');
  const frontendConfigDir = path.dirname(frontendConfigPath);
  
  // Ensure frontend config directory exists
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  const frontendConfig = {
    network: 'hedera-testnet',
    lastUpdated: deploymentResult.deployedAt,
    contracts: {
      NGNStablecoin: deploymentResult.contracts.ngnStablecoin ? {
        address: deploymentResult.contracts.ngnStablecoin.address,
        contractId: deploymentResult.contracts.ngnStablecoin.contractId || 'N/A'
      } : undefined,
      NigerianStockFactory: deploymentResult.contracts.factory ? {
        address: deploymentResult.contracts.factory.address,
        contractId: deploymentResult.contracts.factory.contractId || 'N/A'
      } : undefined,
      StockNGNDEX: deploymentResult.contracts.stockNGNDEX ? {
        address: deploymentResult.contracts.stockNGNDEX.address,
        contractId: deploymentResult.contracts.stockNGNDEX.contractId || 'N/A'
      } : undefined,
      TradingPairManager: deploymentResult.contracts.tradingPairManager ? {
        address: deploymentResult.contracts.tradingPairManager.address,
        contractId: deploymentResult.contracts.tradingPairManager.contractId || 'N/A'
      } : undefined
    },
    stockTokens: deploymentResult.contracts.stockTokens?.reduce((acc, token) => {
      acc[token.symbol] = {
        address: token.address,
        contractId: token.contractId || 'N/A',
        name: token.name,
        companyName: token.companyName,
        maxSupply: token.maxSupply
      };
      return acc;
    }, {}) || {}
  };
  
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  log(`✅ Frontend configuration updated: ${frontendConfigPath}`, 'green');
}

async function main() {
  try {
    log('🚀 Starting Hardhat-based deployment to Hedera Testnet...', 'cyan');
    
    const [deployer] = await hre.ethers.getSigners();
    log(`📝 Deploying with account: ${deployer.address}`, 'blue');
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`, 'blue');
    
    const deploymentResult = {
      network: 'hedera-testnet',
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: {}
    };
    
    // Step 1: Deploy NGN Stablecoin
    log('\n📦 Step 1: Deploying NGN Stablecoin...', 'cyan');
    const NGNStablecoin = await hre.ethers.getContractFactory('NGNStablecoin');
    
    const stablecoinConfig = {
      name: 'Nigerian Naira Stablecoin',
      symbol: 'NGN',
      maxSupply: hre.ethers.parseEther('1000000000'), // 1 billion NGN
      mintingCap: hre.ethers.parseEther('10000000'), // 10 million NGN daily cap
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true
    };
    
    const ngnStablecoin = await NGNStablecoin.deploy(
      deployer.address, // admin
      stablecoinConfig.name,
      stablecoinConfig.symbol,
      stablecoinConfig.maxSupply,
      stablecoinConfig.mintingCap,
      stablecoinConfig.mintingEnabled,
      stablecoinConfig.burningEnabled,
      stablecoinConfig.transfersEnabled
    );
    
    await ngnStablecoin.waitForDeployment();
    const ngnAddress = await ngnStablecoin.getAddress();
    
    log(`✅ NGN Stablecoin deployed to: ${ngnAddress}`, 'green');
    
    deploymentResult.contracts.ngnStablecoin = {
      address: ngnAddress,
      config: stablecoinConfig
    };
    
    // Step 2: Deploy NigerianStockFactory
    log('\n📦 Step 2: Deploying NigerianStockFactory...', 'cyan');
    const NigerianStockFactory = await hre.ethers.getContractFactory('NigerianStockFactory');
    const stockFactory = await NigerianStockFactory.deploy();
    
    await stockFactory.waitForDeployment();
    const factoryAddress = await stockFactory.getAddress();
    
    log(`✅ NigerianStockFactory deployed to: ${factoryAddress}`, 'green');
    
    deploymentResult.contracts.factory = {
      address: factoryAddress
    };
    
    // Step 3: Deploy StockNGNDEX
    log('\n📦 Step 3: Deploying StockNGNDEX...', 'cyan');
    const StockNGNDEX = await hre.ethers.getContractFactory('StockNGNDEX');
    
    const dexConfig = {
      defaultFeeRate: 30, // 0.3%
      maxPriceImpact: 1000, // 10%
      minLiquidity: hre.ethers.parseEther('1000'), // 1000 NGN minimum
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false
    };
    
    const stockNGNDEX = await StockNGNDEX.deploy(
      ngnAddress,
      dexConfig.defaultFeeRate,
      dexConfig.maxPriceImpact,
      dexConfig.minLiquidity,
      dexConfig.swapDeadline,
      dexConfig.emergencyMode
    );
    
    await stockNGNDEX.waitForDeployment();
    const dexAddress = await stockNGNDEX.getAddress();
    
    log(`✅ StockNGNDEX deployed to: ${dexAddress}`, 'green');
    
    deploymentResult.contracts.stockNGNDEX = {
      address: dexAddress,
      config: dexConfig
    };
    
    // Step 4: Deploy TradingPairManager
    log('\n📦 Step 4: Deploying TradingPairManager...', 'cyan');
    const TradingPairManager = await hre.ethers.getContractFactory('TradingPairManager');
    const tradingPairManager = await TradingPairManager.deploy(
      dexAddress,
      ngnAddress,
      factoryAddress
    );
    
    await tradingPairManager.waitForDeployment();
    const pairManagerAddress = await tradingPairManager.getAddress();
    
    log(`✅ TradingPairManager deployed to: ${pairManagerAddress}`, 'green');
    
    deploymentResult.contracts.tradingPairManager = {
      address: pairManagerAddress
    };
    
    // Step 5: Deploy Stock Tokens
    log('\n📦 Step 5: Deploying Nigerian Stock Tokens...', 'cyan');
    const NigerianStockToken = await hre.ethers.getContractFactory('NigerianStockToken');
    
    deploymentResult.contracts.stockTokens = [];
    
    for (let i = 0; i < NIGERIAN_STOCKS.length; i++) {
      const stock = NIGERIAN_STOCKS[i];
      log(`\n   📈 Deploying ${stock.symbol} (${stock.name})...`, 'yellow');
      
      const stockToken = await NigerianStockToken.deploy(
        stock.name,
        stock.symbol,
        stock.companyName,
        hre.ethers.parseEther(stock.maxSupply),
        deployer.address
      );
      
      await stockToken.waitForDeployment();
      const stockAddress = await stockToken.getAddress();
      
      deploymentResult.contracts.stockTokens.push({
        symbol: stock.symbol,
        name: stock.name,
        companyName: stock.companyName,
        address: stockAddress,
        maxSupply: hre.ethers.parseEther(stock.maxSupply).toString()
      });
      
      log(`   ✅ ${stock.symbol} deployed to: ${stockAddress}`, 'green');
    }
    
    deploymentResult.totalTokens = NIGERIAN_STOCKS.length;
    
    // Save deployment results
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `hedera-testnet-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
    
    // Update frontend configuration
    await updateFrontendConfig(deploymentResult);
    
    log(`\n📄 Deployment results saved to: ${deploymentFile}`, 'blue');
    log('\n✅ All contracts deployed successfully!', 'green');
    log(`\n📊 Summary:`, 'cyan');
    log(`   • NGN Stablecoin: ${deploymentResult.contracts.ngnStablecoin.address}`, 'blue');
    log(`   • Stock Factory: ${deploymentResult.contracts.factory.address}`, 'blue');
    log(`   • StockNGNDEX: ${deploymentResult.contracts.stockNGNDEX.address}`, 'blue');
    log(`   • Trading Pair Manager: ${deploymentResult.contracts.tradingPairManager.address}`, 'blue');
    log(`   • Stock Tokens: ${deploymentResult.totalTokens} deployed`, 'blue');
    
    return deploymentResult;
    
  } catch (error) {
    log(`\n❌ Deployment failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

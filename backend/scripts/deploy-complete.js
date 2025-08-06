require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Nigerian stocks data - Top 10 NSE stocks
const NIGERIAN_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement', companyName: 'Dangote Cement Plc', maxSupply: '1000000', sector: 'Industrial Goods', description: 'Leading cement manufacturer in Nigeria and Africa' },
  { symbol: 'GTCO', name: 'Guaranty Trust Bank', companyName: 'Guaranty Trust Holding Company Plc', maxSupply: '2000000', sector: 'Banking', description: 'One of Nigeria\'s leading financial institutions' },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa', companyName: 'Airtel Africa Plc', maxSupply: '1500000', sector: 'Telecommunications', description: 'Leading telecommunications company across Africa' },
  { symbol: 'BUACEMENT', name: 'BUA Cement', companyName: 'BUA Cement Plc', maxSupply: '800000', sector: 'Industrial Goods', description: 'Major cement producer in Nigeria' },
  { symbol: 'SEPLAT', name: 'Seplat Energy', companyName: 'Seplat Energy Plc', maxSupply: '600000', sector: 'Oil & Gas', description: 'Independent oil and gas company in Nigeria' },
  { symbol: 'MTNN', name: 'MTN Nigeria', companyName: 'MTN Nigeria Communications Plc', maxSupply: '2100000', sector: 'Telecommunications', description: 'Leading telecommunications provider in Nigeria' },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank', companyName: 'Zenith Bank Plc', maxSupply: '3100000', sector: 'Banking', description: 'One of Nigeria\'s tier-1 commercial banks' },
  { symbol: 'ACCESS', name: 'Access Bank', companyName: 'Access Holdings Plc', maxSupply: '3600000', sector: 'Banking', description: 'Leading commercial bank in Nigeria' },
  { symbol: 'FBNH', name: 'FBN Holdings', companyName: 'FBN Holdings Plc', maxSupply: '3500000', sector: 'Banking', description: 'Holding company for First Bank of Nigeria' },
  { symbol: 'UBA', name: 'United Bank for Africa', companyName: 'United Bank for Africa Plc', maxSupply: '3800000', sector: 'Banking', description: 'Pan-African financial services group' },
  { symbol: 'NESTLE', name: 'Nestle Nigeria', companyName: 'Nestle Nigeria Plc', maxSupply: '750000', sector: 'Consumer Goods', description: 'Leading food and beverage company in Nigeria' },
  { symbol: 'UNILEVER', name: 'Unilever Nigeria', companyName: 'Unilever Nigeria Plc', maxSupply: '600000', sector: 'Consumer Goods', description: 'Multinational consumer goods company' }
];

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function readCompiledContract(contractName) {
  const artifactPath = path.join(__dirname, '../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return { bytecode: artifact.bytecode, abi: artifact.abi };
}

async function deployContract(factory, args, gasLimit, contractName) {
  log(`🚀 Deploying ${contractName}...`, 'cyan');
  try {
    const contract = await factory.deploy(...args, {
      gasLimit,
      gasPrice: ethers.parseUnits('370', 'gwei')
    });
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    log(`✅ ${contractName} deployed to: ${address}`, 'green');
    return { address, contract };
  } catch (error) {
    log(`❌ Failed to deploy ${contractName}: ${error.message}`, 'red');
    throw error;
  }
}

async function updateFrontendConfig(deploymentResult) {
  log('\n🔧 Updating frontend configuration...', 'cyan');
  
  const frontendConfigPath = path.join(__dirname, '../../frontend/src/config/hedera-contracts.json');
  const frontendConfigDir = path.dirname(frontendConfigPath);
  
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  const frontendConfig = {
    network: 'hedera-testnet',
    lastUpdated: deploymentResult.deployedAt,
    deploymentStatus: 'complete',
    contracts: deploymentResult.contracts,
    stockTokens: deploymentResult.stockTokens
  };
  
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  log(`✅ Frontend configuration updated: ${frontendConfigPath}`, 'green');
}

async function updateStocksData(deploymentResult) {
  log('🔧 Updating stocks database...', 'cyan');
  
  const stocksDataPath = path.join(__dirname, '../../frontend/src/data/nigerian-stocks.json');
  
  let stocksData = {
    lastUpdated: deploymentResult.deployedAt,
    totalStocks: NIGERIAN_STOCKS.length,
    deploymentStatus: 'complete',
    stocks: []
  };
  
  // Update stocks with deployment info
  stocksData.stocks = NIGERIAN_STOCKS.map(stock => {
    const deployedToken = deploymentResult.stockTokens[stock.symbol];
    return {
      ...stock,
      id: stock.symbol.toLowerCase(),
      isActive: true,
      tradingEnabled: !!deployedToken,
      contractAddress: deployedToken?.address || `0x${'0'.repeat(40)}`,
      contractId: deployedToken?.contractId || 'N/A',
      lastUpdated: deploymentResult.deployedAt,
      price: getRandomPrice(stock.symbol),
      change: getRandomChange(),
      volume: getRandomVolume(),
      marketCap: getRandomMarketCap()
    };
  });
  
  fs.writeFileSync(stocksDataPath, JSON.stringify(stocksData, null, 2));
  log(`✅ Stocks database updated: ${stocksDataPath}`, 'green');
}

function getRandomPrice(symbol) {
  const prices = {
    DANGCEM: '420.50', GTCO: '32.75', AIRTELAFRI: '1850.00', BUACEMENT: '125.30', SEPLAT: '1650.00',
    MTNN: '285.00', ZENITHBANK: '28.50', ACCESS: '12.85', FBNH: '18.20', UBA: '9.75',
    NESTLE: '1450.00', UNILEVER: '18.50'
  };
  return prices[symbol] || '100.00';
}

function getRandomChange() {
  const changes = ['+2.5%', '+1.2%', '+3.1%', '-0.8%', '+4.2%', '-1.5%', '+0.9%'];
  return changes[Math.floor(Math.random() * changes.length)];
}

function getRandomVolume() {
  const volumes = ['1.2M', '2.5M', '850K', '950K', '420K', '1.8M', '650K'];
  return volumes[Math.floor(Math.random() * volumes.length)];
}

function getRandomMarketCap() {
  const caps = ['4.2T', '1.8T', '2.1T', '1.5T', '980B', '3.1T', '1.2T'];
  return caps[Math.floor(Math.random() * caps.length)];
}

async function main() {
  try {
    log('🚀 Starting Complete Hedera Deployment & Frontend Integration...', 'cyan');
    log('='.repeat(70), 'cyan');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api'
    );
    
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY;
    if (!privateKey) {
      throw new Error('HEDERA_PRIVATE_KEY or OPERATOR_PVKEY not found in environment variables');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`📝 Deploying with account: ${wallet.address}`, 'blue');
    
    const balance = await provider.getBalance(wallet.address);
    log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`, 'blue');
    
    if (parseFloat(ethers.formatEther(balance)) < 100) {
      log('⚠️  Warning: Low balance. You may need more HBAR for deployment.', 'yellow');
    }
    
    const deploymentResult = {
      network: 'hedera-testnet',
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      contracts: {},
      stockTokens: {}
    };
    
    // Step 1: Deploy NGN Stablecoin
    log('\n📦 Step 1: Deploying NGN Stablecoin...', 'cyan');
    const ngnContract = await readCompiledContract('NGNStablecoin');
    const NGNFactory = new ethers.ContractFactory(ngnContract.abi, ngnContract.bytecode, wallet);
    
    const stablecoinConfig = {
      name: 'Nigerian Naira Stablecoin', symbol: 'NGN', decimals: 18,
      maxSupply: ethers.parseEther('1000000000'), mintingCap: ethers.parseEther('10000000'),
      lastMintReset: 0, currentDayMinted: 0, mintingEnabled: true, burningEnabled: true, transfersEnabled: true
    };
    
    const { address: ngnAddress } = await deployContract(NGNFactory, [wallet.address, stablecoinConfig], 3500000, 'NGN Stablecoin');
    deploymentResult.contracts.NGNStablecoin = {
      address: ngnAddress, contractId: 'N/A', name: 'Nigerian Naira Stablecoin', symbol: 'NGN', decimals: 18, status: 'deployed'
    };
    
    // Step 2: Deploy NigerianStockFactory
    log('\n📦 Step 2: Deploying NigerianStockFactory...', 'cyan');
    const factoryContract = await readCompiledContract('NigerianStockFactory');
    const FactoryFactory = new ethers.ContractFactory(factoryContract.abi, factoryContract.bytecode, wallet);
    
    const { address: factoryAddress } = await deployContract(FactoryFactory, [], 5000000, 'NigerianStockFactory');
    deploymentResult.contracts.NigerianStockFactory = {
      address: factoryAddress, contractId: 'N/A', name: 'Nigerian Stock Factory', status: 'deployed'
    };
    
    // Step 3: Deploy StockNGNDEX
    log('\n📦 Step 3: Deploying StockNGNDEX...', 'cyan');
    const dexContract = await readCompiledContract('StockNGNDEX');
    const DEXFactory = new ethers.ContractFactory(dexContract.abi, dexContract.bytecode, wallet);

    const dexConfig = { defaultFeeRate: 30, maxPriceImpact: 1000, minLiquidity: ethers.parseEther('1000'), swapDeadline: 1800, emergencyMode: false };
    const { address: dexAddress } = await deployContract(DEXFactory, [ngnAddress, wallet.address, dexConfig], 6000000, 'StockNGNDEX');
    deploymentResult.contracts.StockNGNDEX = {
      address: dexAddress, contractId: 'N/A', name: 'Stock NGN DEX', status: 'deployed'
    };
    
    // Step 4: Deploy TradingPairManager
    log('\n📦 Step 4: Deploying TradingPairManager...', 'cyan');
    const pairContract = await readCompiledContract('TradingPairManager');
    const PairFactory = new ethers.ContractFactory(pairContract.abi, pairContract.bytecode, wallet);

    const managerConfig = {
      defaultFeeRate: 30, // 0.3%
      defaultLiquidityTarget: ethers.parseEther('10000'), // 10,000 NGN
      defaultRebalanceThreshold: 500, // 5%
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400 // 24 hours
    };

    const { address: pairAddress } = await deployContract(PairFactory, [ngnAddress, dexAddress, factoryAddress, wallet.address, managerConfig], 4000000, 'TradingPairManager');
    deploymentResult.contracts.TradingPairManager = {
      address: pairAddress, contractId: 'N/A', name: 'Trading Pair Manager', status: 'deployed'
    };
    
    // Step 5: Deploy All Stock Tokens
    log('\n📦 Step 5: Deploying Nigerian Stock Tokens...', 'cyan');
    const stockContract = await readCompiledContract('NigerianStockToken');
    const StockFactory = new ethers.ContractFactory(stockContract.abi, stockContract.bytecode, wallet);
    
    for (const stock of NIGERIAN_STOCKS) {
      log(`\n   📈 Deploying ${stock.symbol} (${stock.name})...`, 'yellow');
      
      const maxSupply = ethers.parseEther(stock.maxSupply);
      const initialSupply = maxSupply / 10n;
      
      try {
        const { address: stockAddress } = await deployContract(StockFactory, [
          stock.name, stock.symbol, stock.symbol, stock.companyName, maxSupply, initialSupply, wallet.address
        ], 4000000, stock.symbol);
        
        deploymentResult.stockTokens[stock.symbol] = {
          address: stockAddress, contractId: 'N/A', name: stock.name, symbol: stock.symbol,
          companyName: stock.companyName, maxSupply: maxSupply.toString(), sector: stock.sector,
          description: stock.description, status: 'deployed'
        };
      } catch (error) {
        log(`   ❌ Failed to deploy ${stock.symbol}, continuing...`, 'red');
      }
    }
    
    // Step 6: Save deployment results
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `hedera-complete-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
    
    // Step 7: Update frontend
    await updateFrontendConfig(deploymentResult);
    await updateStocksData(deploymentResult);
    
    // Step 8: Summary
    log('\n' + '='.repeat(70), 'cyan');
    log('🎉 COMPLETE DEPLOYMENT SUCCESSFUL!', 'green');
    log('='.repeat(70), 'cyan');
    
    log(`\n📊 Deployment Summary:`, 'cyan');
    log(`   • NGN Stablecoin: ${deploymentResult.contracts.NGNStablecoin.address}`, 'blue');
    log(`   • Stock Factory: ${deploymentResult.contracts.NigerianStockFactory.address}`, 'blue');
    log(`   • StockNGNDEX: ${deploymentResult.contracts.StockNGNDEX.address}`, 'blue');
    log(`   • Trading Pair Manager: ${deploymentResult.contracts.TradingPairManager.address}`, 'blue');
    log(`   • Stock Tokens: ${Object.keys(deploymentResult.stockTokens).length} deployed`, 'blue');
    
    Object.entries(deploymentResult.stockTokens).forEach(([symbol, token]) => {
      log(`     - ${symbol}: ${token.address}`, 'blue');
    });
    
    log(`\n📄 Results saved to: ${deploymentFile}`, 'blue');
    log(`\n🚀 Frontend Integration Complete!`, 'green');
    log(`   • Visit: http://localhost:3000/nigerian-stocks`, 'blue');
    log(`   • Status: http://localhost:3000/deployment`, 'blue');
    
    return deploymentResult;
    
  } catch (error) {
    log(`\n❌ Deployment failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

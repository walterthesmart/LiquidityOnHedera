const fs = require('fs');
const path = require('path');

// Nigerian stocks data with detailed information - Top 12 NSE stocks
const NIGERIAN_STOCKS = [
  {
    symbol: 'DANGCEM', name: 'Dangote Cement', companyName: 'Dangote Cement Plc', maxSupply: '1000000',
    sector: 'Industrial Goods', description: 'Leading cement manufacturer in Nigeria and Africa',
    marketCap: '4.2T', price: '420.50', change: '+2.5%', volume: '1.2M',
    logo: '/images/stocks/dangcem.png', contractAddress: '0x' + '1'.repeat(40), contractId: '0.0.1001'
  },
  {
    symbol: 'GTCO', name: 'Guaranty Trust Bank', companyName: 'Guaranty Trust Holding Company Plc', maxSupply: '2000000',
    sector: 'Banking', description: 'One of Nigeria\'s leading financial institutions',
    marketCap: '1.8T', price: '32.75', change: '+1.2%', volume: '2.5M',
    logo: '/images/stocks/gtco.png', contractAddress: '0x' + '2'.repeat(40), contractId: '0.0.1002'
  },
  {
    symbol: 'AIRTELAFRI', name: 'Airtel Africa', companyName: 'Airtel Africa Plc', maxSupply: '1500000',
    sector: 'Telecommunications', description: 'Leading telecommunications company across Africa',
    marketCap: '2.1T', price: '1,850.00', change: '+3.1%', volume: '850K',
    logo: '/images/stocks/airtel.png', contractAddress: '0x' + '3'.repeat(40), contractId: '0.0.1003'
  },
  {
    symbol: 'BUACEMENT', name: 'BUA Cement', companyName: 'BUA Cement Plc', maxSupply: '800000',
    sector: 'Industrial Goods', description: 'Major cement producer in Nigeria',
    marketCap: '1.5T', price: '125.30', change: '-0.8%', volume: '950K',
    logo: '/images/stocks/buacement.png', contractAddress: '0x' + '4'.repeat(40), contractId: '0.0.1004'
  },
  {
    symbol: 'SEPLAT', name: 'Seplat Energy', companyName: 'Seplat Energy Plc', maxSupply: '600000',
    sector: 'Oil & Gas', description: 'Independent oil and gas company in Nigeria',
    marketCap: '980B', price: '1,650.00', change: '+4.2%', volume: '420K',
    logo: '/images/stocks/seplat.png', contractAddress: '0x' + '5'.repeat(40), contractId: '0.0.1005'
  },
  {
    symbol: 'MTNN', name: 'MTN Nigeria', companyName: 'MTN Nigeria Communications Plc', maxSupply: '2100000',
    sector: 'Telecommunications', description: 'Leading telecommunications provider in Nigeria',
    marketCap: '5.8T', price: '285.00', change: '+1.8%', volume: '1.8M',
    logo: '/images/stocks/mtn.png', contractAddress: '0x' + '6'.repeat(40), contractId: '0.0.1006'
  },
  {
    symbol: 'ZENITHBANK', name: 'Zenith Bank', companyName: 'Zenith Bank Plc', maxSupply: '3100000',
    sector: 'Banking', description: 'One of Nigeria\'s tier-1 commercial banks',
    marketCap: '890B', price: '28.50', change: '+0.7%', volume: '3.2M',
    logo: '/images/stocks/zenith.png', contractAddress: '0x' + '7'.repeat(40), contractId: '0.0.1007'
  },
  {
    symbol: 'ACCESS', name: 'Access Bank', companyName: 'Access Holdings Plc', maxSupply: '3600000',
    sector: 'Banking', description: 'Leading commercial bank in Nigeria',
    marketCap: '460B', price: '12.85', change: '-0.3%', volume: '4.1M',
    logo: '/images/stocks/access.png', contractAddress: '0x' + '8'.repeat(40), contractId: '0.0.1008'
  },
  {
    symbol: 'FBNH', name: 'FBN Holdings', companyName: 'FBN Holdings Plc', maxSupply: '3500000',
    sector: 'Banking', description: 'Holding company for First Bank of Nigeria',
    marketCap: '650B', price: '18.20', change: '+2.1%', volume: '2.8M',
    logo: '/images/stocks/fbn.png', contractAddress: '0x' + '9'.repeat(40), contractId: '0.0.1009'
  },
  {
    symbol: 'UBA', name: 'United Bank for Africa', companyName: 'United Bank for Africa Plc', maxSupply: '3800000',
    sector: 'Banking', description: 'Pan-African financial services group',
    marketCap: '370B', price: '9.75', change: '+1.5%', volume: '5.2M',
    logo: '/images/stocks/uba.png', contractAddress: '0x' + 'A'.repeat(40), contractId: '0.0.1010'
  },
  {
    symbol: 'NESTLE', name: 'Nestle Nigeria', companyName: 'Nestle Nigeria Plc', maxSupply: '750000',
    sector: 'Consumer Goods', description: 'Leading food and beverage company in Nigeria',
    marketCap: '1.1T', price: '1,450.00', change: '+0.9%', volume: '180K',
    logo: '/images/stocks/nestle.png', contractAddress: '0x' + 'B'.repeat(40), contractId: '0.0.1011'
  },
  {
    symbol: 'UNILEVER', name: 'Unilever Nigeria', companyName: 'Unilever Nigeria Plc', maxSupply: '600000',
    sector: 'Consumer Goods', description: 'Multinational consumer goods company',
    marketCap: '110B', price: '18.50', change: '-1.2%', volume: '320K',
    logo: '/images/stocks/unilever.png', contractAddress: '0x' + 'C'.repeat(40), contractId: '0.0.1012'
  }
];

// Core contracts configuration
const CORE_CONTRACTS = {
  NGNStablecoin: {
    address: '0x' + 'A'.repeat(40), // Placeholder
    contractId: '0.0.2001', // Placeholder
    name: 'Nigerian Naira Stablecoin',
    symbol: 'NGN',
    decimals: 18
  },
  NigerianStockFactory: {
    address: '0x' + 'B'.repeat(40), // Placeholder
    contractId: '0.0.2002', // Placeholder
    name: 'Nigerian Stock Factory'
  },
  StockNGNDEX: {
    address: '0x' + 'C'.repeat(40), // Placeholder
    contractId: '0.0.2003', // Placeholder
    name: 'Stock NGN DEX'
  },
  TradingPairManager: {
    address: '0x' + 'D'.repeat(40), // Placeholder
    contractId: '0.0.2004', // Placeholder
    name: 'Trading Pair Manager'
  }
};

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

function createHederaContractsConfig() {
  const config = {
    network: 'hedera-testnet',
    lastUpdated: new Date().toISOString(),
    contracts: {
      NGNStablecoin: {
        address: CORE_CONTRACTS.NGNStablecoin.address,
        contractId: CORE_CONTRACTS.NGNStablecoin.contractId,
        name: CORE_CONTRACTS.NGNStablecoin.name,
        symbol: CORE_CONTRACTS.NGNStablecoin.symbol,
        decimals: CORE_CONTRACTS.NGNStablecoin.decimals
      },
      NigerianStockFactory: {
        address: CORE_CONTRACTS.NigerianStockFactory.address,
        contractId: CORE_CONTRACTS.NigerianStockFactory.contractId,
        name: CORE_CONTRACTS.NigerianStockFactory.name
      },
      StockNGNDEX: {
        address: CORE_CONTRACTS.StockNGNDEX.address,
        contractId: CORE_CONTRACTS.StockNGNDEX.contractId,
        name: CORE_CONTRACTS.StockNGNDEX.name
      },
      TradingPairManager: {
        address: CORE_CONTRACTS.TradingPairManager.address,
        contractId: CORE_CONTRACTS.TradingPairManager.contractId,
        name: CORE_CONTRACTS.TradingPairManager.name
      }
    },
    stockTokens: NIGERIAN_STOCKS.reduce((acc, stock) => {
      acc[stock.symbol] = {
        address: stock.contractAddress,
        contractId: stock.contractId,
        name: stock.name,
        symbol: stock.symbol,
        companyName: stock.companyName,
        maxSupply: stock.maxSupply,
        sector: stock.sector,
        description: stock.description
      };
      return acc;
    }, {})
  };
  
  return config;
}

function createStocksDatabase() {
  const stocksData = {
    lastUpdated: new Date().toISOString(),
    totalStocks: NIGERIAN_STOCKS.length,
    stocks: NIGERIAN_STOCKS.map(stock => ({
      ...stock,
      id: stock.symbol.toLowerCase(),
      isActive: true,
      tradingEnabled: true,
      lastUpdated: new Date().toISOString()
    }))
  };
  
  return stocksData;
}

function createTradingPairs() {
  const tradingPairs = {
    lastUpdated: new Date().toISOString(),
    totalPairs: NIGERIAN_STOCKS.length,
    pairs: NIGERIAN_STOCKS.map(stock => ({
      id: `${stock.symbol}_NGN`,
      baseToken: {
        symbol: stock.symbol,
        name: stock.name,
        address: stock.contractAddress,
        contractId: stock.contractId
      },
      quoteToken: {
        symbol: 'NGN',
        name: 'Nigerian Naira Stablecoin',
        address: CORE_CONTRACTS.NGNStablecoin.address,
        contractId: CORE_CONTRACTS.NGNStablecoin.contractId
      },
      price: stock.price,
      change: stock.change,
      volume: stock.volume,
      liquidity: '0',
      isActive: true,
      lastUpdated: new Date().toISOString()
    }))
  };
  
  return tradingPairs;
}

async function main() {
  try {
    log('🚀 Populating frontend database with Nigerian stocks...', 'cyan');
    
    // Create necessary directories
    const configDir = path.join(__dirname, '../src/config');
    const dataDir = path.join(__dirname, '../src/data');
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      log('📁 Created config directory', 'blue');
    }
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      log('📁 Created data directory', 'blue');
    }
    
    // 1. Create Hedera contracts configuration
    log('\n📦 Creating Hedera contracts configuration...', 'cyan');
    const contractsConfig = createHederaContractsConfig();
    const contractsConfigPath = path.join(configDir, 'hedera-contracts.json');
    fs.writeFileSync(contractsConfigPath, JSON.stringify(contractsConfig, null, 2));
    log(`✅ Hedera contracts config saved: ${contractsConfigPath}`, 'green');
    
    // 2. Create stocks database
    log('\n📈 Creating stocks database...', 'cyan');
    const stocksData = createStocksDatabase();
    const stocksDataPath = path.join(dataDir, 'nigerian-stocks.json');
    fs.writeFileSync(stocksDataPath, JSON.stringify(stocksData, null, 2));
    log(`✅ Stocks database saved: ${stocksDataPath}`, 'green');
    
    // 3. Create trading pairs
    log('\n💱 Creating trading pairs...', 'cyan');
    const tradingPairs = createTradingPairs();
    const tradingPairsPath = path.join(dataDir, 'trading-pairs.json');
    fs.writeFileSync(tradingPairsPath, JSON.stringify(tradingPairs, null, 2));
    log(`✅ Trading pairs saved: ${tradingPairsPath}`, 'green');
    
    // 4. Create market data
    log('\n📊 Creating market data...', 'cyan');
    const marketData = {
      lastUpdated: new Date().toISOString(),
      totalMarketCap: '10.5T',
      totalVolume: '5.9M',
      activeStocks: NIGERIAN_STOCKS.length,
      topGainers: NIGERIAN_STOCKS.filter(s => s.change.startsWith('+')).slice(0, 3),
      topLosers: NIGERIAN_STOCKS.filter(s => s.change.startsWith('-')).slice(0, 3),
      mostActive: NIGERIAN_STOCKS.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 3)
    };
    const marketDataPath = path.join(dataDir, 'market-data.json');
    fs.writeFileSync(marketDataPath, JSON.stringify(marketData, null, 2));
    log(`✅ Market data saved: ${marketDataPath}`, 'green');
    
    // 5. Create summary report
    log('\n📋 Creating summary report...', 'cyan');
    const summary = {
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Frontend database populated successfully',
      data: {
        contractsConfigured: Object.keys(contractsConfig.contracts).length,
        stockTokensConfigured: Object.keys(contractsConfig.stockTokens).length,
        stocksInDatabase: stocksData.totalStocks,
        tradingPairsCreated: tradingPairs.totalPairs,
        marketDataGenerated: true
      },
      files: {
        contractsConfig: contractsConfigPath,
        stocksDatabase: stocksDataPath,
        tradingPairs: tradingPairsPath,
        marketData: marketDataPath
      }
    };
    
    log('\n🎉 Frontend database population completed!', 'green');
    log('\n📊 Summary:', 'cyan');
    log(`   • Core contracts configured: ${summary.data.contractsConfigured}`, 'blue');
    log(`   • Stock tokens configured: ${summary.data.stockTokensConfigured}`, 'blue');
    log(`   • Stocks in database: ${summary.data.stocksInDatabase}`, 'blue');
    log(`   • Trading pairs created: ${summary.data.tradingPairsCreated}`, 'blue');
    
    log('\n📁 Files created:', 'cyan');
    Object.entries(summary.files).forEach(([key, filePath]) => {
      log(`   • ${key}: ${path.relative(process.cwd(), filePath)}`, 'blue');
    });
    
    log('\n💡 Next steps:', 'yellow');
    log('   1. Update your frontend components to use the new data files', 'yellow');
    log('   2. Deploy actual contracts to Hedera testnet', 'yellow');
    log('   3. Update contract addresses in hedera-contracts.json', 'yellow');
    log('   4. Test the frontend integration', 'yellow');
    
    return summary;
    
  } catch (error) {
    log(`\n❌ Failed to populate frontend database: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main, NIGERIAN_STOCKS, CORE_CONTRACTS };

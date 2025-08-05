/**
 * Populate Database with Hedera Testnet Deployment Data
 * 
 * This script populates the database with metadata for the deployed
 * Nigerian stock trading system on Hedera testnet.
 */

import { db } from '../src/db/turso-connection';
import { stocks, stockPrices } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Hedera testnet deployment data
const HEDERA_DEPLOYMENT = {
  network: "Hedera Testnet",
  chainId: 296,
  blockExplorer: "https://hashscan.io/testnet",
  contracts: {
    factoryAddress: "0xf867ace8Ed1F51f50EDc2A7DAe477Ac19cdaCF68",
    ngnStablecoin: "0x4bB9F94c2aBd8fd1BA789f8d7f7174e194330628",
    stockNGNDEX: "0x0A34513Cec5f80408B3d5d65F7E129A80adDdb59",
    tradingPairManager: "0xAeB0F58b0F7A01283175eF30BFFF618F872f960e"
  }
};

// Nigerian stocks data with current market prices (in NGN)
const NIGERIAN_STOCKS_DATA = [
  {
    symbol: 'DANGCEM',
    name: 'Dangote Cement Plc',
    totalShares: 17040000000,
    sector: 'Industrial Goods',
    marketCap: 8520000000000, // 8.52 trillion NGN
    currentPrice: 500.00,
    change: 15.50
  },
  {
    symbol: 'MTNN',
    name: 'MTN Nigeria Communications Plc',
    totalShares: 20354513050,
    sector: 'ICT',
    marketCap: 4070902610000, // 4.07 trillion NGN
    currentPrice: 200.00,
    change: -5.25
  },
  {
    symbol: 'ZENITHBANK',
    name: 'Zenith Bank Plc',
    totalShares: 31396493786,
    sector: 'Banking',
    marketCap: 1100777282510, // 1.1 trillion NGN
    currentPrice: 35.05,
    change: 1.25
  },
  {
    symbol: 'GTCO',
    name: 'Guaranty Trust Holding Company Plc',
    totalShares: 29431127496,
    sector: 'Banking',
    marketCap: 1471556374800, // 1.47 trillion NGN
    currentPrice: 50.00,
    change: 2.15
  },
  {
    symbol: 'NB',
    name: 'Nigerian Breweries Plc',
    totalShares: 8020000000,
    sector: 'Consumer Goods',
    marketCap: 481200000000, // 481.2 billion NGN
    currentPrice: 60.00,
    change: -1.80
  },
  {
    symbol: 'ACCESS',
    name: 'Access Holdings Plc',
    totalShares: 35687500000,
    sector: 'Banking',
    marketCap: 535312500000, // 535.3 billion NGN
    currentPrice: 15.00,
    change: 0.75
  },
  {
    symbol: 'BUACEMENT',
    name: 'BUA Cement Plc',
    totalShares: 16000000000,
    sector: 'Industrial Goods',
    marketCap: 1600000000000, // 1.6 trillion NGN
    currentPrice: 100.00,
    change: 8.50
  },
  {
    symbol: 'AIRTELAFRI',
    name: 'Airtel Africa Plc',
    totalShares: 3700000000,
    sector: 'ICT',
    marketCap: 2220000000000, // 2.22 trillion NGN
    currentPrice: 600.00,
    change: 25.00
  },
  {
    symbol: 'FBNH',
    name: 'FBN Holdings Plc',
    totalShares: 35895292792,
    sector: 'Banking',
    marketCap: 718905855840, // 718.9 billion NGN
    currentPrice: 20.03,
    change: 0.85
  },
  {
    symbol: 'UBA',
    name: 'United Bank for Africa Plc',
    totalShares: 35130641814,
    sector: 'Banking',
    marketCap: 842335563336, // 842.3 billion NGN
    currentPrice: 23.98,
    change: 1.45
  }
];

async function populateDatabase() {
  console.log('🗄️  Populating database with Hedera testnet deployment data...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing stock data...');
    await db.delete(stockPrices);
    await db.delete(stocks);
    
    // Insert stock data
    console.log('📊 Inserting stock data...');
    
    for (const stockData of NIGERIAN_STOCKS_DATA) {
      // Insert stock record
      await db.insert(stocks).values({
        symbol: stockData.symbol,
        name: stockData.name,
        totalShares: stockData.totalShares,
        tokenID: `hedera-${stockData.symbol.toLowerCase()}`, // Placeholder token ID
        chain: 'hedera-testnet',
        exchange: 'NGX',
        sector: stockData.sector,
        marketCap: stockData.marketCap,
        hederaTokenAddress: null, // Will be updated when tokens are deployed
        isActive: true,
        lastUpdated: new Date().toISOString()
      });
      
      // Insert current price data
      await db.insert(stockPrices).values({
        time: new Date().toISOString(),
        symbol: stockData.symbol,
        price: stockData.currentPrice,
        changeAmount: stockData.change,
        changePercent: (stockData.change / (stockData.currentPrice - stockData.change)) * 100
      });
      
      console.log(`✅ Added ${stockData.symbol} - ${stockData.name}`);
    }
    
    // Insert system metadata (using a special stock entry)
    await db.insert(stocks).values({
      symbol: '_HEDERA_SYSTEM',
      name: 'Hedera System Metadata',
      totalShares: 0,
      tokenID: 'system-metadata',
      chain: 'hedera-testnet',
      exchange: 'SYSTEM',
      sector: 'Infrastructure',
      marketCap: 0,
      hederaTokenAddress: HEDERA_DEPLOYMENT.contracts.factoryAddress,
      isActive: true,
      lastUpdated: new Date().toISOString()
    });
    
    console.log('✅ System metadata added');
    
    // Verify data
    const stockCount = await db.select().from(stocks);
    const priceCount = await db.select().from(stockPrices);
    
    console.log(`\n📊 Database populated successfully!`);
    console.log(`   🏢 Stocks: ${stockCount.length}`);
    console.log(`   💰 Price records: ${priceCount.length}`);
    console.log(`   🌐 Network: ${HEDERA_DEPLOYMENT.network}`);
    console.log(`   🔗 Chain ID: ${HEDERA_DEPLOYMENT.chainId}`);
    
    console.log('\n🏭 Deployed Contracts:');
    console.log(`   📍 Factory: ${HEDERA_DEPLOYMENT.contracts.factoryAddress}`);
    console.log(`   💰 NGN Token: ${HEDERA_DEPLOYMENT.contracts.ngnStablecoin}`);
    console.log(`   🔄 DEX: ${HEDERA_DEPLOYMENT.contracts.stockNGNDEX}`);
    console.log(`   📊 Manager: ${HEDERA_DEPLOYMENT.contracts.tradingPairManager}`);
    
    console.log('\n🔗 Explorer Links:');
    console.log(`   🏭 Factory: ${HEDERA_DEPLOYMENT.blockExplorer}/contract/${HEDERA_DEPLOYMENT.contracts.factoryAddress}`);
    console.log(`   💰 NGN Token: ${HEDERA_DEPLOYMENT.blockExplorer}/contract/${HEDERA_DEPLOYMENT.contracts.ngnStablecoin}`);
    
    return {
      success: true,
      stocksAdded: stockCount.length,
      pricesAdded: priceCount.length,
      deployment: HEDERA_DEPLOYMENT
    };
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  }
}

async function updateTokenAddresses() {
  console.log('\n🔄 Updating token addresses (when available)...');
  
  // This function can be called later to update token addresses
  // after individual stock tokens are deployed
  
  const placeholderAddresses = {
    'DANGCEM': '0x0000000000000000000000000000000000000001',
    'MTNN': '0x0000000000000000000000000000000000000002',
    'ZENITHBANK': '0x0000000000000000000000000000000000000003',
    'GTCO': '0x0000000000000000000000000000000000000004',
    'NB': '0x0000000000000000000000000000000000000005'
  };
  
  for (const [symbol, address] of Object.entries(placeholderAddresses)) {
    await db.update(stocks)
      .set({ hederaTokenAddress: address })
      .where(eq(stocks.symbol, symbol));
    
    console.log(`📍 Updated ${symbol} address: ${address}`);
  }
}

if (require.main === module) {
  populateDatabase()
    .then((result) => {
      console.log('\n🎉 Database population completed successfully!');
      console.log('\n🚀 Next steps:');
      console.log('   1. Start the frontend: npm run dev');
      console.log('   2. Deploy individual stock tokens');
      console.log('   3. Test trading functionality');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database population failed:', error);
      process.exit(1);
    });
}

export { populateDatabase, updateTokenAddresses, HEDERA_DEPLOYMENT, NIGERIAN_STOCKS_DATA };

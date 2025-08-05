/**
 * Turso Database Seeding Script
 *
 * This script seeds the Turso database with Nigerian stock data
 * for development and testing.
 */

import { db } from '../src/db/turso-connection';
import { stocks, stockPrices } from '../src/db/schema';
import { config } from 'dotenv';

// Load environment variables
config();

// Sample Nigerian stocks data
const sampleStocks = [
  {
    symbol: 'DANGCEM',
    name: 'Dangote Cement Plc',
    totalShares: 17040000000,
    tokenID: '0.0.1001',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Cement',
    marketCap: 7710000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'MTNN',
    name: 'MTN Nigeria Communications Plc',
    totalShares: 20354513050,
    tokenID: '0.0.1002',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Telecommunications',
    marketCap: 4050000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'GTCO',
    name: 'Guaranty Trust Holding Company Plc',
    totalShares: 29431179224,
    tokenID: '0.0.1003',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Banking',
    marketCap: 1200000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'ZENITHBANK',
    name: 'Zenith Bank Plc',
    totalShares: 31396493786,
    tokenID: '0.0.1004',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Banking',
    marketCap: 1200000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'ACCESS',
    name: 'Access Holdings Plc',
    totalShares: 35479226043,
    tokenID: '0.0.1005',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Banking',
    marketCap: 800000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'FBNH',
    name: 'FBN Holdings Plc',
    totalShares: 35895292792,
    tokenID: '0.0.1006',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Banking',
    marketCap: 600000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'UBA',
    name: 'United Bank for Africa Plc',
    totalShares: 33817423611,
    tokenID: '0.0.1007',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Banking',
    marketCap: 900000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'NESTLE',
    name: 'Nestle Nigeria Plc',
    totalShares: 1054216667,
    tokenID: '0.0.1008',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Consumer Goods',
    marketCap: 1500000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'BUAFOODS',
    name: 'BUA Foods Plc',
    totalShares: 17244000000,
    tokenID: '0.0.1009',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Consumer Goods',
    marketCap: 2000000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'SEPLAT',
    name: 'Seplat Petroleum Development Company Plc',
    totalShares: 588235294,
    tokenID: '0.0.1010',
    chain: 'hedera',
    exchange: 'NGX',
    sector: 'Oil & Gas',
    marketCap: 800000000000,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
];

// Sample stock prices
const sampleStockPrices = [
  { symbol: 'DANGCEM', price: 452.50, changeAmount: 12.50 },
  { symbol: 'MTNN', price: 198.75, changeAmount: -3.25 },
  { symbol: 'GTCO', price: 40.80, changeAmount: 1.20 },
  { symbol: 'ZENITHBANK', price: 38.25, changeAmount: 0.75 },
  { symbol: 'ACCESS', price: 22.50, changeAmount: -0.50 },
  { symbol: 'FBNH', price: 16.75, changeAmount: 0.25 },
  { symbol: 'UBA', price: 26.60, changeAmount: 1.10 },
  { symbol: 'NESTLE', price: 1425.00, changeAmount: 25.00 },
  { symbol: 'BUAFOODS', price: 116.00, changeAmount: 2.50 },
  { symbol: 'SEPLAT', price: 1360.00, changeAmount: -15.00 },
];

async function seedTurso(): Promise<void> {
  console.log('🌱 Starting Turso database seeding...');
  
  try {
    console.log('🔍 Testing Turso connection...');
    // Test connection
    await db.select().from(stocks).limit(1);
    console.log('✅ Connected to Turso database!');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(stockPrices);
    await db.delete(stocks);
    
    // Insert stocks
    console.log('📈 Inserting sample stocks...');
    await db.insert(stocks).values(sampleStocks);
    console.log(`✅ Inserted ${sampleStocks.length} stocks`);
    
    // Insert stock prices
    console.log('💰 Inserting sample stock prices...');
    const currentTime = new Date().toISOString();
    const priceRecords = sampleStockPrices.map(price => ({
      time: currentTime,
      symbol: price.symbol,
      price: price.price,
      changeAmount: price.changeAmount,
      changePercent: price.changeAmount > 0 ? (price.changeAmount / (price.price - price.changeAmount)) * 100 : 0,
    }));
    
    await db.insert(stockPrices).values(priceRecords);
    console.log(`✅ Inserted ${priceRecords.length} stock price records`);
    
    // Verify the data
    const stockCount = await db.select().from(stocks);
    const priceCount = await db.select().from(stockPrices);
    
    console.log('\n📊 Turso database seeding completed!');
    console.log(`   - Stocks: ${stockCount.length}`);
    console.log(`   - Price records: ${priceCount.length}`);
    
  } catch (error) {
    console.error('❌ Failed to seed Turso database:');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}`);
    
    if (errorMessage.includes('no such table')) {
      console.log('\n💡 Database tables not found. Please run migrations first:');
      console.log('   npm run db:generate');
      console.log('   npm run db:migrate');
    }
    
    // Re-throw the error to ensure proper exit code
    throw error;
  }
}

// Run the seeding with proper error handling
if (require.main === module) {
  seedTurso().catch((error: unknown) => {
    console.error('Fatal error during Turso database seeding:', error);
    process.exit(1);
  });
}

export { seedTurso };

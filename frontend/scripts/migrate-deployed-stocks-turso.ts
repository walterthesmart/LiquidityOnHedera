/**
 * Migration Script for Deployed Stock Data - Turso Version
 * 
 * This script migrates the marketplace database to use real deployed stock data
 * from the Hedera blockchain instead of sample data, using Turso database.
 */

import { db } from '../src/db/turso-connection';
import { stocks, stockPrices } from '../src/db/schema';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Interface for deployed token data
interface DeployedToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  explorerUrl: string;
}

// Interface for token metadata
interface TokenMetadata {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  treasuryAccountId: string;
  memo: string;
  network: string;
  createdAt: string;
  transactionId: string;
  explorerUrl: string;
}

// Interface for stock data in database
interface StockData {
  symbol: string;
  name: string;
  totalShares: number;
  tokenID: string;
  chain: string;
  exchange: string;
  sector: string;
  marketCap: number;
  isActive: boolean;
  lastUpdated: string;
  price: number;
  change: number;
  treasuryAccountId?: string;
  transactionId?: string;
  memo?: string;
}

// Nigerian stock sectors mapping
const STOCK_SECTORS: Record<string, string> = {
  'DANGCEM': 'Industrial Goods',
  'BUACEMENT': 'Industrial Goods',
  'LAFARGE': 'Industrial Goods',
  'WAPCO': 'Industrial Goods',
  'MTNN': 'Telecommunications',
  'AIRTELAFRI': 'Telecommunications',
  'ZENITHBANK': 'Banking',
  'GTCO': 'Banking',
  'ACCESS': 'Banking',
  'FBNH': 'Banking',
  'UBA': 'Banking',
  'STANBIC': 'Banking',
  'SEPLAT': 'Oil & Gas',
  'OANDO': 'Oil & Gas',
  'CONOIL': 'Oil & Gas',
  'TOTAL': 'Oil & Gas',
  'ETERNA': 'Oil & Gas',
  'NB': 'Consumer Goods',
  'NESTLE': 'Consumer Goods',
  'GUINNESS': 'Consumer Goods',
  'INTBREW': 'Consumer Goods',
  'CHAMPION': 'Consumer Goods',
  'UNILEVER': 'Consumer Goods',
  'CADBURY': 'Consumer Goods',
  'FLOURMILL': 'Consumer Goods',
  'BUAFOODS': 'Consumer Goods',
  'DANGSUGAR': 'Consumer Goods',
  'PZ': 'Consumer Goods',
  'UACN': 'Conglomerates',
  'PRESCO': 'Agriculture',
  'OKOMUOIL': 'Agriculture',
  'LIVESTOCK': 'Agriculture',
  'GEREGU': 'Utilities',
  'TRANSPOWER': 'Utilities',
  'FIDSON': 'Healthcare',
  'MAYBAKER': 'Healthcare',
  'CWG': 'ICT',
  'TRANSCOHOT': 'Services'
};

// Mock current prices for deployed stocks (in NGN)
const CURRENT_PRICES: Record<string, { price: number; change: number }> = {
  'DANGCEM': { price: 452.50, change: 12.50 },
  'MTNN': { price: 198.75, change: -3.25 },
  'ZENITHBANK': { price: 35.40, change: 1.10 },
  'GTCO': { price: 45.80, change: 0.80 },
  'NB': { price: 84.20, change: -1.80 },
  'ACCESS': { price: 17.65, change: 0.45 },
  'BUACEMENT': { price: 92.30, change: 4.10 },
  'AIRTELAFRI': { price: 485.20, change: 7.80 },
  'FBNH': { price: 12.85, change: -0.35 },
  'UBA': { price: 14.20, change: 0.25 },
  'NESTLE': { price: 1165.50, change: 32.50 },
  'SEPLAT': { price: 475.80, change: 15.20 },
  'STANBIC': { price: 51.25, change: 1.40 },
  'OANDO': { price: 8.45, change: 0.15 },
  'LAFARGE': { price: 25.40, change: -0.60 },
  'CONOIL': { price: 52.30, change: 1.20 },
  'WAPCO': { price: 25.40, change: -0.60 },
  'FLOURMILL': { price: 31.75, change: 1.25 },
  'PRESCO': { price: 142.50, change: 5.50 },
  'CADBURY': { price: 18.90, change: 0.40 },
  'GUINNESS': { price: 65.75, change: -1.25 },
  'INTBREW': { price: 5.85, change: 0.10 },
  'CHAMPION': { price: 3.45, change: 0.05 },
  'UNILEVER': { price: 16.20, change: 0.30 },
  'BUAFOODS': { price: 285.00, change: 8.50 },
  'DANGSUGAR': { price: 28.75, change: 0.75 },
  'UACN': { price: 12.40, change: 0.20 },
  'PZ': { price: 18.50, change: 0.35 },
  'TOTAL': { price: 485.00, change: 12.00 },
  'ETERNA': { price: 12.75, change: 0.25 },
  'GEREGU': { price: 285.50, change: 15.50 },
  'TRANSPOWER': { price: 145.20, change: 8.20 },
  'FIDSON': { price: 12.85, change: 0.35 },
  'MAYBAKER': { price: 6.45, change: 0.15 },
  'OKOMUOIL': { price: 285.75, change: 12.25 },
  'LIVESTOCK': { price: 3.85, change: 0.10 },
  'CWG': { price: 2.45, change: 0.05 },
  'TRANSCOHOT': { price: 85.50, change: 2.50 }
};

/**
 * Load deployed token data from frontend-config.json
 */
function loadDeployedTokens(): DeployedToken[] {
  const configPath = path.join(__dirname, '../../hedera/exports/frontend-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Frontend config file not found at: ${configPath}`);
  }
  
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return configData.tokens;
}

/**
 * Load token metadata for a specific symbol
 */
function loadTokenMetadata(symbol: string): TokenMetadata | null {
  const metadataPath = path.join(__dirname, `../../hedera/exports/metadata/${symbol}.json`);
  
  if (!fs.existsSync(metadataPath)) {
    console.warn(`Metadata file not found for ${symbol}: ${metadataPath}`);
    return null;
  }
  
  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

/**
 * Convert deployed token data to stock data format
 */
function convertToStockData(token: DeployedToken): StockData {
  const metadata = loadTokenMetadata(token.symbol);
  const priceData = CURRENT_PRICES[token.symbol] || { price: 100.00, change: 0.00 };
  const sector = STOCK_SECTORS[token.symbol] || 'Other';
  
  // Calculate market cap based on total supply and current price
  const totalShares = metadata ? parseInt(metadata.totalSupply) : 1000000000;
  const marketCap = totalShares * priceData.price;
  
  return {
    symbol: token.symbol,
    name: token.name,
    totalShares: totalShares,
    tokenID: token.tokenId,
    chain: 'hedera',
    exchange: 'NGX',
    sector: sector,
    marketCap: marketCap,
    isActive: true,
    lastUpdated: new Date().toISOString(),
    price: priceData.price,
    change: priceData.change,
    treasuryAccountId: metadata?.treasuryAccountId,
    transactionId: metadata?.transactionId,
    memo: metadata?.memo
  };
}

/**
 * Main migration function
 */
async function migrateDeployedStocksToTurso(): Promise<void> {
  console.log('🚀 Starting migration to deployed stock data (Turso)...');
  console.log(`📍 Database URL: ${process.env.TURSO_DATABASE_URL}`);
  
  try {
    // Load deployed tokens
    console.log('📊 Loading deployed token data...');
    const deployedTokens = loadDeployedTokens();
    console.log(`✅ Found ${deployedTokens.length} deployed tokens`);
    
    // Convert to stock data format
    console.log('🔄 Converting to stock data format...');
    const stocksData: StockData[] = deployedTokens.map(convertToStockData);
    
    // Clear existing data
    console.log('🧹 Clearing existing stock data...');
    await db.delete(stocks);
    await db.delete(stockPrices);
    
    // Insert new stock data
    console.log('📈 Inserting deployed stock data...');
    const stocksToInsert = stocksData.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      totalShares: stock.totalShares,
      tokenID: stock.tokenID,
      chain: stock.chain,
      exchange: stock.exchange,
      sector: stock.sector,
      marketCap: stock.marketCap,
      isActive: stock.isActive,
      lastUpdated: stock.lastUpdated
    }));
    
    await db.insert(stocks).values(stocksToInsert);
    console.log(`✅ Inserted ${stocksToInsert.length} stocks`);
    
    // Create price data
    console.log('💰 Creating stock prices...');
    const pricesData = stocksData.map(stock => ({
      time: new Date().toISOString(),
      symbol: stock.symbol,
      price: stock.price,
      changeAmount: stock.change,
      changePercent: stock.change > 0 ? (stock.change / (stock.price - stock.change)) * 100 : 0
    }));
    
    await db.insert(stockPrices).values(pricesData);
    console.log(`✅ Inserted ${pricesData.length} stock prices`);
    
    // Verify the migration
    const stockCount = await db.select().from(stocks);
    const priceCount = await db.select().from(stockPrices);
    
    console.log('\n📊 Migration completed successfully!');
    console.log(`   - Deployed stocks: ${stockCount.length}`);
    console.log(`   - Price records: ${priceCount.length}`);
    console.log(`   - Network: ${deployedTokens[0]?.network || 'testnet'}`);
    
    // Display sample of migrated stocks
    console.log('\n📈 Sample migrated stocks:');
    const sampleStocks = stocksData.slice(0, 5);
    sampleStocks.forEach(stock => {
      console.log(`   - ${stock.symbol}: ${stock.name} (${stock.tokenID})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}`);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateDeployedStocksToTurso().catch((error: unknown) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });
}

export { migrateDeployedStocksToTurso, loadDeployedTokens, convertToStockData };

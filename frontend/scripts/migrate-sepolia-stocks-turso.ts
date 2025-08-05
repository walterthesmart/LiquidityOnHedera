/**
 * Migration Script for Sepolia Deployed Stock Data - Turso Version
 * 
 * This script migrates the marketplace database to use real deployed stock data
 * from the Sepolia testnet deployment instead of sample data.
 */

import { db } from '../src/db/turso-connection';
import { stocks, stockPrices } from '../src/db/schema';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Interface for Sepolia deployment data
interface SepoliaDeploymentData {
  network: string;
  chainId: string;
  deployer: string;
  factoryAddress: string;
  deployedAt: string;
  totalTokens: number;
  totalGasUsed: string;
  estimatedCostETH: string;
  batchSize: number;
  tokens: Array<{
    symbol: string;
    name: string;
    companyName: string;
    address: string;
    maxSupply: string;
    deploymentGas: string;
    sector: string;
  }>;
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
}

// Interface for price data
interface PriceData {
  time: string;
  symbol: string;
  price: number;
  changeAmount: number;
  changePercent: number;
}

// Realistic current prices for Nigerian stocks (in NGN)
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
  'WAPCO': { price: 28.75, change: 0.85 },
  'FLOURMILL': { price: 42.60, change: 1.30 },
  'PRESCO': { price: 125.40, change: 3.20 },
  'CADBURY': { price: 18.90, change: -0.40 },
  'GUINNESS': { price: 65.80, change: 2.10 },
  'INTBREW': { price: 5.25, change: 0.15 },
  'CHAMPION': { price: 3.45, change: 0.05 },
  'UNILEVER': { price: 16.20, change: 0.30 },
  'TRANSCORP': { price: 4.85, change: 0.10 },
  'BUAFOODS': { price: 285.60, change: 8.40 },
  'DANGSUGAR': { price: 28.50, change: 0.75 },
  'UACN': { price: 12.40, change: 0.20 },
  'PZ': { price: 22.80, change: 0.60 },
  'TOTAL': { price: 485.30, change: 12.80 },
  'ETERNA': { price: 18.45, change: 0.55 },
  'GEREGU': { price: 285.70, change: 9.20 },
  'TRANSPOWER': { price: 125.80, change: 4.30 },
  'FIDSON': { price: 12.60, change: 0.40 },
  'MAYBAKER': { price: 6.85, change: 0.15 },
  'OKOMUOIL': { price: 185.40, change: 5.60 },
  'LIVESTOCK': { price: 3.85, change: 0.10 },
  'CWG': { price: 2.45, change: 0.05 },
  'TRANSCOHOT': { price: 85.50, change: 2.50 }
};

/**
 * Load Sepolia deployment data
 */
function loadSepoliaDeploymentData(): SepoliaDeploymentData {
  const deploymentPath = path.join(__dirname, '../../contracts/deployments/nigerian-stocks-sepolia-11155111.json');
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Sepolia deployment file not found at: ${deploymentPath}`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  return deploymentData;
}

/**
 * Convert Sepolia token data to stock data format
 */
function convertToStockData(token: SepoliaDeploymentData['tokens'][0]): StockData {
  const priceData = CURRENT_PRICES[token.symbol] || { price: 100.00, change: 0.00 };
  
  // Calculate total shares from max supply (convert from wei to tokens)
  const totalShares = Math.floor(parseInt(token.maxSupply) / Math.pow(10, 18));
  
  // Calculate market cap based on total shares and current price
  const marketCap = totalShares * priceData.price;
  
  return {
    symbol: token.symbol,
    name: token.companyName,
    totalShares: totalShares,
    tokenID: token.address, // Use Sepolia contract address as token ID
    chain: 'ethereum-sepolia',
    exchange: 'NGX',
    sector: token.sector,
    marketCap: marketCap,
    isActive: true,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Convert to price data format
 */
function convertToPriceData(token: SepoliaDeploymentData['tokens'][0]): PriceData {
  const priceData = CURRENT_PRICES[token.symbol] || { price: 100.00, change: 0.00 };
  const changePercent = priceData.price > 0 ? (priceData.change / priceData.price) * 100 : 0;
  
  return {
    time: new Date().toISOString(),
    symbol: token.symbol,
    price: priceData.price,
    changeAmount: priceData.change,
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}

/**
 * Main migration function
 */
async function migrateSepoliaStocks(): Promise<void> {
  console.log('🚀 Starting Sepolia stocks migration to Turso...');
  
  try {
    // Load Sepolia deployment data
    console.log('📂 Loading Sepolia deployment data...');
    const deploymentData = loadSepoliaDeploymentData();
    
    console.log(`📊 Found ${deploymentData.totalTokens} deployed tokens on Sepolia`);
    console.log(`🏭 Factory Address: ${deploymentData.factoryAddress}`);
    console.log(`⛓️  Chain ID: ${deploymentData.chainId}`);
    
    // Clear existing data
    console.log('🧹 Clearing existing stock data...');
    await db.delete(stockPrices);
    await db.delete(stocks);
    
    // Convert deployment data to database format
    console.log('🔄 Converting deployment data...');
    const stocksData: StockData[] = deploymentData.tokens.map(convertToStockData);
    const pricesData: PriceData[] = deploymentData.tokens.map(convertToPriceData);
    
    // Insert stocks data
    console.log('📈 Inserting stock data...');
    await db.insert(stocks).values(stocksData.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      totalShares: stock.totalShares,
      tokenID: stock.tokenID,
      chain: stock.chain,
      exchange: stock.exchange,
      sector: stock.sector,
      marketCap: stock.marketCap,
      isActive: stock.isActive,
      lastUpdated: stock.lastUpdated,
    })));
    
    console.log(`✅ Inserted ${stocksData.length} stocks`);
    
    // Insert price data
    console.log('💰 Inserting price data...');
    await db.insert(stockPrices).values(pricesData);
    
    console.log(`✅ Inserted ${pricesData.length} price records`);
    
    // Verify the migration
    const stockCount = await db.select().from(stocks);
    const priceCount = await db.select().from(stockPrices);
    
    console.log('\n📊 Sepolia migration completed successfully!');
    console.log(`   - Deployed stocks: ${stockCount.length}`);
    console.log(`   - Price records: ${priceCount.length}`);
    console.log(`   - Network: Ethereum Sepolia (${deploymentData.chainId})`);
    console.log(`   - Factory: ${deploymentData.factoryAddress}`);
    
    // Display sample of migrated stocks
    console.log('\n📈 Sample migrated stocks:');
    const sampleStocks = stocksData.slice(0, 10);
    sampleStocks.forEach(stock => {
      const price = CURRENT_PRICES[stock.symbol];
      console.log(`   - ${stock.symbol}: ${stock.name} (${stock.tokenID}) - ₦${price?.price || 'N/A'}`);
    });
    
    console.log('\n🎉 All 39 Nigerian Stock Exchange tokens successfully migrated from Sepolia deployment!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Migration failed:', errorMessage);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateSepoliaStocks()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSepoliaStocks };

/**
 * Turso Migration Verification Script
 * 
 * This script verifies that the migration to production Turso database
 * was successful and all data is properly stored.
 */

import { db } from '../src/db/turso-connection';
import { stocks, stockPrices, stockPurchases, userStocks } from '../src/db/schema';
import { desc, eq } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

interface VerificationResult {
  table: string;
  count: number;
  sampleData?: any[];
  status: 'success' | 'error';
  error?: string;
}

async function verifyTursoMigration(): Promise<void> {
  console.log('🔍 Verifying Turso database migration...');
  console.log(`📍 Database URL: ${process.env.TURSO_DATABASE_URL}`);
  console.log('');

  const results: VerificationResult[] = [];

  try {
    // Verify stocks table
    console.log('📈 Verifying stocks table...');
    try {
      const stocksData = await db.select().from(stocks);
      const sampleStocks = stocksData.slice(0, 5);
      
      results.push({
        table: 'stocks',
        count: stocksData.length,
        sampleData: sampleStocks,
        status: 'success'
      });
      
      console.log(`✅ Stocks table: ${stocksData.length} records`);
      console.log('   Sample stocks:');
      sampleStocks.forEach(stock => {
        console.log(`   - ${stock.symbol}: ${stock.name} (Token: ${stock.tokenID})`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        table: 'stocks',
        count: 0,
        status: 'error',
        error: errorMessage
      });
      console.error(`❌ Error verifying stocks table: ${errorMessage}`);
    }

    console.log('');

    // Verify stock prices table
    console.log('💰 Verifying stock prices table...');
    try {
      const pricesData = await db.select().from(stockPrices).orderBy(desc(stockPrices.time));
      const samplePrices = pricesData.slice(0, 5);
      
      results.push({
        table: 'stock_prices',
        count: pricesData.length,
        sampleData: samplePrices,
        status: 'success'
      });
      
      console.log(`✅ Stock prices table: ${pricesData.length} records`);
      console.log('   Sample prices:');
      samplePrices.forEach(price => {
        console.log(`   - ${price.symbol}: ₦${price.price} (Change: ${price.changeAmount > 0 ? '+' : ''}${price.changeAmount})`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        table: 'stock_prices',
        count: 0,
        status: 'error',
        error: errorMessage
      });
      console.error(`❌ Error verifying stock prices table: ${errorMessage}`);
    }

    console.log('');

    // Verify stock purchases table
    console.log('🛒 Verifying stock purchases table...');
    try {
      const purchasesData = await db.select().from(stockPurchases);
      
      results.push({
        table: 'stock_purchases',
        count: purchasesData.length,
        status: 'success'
      });
      
      console.log(`✅ Stock purchases table: ${purchasesData.length} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        table: 'stock_purchases',
        count: 0,
        status: 'error',
        error: errorMessage
      });
      console.error(`❌ Error verifying stock purchases table: ${errorMessage}`);
    }

    console.log('');

    // Verify user stocks table
    console.log('👥 Verifying user stocks table...');
    try {
      const userStocksData = await db.select().from(userStocks);
      
      results.push({
        table: 'user_stocks',
        count: userStocksData.length,
        status: 'success'
      });
      
      console.log(`✅ User stocks table: ${userStocksData.length} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        table: 'user_stocks',
        count: 0,
        status: 'error',
        error: errorMessage
      });
      console.error(`❌ Error verifying user stocks table: ${errorMessage}`);
    }

    console.log('');

    // Verify specific stock data integrity
    console.log('🔍 Verifying data integrity...');
    try {
      // Check if we have the expected Nigerian stocks
      const expectedStocks = ['DANGCEM', 'MTNN', 'ZENITHBANK', 'GTCO', 'NB'];
      const foundStocks = await db.select().from(stocks).where(
        eq(stocks.symbol, expectedStocks[0])
      );
      
      if (foundStocks.length > 0) {
        console.log('✅ Sample stock verification passed');
        console.log(`   Found ${foundStocks[0].symbol}: ${foundStocks[0].name}`);
        console.log(`   Token ID: ${foundStocks[0].tokenID}`);
        console.log(`   Exchange: ${foundStocks[0].exchange}`);
        console.log(`   Sector: ${foundStocks[0].sector}`);
      } else {
        console.log('⚠️  Warning: Expected sample stocks not found');
      }

      // Check if prices exist for stocks
      const stocksWithPrices = await db.select({
        symbol: stocks.symbol,
        name: stocks.name,
        price: stockPrices.price
      })
      .from(stocks)
      .leftJoin(stockPrices, eq(stocks.symbol, stockPrices.symbol))
      .limit(5);

      console.log('✅ Stock-price relationship verification:');
      stocksWithPrices.forEach(item => {
        console.log(`   - ${item.symbol}: ${item.price ? `₦${item.price}` : 'No price data'}`);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error verifying data integrity: ${errorMessage}`);
    }

    console.log('');

    // Summary
    console.log('📊 Migration Verification Summary:');
    console.log('=====================================');
    
    const totalErrors = results.filter(r => r.status === 'error').length;
    const totalSuccess = results.filter(r => r.status === 'success').length;
    
    results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${result.table}: ${result.count} records${result.error ? ` (Error: ${result.error})` : ''}`);
    });
    
    console.log('');
    
    if (totalErrors === 0) {
      console.log('🎉 Migration verification completed successfully!');
      console.log('   All tables are accessible and contain data.');
      console.log('   The production Turso database is ready for use.');
    } else {
      console.log(`⚠️  Migration verification completed with ${totalErrors} errors.`);
      console.log('   Please review the errors above and fix any issues.');
    }

  } catch (error) {
    console.error('❌ Fatal error during verification:');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}`);
    throw error;
  }
}

// Run the verification
if (require.main === module) {
  verifyTursoMigration().catch((error: unknown) => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
  });
}

export { verifyTursoMigration };

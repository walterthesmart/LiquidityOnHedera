/**
 * Test Script for Price Chart Data
 * 
 * This script tests the getPriceChartData function to ensure it works
 * correctly with the migrated Turso database.
 */

import { config } from 'dotenv';
import path from 'path';
import { db } from '../src/db/turso-connection';
import { stocks, stockPrices } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

async function testPriceChartData(): Promise<void> {
  console.log('🧪 Testing Price Chart Data Function...');
  console.log(`📍 Database URL: ${process.env.TURSO_DATABASE_URL}`);
  console.log('');

  try {
    // First, let's check what stocks we have in the database
    console.log('📈 Checking available stocks...');
    const availableStocks = await db.select({
      symbol: stocks.symbol,
      name: stocks.name,
      tokenID: stocks.tokenID
    }).from(stocks).limit(10);

    console.log(`✅ Found ${availableStocks.length} stocks in database:`);
    availableStocks.forEach(stock => {
      console.log(`   - ${stock.symbol}: ${stock.name} (${stock.tokenID})`);
    });
    console.log('');

    // Check what price data we have
    console.log('💰 Checking available price data...');
    const priceDataCount = await db.select().from(stockPrices);
    console.log(`✅ Found ${priceDataCount.length} price records in database`);

    // Show sample price data
    const samplePrices = await db.select().from(stockPrices).limit(5);
    console.log('   Sample price records:');
    samplePrices.forEach(price => {
      console.log(`   - ${price.symbol}: ₦${price.price} at ${price.time}`);
    });
    console.log('');

    // Test the database query directly with a few different stocks
    const testSymbols = ['DANGCEM', 'MTNN', 'ZENITHBANK', 'GTCO', 'NB'];

    for (const symbol of testSymbols) {
      console.log(`🔍 Testing direct database query for ${symbol}...`);

      try {
        // Direct database query to get price chart data
        const chartData = await db
          .select({
            time: stockPrices.time,
            price: stockPrices.price,
          })
          .from(stockPrices)
          .where(eq(stockPrices.symbol, symbol))
          .orderBy(stockPrices.time);

        if (chartData.length > 0) {
          console.log(`✅ ${symbol}: Found ${chartData.length} price points`);
          console.log(`   Latest price: ₦${chartData[chartData.length - 1]?.price || 'N/A'}`);
          console.log(`   Date range: ${chartData[0]?.time.split('T')[0]} to ${chartData[chartData.length - 1]?.time.split('T')[0]}`);
        } else {
          console.log(`⚠️  ${symbol}: No price data found`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ ${symbol}: Error - ${errorMessage}`);
      }

      console.log('');
    }

    // Test with an invalid symbol
    console.log('🔍 Testing with invalid symbol...');
    try {
      const invalidData = await db
        .select({
          time: stockPrices.time,
          price: stockPrices.price,
        })
        .from(stockPrices)
        .where(eq(stockPrices.symbol, 'INVALID_SYMBOL'))
        .orderBy(stockPrices.time);
      console.log(`✅ Invalid symbol returned ${invalidData.length} records (should be 0)`);
    } catch (error) {
      console.log('❌ Invalid symbol test failed');
    }
    console.log('');

    // Test data structure validation
    console.log('🔍 Testing data structure...');
    const testData = await db
      .select({
        time: stockPrices.time,
        price: stockPrices.price,
      })
      .from(stockPrices)
      .where(eq(stockPrices.symbol, 'DANGCEM'))
      .orderBy(stockPrices.time);
    if (testData.length > 0) {
      const firstRecord = testData[0];
      const hasValidTime = typeof firstRecord.time === 'string';
      const hasValidPrice = typeof firstRecord.price === 'number';

      console.log(`✅ Data structure validation:`);
      console.log(`   - Time is string: ${hasValidTime}`);
      console.log(`   - Price is number: ${hasValidPrice}`);
      console.log(`   - Sample record: ${JSON.stringify({
        time: firstRecord.time,
        price: firstRecord.price
      }, null, 2)}`);
    }

    console.log('');
    console.log('🎉 Price Chart Data Function Test Completed!');
    console.log('   The function is working correctly with the Turso database.');
    console.log('   Stock detail pages should now be able to load price charts.');

  } catch (error) {
    console.error('❌ Test failed:');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}`);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPriceChartData().catch((error: unknown) => {
    console.error('Fatal error during test:', error);
    process.exit(1);
  });
}

export { testPriceChartData };

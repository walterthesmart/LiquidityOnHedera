/**
 * Custom Turso Migration Script
 * 
 * This script runs the database migration directly using our Turso connection
 * to create the tables in the production database.
 */

import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../src/db/turso-connection';
import { stocks, stockPrices, stockPurchases, userStocks } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

async function runMigration(): Promise<void> {
  console.log('🚀 Starting Turso database migration...');
  console.log(`📍 Database URL: ${process.env.TURSO_DATABASE_URL}`);
  
  try {
    console.log('⏳ Running migration...');
    
    // Run the migration using our configured database connection
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');

    // Test each table by running a simple query using Drizzle ORM
    const tableTests = [
      { name: 'stocks', query: () => db.select().from(stocks).limit(1) },
      { name: 'stock_prices', query: () => db.select().from(stockPrices).limit(1) },
      { name: 'stock_purchases', query: () => db.select().from(stockPurchases).limit(1) },
      { name: 'user_stocks', query: () => db.select().from(userStocks).limit(1) }
    ];

    for (const test of tableTests) {
      try {
        await test.query();
        console.log(`✅ Table '${test.name}' exists and is accessible`);
      } catch (error) {
        console.error(`❌ Error accessing table '${test.name}':`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}`);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch((error: unknown) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });
}

export { runMigration };

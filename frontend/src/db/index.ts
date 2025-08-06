/**
 * Database Interface - Turso Implementation
 *
 * This file provides the main database interface using Turso (SQLite)
 * instead of MongoDB. It maintains compatibility with the existing
 * application code.
 */

// Import Turso database operations
import tursoDatabase from "./turso-operations";

// Re-export the database instance as default
export default tursoDatabase;

// Re-export types for compatibility
export type { GetStocksArgs } from "./turso-operations";

export type {
  STOCKS,
  STOCKPRICES,
  STOCKPRICESV2,
  STOCKPURCHASES,
  USERSTOCKS,
  userstock,
} from "./schema";

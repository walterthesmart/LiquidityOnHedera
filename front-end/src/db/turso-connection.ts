/**
 * Turso Database Connection
 *
 * This file handles the connection to Turso (SQLite) database
 * using Drizzle ORM and libSQL client.
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Load environment variables
import "../../envConfig";

// Database configuration - using production Turso database
const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN environment variable is required");
}

// Create libSQL client
const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Connection status tracking
let isConnected = false;

// Health check function
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  error?: string;
}> => {
  try {
    // Simple query to test connection
    await db.select().from(schema.stocks).limit(1);
    isConnected = true;
    return { healthy: true };
  } catch (error) {
    isConnected = false;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";
    console.error("Database health check failed:", errorMessage);
    return { healthy: false, error: errorMessage };
  }
};

// Get connection status
export const getConnectionStatus = () => isConnected;

// Ensure connection function (for compatibility with existing code)
export const ensureConnection = async (): Promise<void> => {
  try {
    const healthCheck = await checkDatabaseHealth();
    if (!healthCheck.healthy) {
      throw new Error(`Database connection failed: ${healthCheck.error}`);
    }
    console.log("Successfully connected to Turso database");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown connection error";
    console.error("Failed to connect to Turso database:", errorMessage);
    throw new Error(`Database connection failed: ${errorMessage}`);
  }
};

// Export client for direct access if needed
export { client };

// Default export for compatibility
export default db;

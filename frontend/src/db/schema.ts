/**
 * Turso Database Schema
 *
 * This file defines the database schema for the Liquidity Nigerian Stock Trading Platform
 * using Drizzle ORM with SQLite (Turso) as the database.
 */

import { sql } from "drizzle-orm";
import { integer, text, real, sqliteTable } from "drizzle-orm/sqlite-core";

// Stocks table - replaces MongoDB stocks collection
export const stocks = sqliteTable("stocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  totalShares: integer("total_shares").notNull(),
  tokenID: text("token_id").notNull(),
  chain: text("chain").notNull(),
  exchange: text("exchange").notNull(), // "NGX" for Nigerian Stock Exchange
  sector: text("sector").notNull(), // e.g., "Banking", "Cement", "Telecommunications"
  marketCap: integer("market_cap"), // Market capitalization in NGN
  hederaTokenAddress: text("hedera_token_address"), // Hedera token contract address
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUpdated: text("last_updated")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Stock prices table - replaces MongoDB stockPricesv2 collection
export const stockPrices = sqliteTable("stock_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  time: text("time").notNull(), // ISO datetime string
  symbol: text("symbol").notNull(),
  price: real("price").notNull(),
  changeAmount: real("change_amount").notNull(),
  changePercent: real("change_percent"),
});

// Stock purchases table - replaces MongoDB stockPurchases collection
export const stockPurchases = sqliteTable("stock_purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  txHash: text("tx_hash"), // Legacy - keeping for migration
  hederaTxId: text("hedera_tx_id"), // Hedera transaction ID
  userWallet: text("user_wallet").notNull(), // Hedera account ID or EVM address
  stockSymbol: text("stock_symbol").notNull(),
  name: text("name").notNull(),
  amountShares: integer("amount_shares").notNull(),
  buyPrice: real("buy_price").notNull(), // Price in NGN
  buyPriceHbar: real("buy_price_hbar"), // Price in HBAR
  purchaseDate: text("purchase_date")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed"
  transactionType: text("transaction_type").notNull().default("buy"), // "buy", "sell"
  paystackId: text("paystack_id"), // Nigerian payment processor
  network: text("network").notNull().default("hedera-testnet"), // "hedera-testnet", "hedera-mainnet"
  gasFee: real("gas_fee"), // Transaction fee in HBAR
});

// User stocks table - replaces MongoDB userStocks collection
export const userStocks = sqliteTable("user_stocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userAddress: text("user_address").notNull(),
  stockSymbol: text("stock_symbol").notNull(),
  numberStocks: integer("number_stocks").notNull(),
  tokenId: text("token_id").notNull(),
});

// Export types for TypeScript
export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;

export type StockPrice = typeof stockPrices.$inferSelect;
export type NewStockPrice = typeof stockPrices.$inferInsert;

export type StockPurchase = typeof stockPurchases.$inferSelect;
export type NewStockPurchase = typeof stockPurchases.$inferInsert;

export type UserStock = typeof userStocks.$inferSelect;
export type NewUserStock = typeof userStocks.$inferInsert;

// Legacy types for compatibility with existing code
export interface STOCKS {
  symbol: string;
  name: string;
  totalShares: number;
  tokenID: string;
  chain: string;
  exchange: string;
  sector: string;
  marketCap?: number;
  hederaTokenAddress?: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface STOCKPRICES {
  symbol: string;
  price: number;
  change: number;
}

export interface STOCKPRICESV2 {
  time: Date;
  details: STOCKPRICES[];
}

export interface STOCKPURCHASES {
  mpesa_request_id?: string; // Legacy
  txHash?: string;
  hederaTxId?: string;
  user_wallet: string;
  stock_symbol: string;
  name: string;
  amount_shares: number;
  buy_price: number;
  buy_price_hbar?: number;
  purchase_date: Date;
  status: string;
  transaction_type: string;
  paystack_id?: string;
  network: string;
  gas_fee?: number;
}

export interface userstock {
  symbol: string;
  name: string;
  number_stocks: number;
  tokenId: string;
}

export interface USERSTOCKS {
  user_address: string;
  stocks: userstock[];
}

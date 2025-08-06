/**
 * Turso Database Operations
 *
 * This file contains all database operations using Turso (SQLite) with Drizzle ORM.
 * It replaces the MongoDB operations with SQL-based equivalents.
 */

import { eq, desc, and } from "drizzle-orm";
import { db, checkDatabaseHealth, ensureConnection } from "./turso-connection";
import {
  stocks,
  stockPrices,
  stockPurchases,
  userStocks,
  type STOCKS,
  type STOCKPRICESV2,
  type STOCKPURCHASES,
  type USERSTOCKS,
} from "./schema";
import { Errors, MyError } from "@/constants/errors";
import { PaymentStatus } from "@/constants/status";

// Interface for compatibility with existing code
interface GetStocks {
  id: string;
  name: string;
  tokenID: string;
  symbol: string;
  chain: string;
}

export interface GetStocksArgs {
  chain?: string;
  symbol?: string;
}

interface StockPrices {
  symbol: string;
  price: number;
  change: number;
}

interface UpdateUserStockArgs {
  user_address: string;
  stock_symbol: string;
  amount_shares: number;
  operation: "buy" | "sell";
}

export class TursoDatabase {
  async createStockInDB(args: STOCKS): Promise<void> {
    try {
      await db.insert(stocks).values({
        symbol: args.symbol,
        name: args.name,
        totalShares: args.totalShares,
        tokenID: args.tokenID,
        chain: args.chain,
        exchange: args.exchange,
        sector: args.sector,
        marketCap: args.marketCap,
        hederaTokenAddress: args.hederaTokenAddress,
        isActive: args.isActive,
        lastUpdated: args.lastUpdated.toISOString(),
      });
    } catch (err) {
      console.log("Error creating stock", err);
      throw new MyError(Errors.NOT_CREATE_STOCK_DB);
    }
  }

  async checkIfStockExists(
    symbol: string,
    chain: string,
  ): Promise<string | null> {
    try {
      const result = await db
        .select({ tokenID: stocks.tokenID })
        .from(stocks)
        .where(and(eq(stocks.symbol, symbol), eq(stocks.chain, chain)))
        .limit(1);

      return result.length > 0 ? result[0].tokenID : null;
    } catch (err) {
      console.log("Error checking if stock exists", err);
      throw new MyError("Error checking if stock exists");
    }
  }

  async getStocks(): Promise<GetStocks[]> {
    try {
      // Check database health before attempting operation
      const healthCheck = await checkDatabaseHealth();
      if (!healthCheck.healthy) {
        console.error("Database health check failed:", healthCheck.error);
        throw new Error(`Database is not healthy: ${healthCheck.error}`);
      }

      // Ensure we have a valid connection
      await ensureConnection();

      const result = await db
        .select({
          id: stocks.id,
          name: stocks.name,
          symbol: stocks.symbol,
          tokenID: stocks.tokenID,
          chain: stocks.chain,
        })
        .from(stocks);

      return result.map((stock) => ({
        id: stock.id.toString(),
        name: stock.name,
        tokenID: stock.tokenID,
        symbol: stock.symbol,
        chain: stock.chain,
      }));
    } catch (err) {
      console.log("Could not get stocks from db", err);
      throw new MyError(Errors.NOT_GET_STOCKS_DB);
    }
  }

  async getStockPricesFromDB(): Promise<StockPrices[]> {
    try {
      // Get the latest prices for each symbol
      const result = await db
        .select({
          symbol: stockPrices.symbol,
          price: stockPrices.price,
          changeAmount: stockPrices.changeAmount,
        })
        .from(stockPrices)
        .orderBy(desc(stockPrices.time))
        .limit(100); // Get recent prices

      // Group by symbol and get the latest price for each
      const latestPrices = new Map<string, StockPrices>();

      for (const price of result) {
        if (!latestPrices.has(price.symbol)) {
          latestPrices.set(price.symbol, {
            symbol: price.symbol,
            price: price.price,
            change: price.changeAmount,
          });
        }
      }

      return Array.from(latestPrices.values());
    } catch (err) {
      console.log("Error getting stock prices from db", err);
      throw new MyError(Errors.NOT_GET_STOCK_PRICES_DB);
    }
  }

  async getPriceChartData(
    symbol: string,
  ): Promise<{ time: Date; price: number }[]> {
    try {
      // Get historical price data for a specific symbol
      const result = await db
        .select({
          time: stockPrices.time,
          price: stockPrices.price,
        })
        .from(stockPrices)
        .where(eq(stockPrices.symbol, symbol))
        .orderBy(stockPrices.time); // Order by time ascending for chart data

      return result.map((price) => ({
        time: new Date(price.time),
        price: price.price,
      }));
    } catch (err) {
      console.log("Error getting price chart data for", symbol, err);
      throw new MyError(Errors.NOT_GET_PRICES);
    }
  }

  async updateStockPricesInDB(args: STOCKPRICESV2): Promise<void> {
    try {
      // Convert the MongoDB format to individual price records
      const priceRecords = args.details.map((detail) => ({
        time: args.time.toISOString(),
        symbol: detail.symbol,
        price: detail.price,
        changeAmount: detail.change,
        changePercent:
          detail.change > 0
            ? (detail.change / (detail.price - detail.change)) * 100
            : 0,
      }));

      await db.insert(stockPrices).values(priceRecords);
    } catch (err) {
      console.log("Could not update stock prices in db", err);
      throw new MyError(Errors.NOT_UPDATE_STOCK_PRICES_DB);
    }
  }

  async createStockPurchaseInDB(args: STOCKPURCHASES): Promise<void> {
    try {
      await db.insert(stockPurchases).values({
        txHash: args.txHash,
        hederaTxId: args.hederaTxId,
        userWallet: args.user_wallet,
        stockSymbol: args.stock_symbol,
        name: args.name,
        amountShares: args.amount_shares,
        buyPrice: args.buy_price,
        buyPriceHbar: args.buy_price_hbar,
        purchaseDate: args.purchase_date.toISOString(),
        status: args.status,
        transactionType: args.transaction_type,
        paystackId: args.paystack_id,
        network: args.network,
        gasFee: args.gas_fee,
      });
    } catch (err) {
      console.log("Error creating stock purchase", err);
      throw new MyError(Errors.NOT_STORE_STOCK_PURCHASE_DB);
    }
  }

  // Alias for compatibility
  async storeStockPurchase(args: STOCKPURCHASES): Promise<void> {
    return this.createStockPurchaseInDB(args);
  }

  async getTokenDetails(symbol: string): Promise<STOCKS | null> {
    try {
      const result = await db
        .select()
        .from(stocks)
        .where(eq(stocks.symbol, symbol))
        .limit(1);

      if (result.length === 0) return null;

      const stock = result[0];
      return {
        symbol: stock.symbol,
        name: stock.name,
        totalShares: stock.totalShares,
        tokenID: stock.tokenID,
        chain: stock.chain,
        exchange: stock.exchange,
        sector: stock.sector,
        marketCap: stock.marketCap || undefined,
        hederaTokenAddress: stock.hederaTokenAddress || undefined,
        isActive: stock.isActive,
        lastUpdated: new Date(stock.lastUpdated),
      };
    } catch (err) {
      console.log("Could not get token details of", symbol, err);
      throw new MyError(Errors.NOT_GET_STOCK_DB);
    }
  }

  async updateStockPurchaseStatus(
    paystack_id: string,
    status: PaymentStatus,
  ): Promise<void> {
    try {
      await db
        .update(stockPurchases)
        .set({ status })
        .where(eq(stockPurchases.paystackId, paystack_id));
    } catch (err) {
      console.log("Could not update stock purchase status", err);
      throw new MyError(Errors.NOT_UPDATE_PURCHASE_STATUS_DB);
    }
  }

  // Additional helper methods for user stocks management
  async getUserStocks(userAddress: string): Promise<USERSTOCKS | null> {
    try {
      const result = await db
        .select()
        .from(userStocks)
        .where(eq(userStocks.userAddress, userAddress));

      if (result.length === 0) return null;

      const stocksArray = result.map((stock) => ({
        symbol: stock.stockSymbol,
        name: "", // We'll need to join with stocks table for name
        number_stocks: stock.numberStocks,
        tokenId: stock.tokenId,
      }));

      return {
        user_address: userAddress,
        stocks: stocksArray,
      };
    } catch (err) {
      console.log("Error getting user stocks", err);
      throw new MyError(Errors.NOT_GET_USER_STOCKS);
    }
  }

  async updateUserStockRecord(args: UpdateUserStockArgs): Promise<void> {
    try {
      const existingRecord = await db
        .select()
        .from(userStocks)
        .where(
          and(
            eq(userStocks.userAddress, args.user_address),
            eq(userStocks.stockSymbol, args.stock_symbol),
          ),
        )
        .limit(1);

      if (existingRecord.length > 0) {
        // Update existing record
        const currentShares = existingRecord[0].numberStocks;
        const newShares =
          args.operation === "buy"
            ? currentShares + args.amount_shares
            : currentShares - args.amount_shares;

        if (newShares < 0) {
          throw new MyError(Errors.CANNOT_SELL_MORE_THAN_OWNED);
        }

        await db
          .update(userStocks)
          .set({ numberStocks: newShares })
          .where(
            and(
              eq(userStocks.userAddress, args.user_address),
              eq(userStocks.stockSymbol, args.stock_symbol),
            ),
          );
      } else {
        // Create new record (only for buy operations)
        if (args.operation === "sell") {
          throw new MyError(Errors.NOT_CREATE_NEW_RECORD_SELL);
        }

        // Get token ID from stocks table
        const stockInfo = await this.getTokenDetails(args.stock_symbol);
        if (!stockInfo) {
          throw new MyError(Errors.NOT_GET_STOCK_DB);
        }

        await db.insert(userStocks).values({
          userAddress: args.user_address,
          stockSymbol: args.stock_symbol,
          numberStocks: args.amount_shares,
          tokenId: stockInfo.tokenID,
        });
      }
    } catch (err) {
      console.log("Error updating user stock record", err);
      if (err instanceof MyError) {
        throw err;
      }
      throw new MyError(Errors.UNKNOWN);
    }
  }

  // Additional methods for compatibility with existing code
  async getStocksOwnedByUser(userAddress: string): Promise<USERSTOCKS | null> {
    return this.getUserStocks(userAddress);
  }

  async updateNumberStocksOwnedByUser(
    args: UpdateUserStockArgs,
  ): Promise<void> {
    return this.updateUserStockRecord(args);
  }

  async getStockPurchases(
    userAddress: string,
    status?: string,
  ): Promise<STOCKPURCHASES[]> {
    try {
      const whereConditions = [eq(stockPurchases.userWallet, userAddress)];

      if (status) {
        whereConditions.push(eq(stockPurchases.status, status));
      }

      const result = await db
        .select()
        .from(stockPurchases)
        .where(and(...whereConditions));

      return result.map((purchase) => ({
        txHash: purchase.txHash || undefined,
        hederaTxId: purchase.hederaTxId || undefined,
        user_wallet: purchase.userWallet,
        stock_symbol: purchase.stockSymbol,
        name: purchase.name,
        amount_shares: purchase.amountShares,
        buy_price: purchase.buyPrice,
        buy_price_hbar: purchase.buyPriceHbar || undefined,
        purchase_date: new Date(purchase.purchaseDate),
        status: purchase.status,
        transaction_type: purchase.transactionType,
        paystack_id: purchase.paystackId || undefined,
        network: purchase.network,
        gas_fee: purchase.gasFee || undefined,
      }));
    } catch (err) {
      console.log("Error getting stock purchases", err);
      throw new MyError(Errors.NOT_GET_USER_TRANSACTIONS);
    }
  }
}

// Create and export database instance
const tursoDatabase = new TursoDatabase();
export default tursoDatabase;

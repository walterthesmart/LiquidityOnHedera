"use server";

import { Errors, MyError } from "@/constants/errors";
import database from "@/db";
import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import { StockData } from "@/types";
// MongoDB collections removed - using Turso database now
// Legacy Hedera token functions - now deprecated since migrating to Bitfinity EVM
const hasHederaToken = (symbol: string): boolean => {
  // Always return false since we migrated to Bitfinity EVM
  console.debug("Legacy Hedera check for symbol:", symbol);
  return false;
};
const getTokenIdBySymbol = (symbol: string): string | null => {
  // Always return null since we migrated to Bitfinity EVM
  console.debug("Legacy Hedera token ID check for symbol:", symbol);
  return null;
};
type HederaTokenSymbol = string;
import { logError, fetchWithRetry } from "@/lib/utils";

// Interface for scraped stock price data
interface ScrapedStockPrice {
  symbol: string;
  price: number;
  change: number;
  lastUpdated: Date;
}
// list of user agent strings to rotate
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  // ...
];
export async function getStocks(): Promise<StockData[]> {
  try {
    console.log("Starting getStocks operation...");

    // Fetch from the db and scrape in parallel with improved error handling
    const [dbStocks, stockPrices] = await Promise.all([
      database.getStocks().catch((err) => {
        logError("getStocks:database", err, {
          operation: "database.getStocks",
          timestamp: new Date().toISOString(),
        });

        // Check if it's a connection error
        if (
          err instanceof Error &&
          (err.message.includes("ECONNREFUSED") ||
            err.message.includes("connection") ||
            err.message.includes("timeout"))
        ) {
          console.warn(
            "Database connection failed, returning empty array as fallback",
          );
          // Return empty array to allow the application to continue with price data only
          return [];
        }

        // For other errors, still return empty array but log more details
        console.warn(
          "Database operation failed, returning empty array as fallback",
        );
        return [];
      }),
      getStockPricesWithCache().catch((err) => {
        logError("getStocks:stockPrices", err, {
          operation: "getStockPricesWithCache",
          timestamp: new Date().toISOString(),
        });
        return []; // Return empty array as fallback
      }),
    ]);

    console.log(`Retrieved ${dbStocks.length} stocks from database`);
    console.log(`Retrieved ${stockPrices.length} stock prices`);

    // If no stocks from database, we can't proceed meaningfully
    if (dbStocks.length === 0) {
      console.warn(
        "No stocks retrieved from database. This might indicate a database connection issue.",
      );

      // Check if we have any fallback data or if this is expected
      // For now, return empty array but with proper logging
      return [];
    }

    // Get price and change of each stock
    const enrichedStocks = dbStocks.map((s) => {
      const entry = stockPrices.find((sy) => sy.symbol === s.symbol);

      // Add Hedera integration data
      const isHederaDeployed = hasHederaToken(s.symbol);
      const hederaTokenId = isHederaDeployed
        ? getTokenIdBySymbol(s.symbol as HederaTokenSymbol)
        : undefined;

      return {
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        price: entry?.price ?? 0.0,
        change: entry?.change ?? 0.0,
        tokenID: s.tokenID,
        chain: s.chain,
        // Hedera integration fields
        isHederaDeployed,
        hederaTokenId,
        blockchain: "hedera" as const,
        tokenStandard: "HTS" as const,
      };
    });

    console.log(
      `Successfully processed ${enrichedStocks.length} stocks with price data`,
    );
    return enrichedStocks;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Critical error in getStocks:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      stack: err instanceof Error ? err.stack : undefined,
    });

    // Provide more user-friendly error messages
    if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("connection")
    ) {
      throw new MyError(
        "Database connection failed. Please check if the database service is running.",
      );
    } else if (errorMessage.includes("timeout")) {
      throw new MyError(
        "Database operation timed out. Please try again later.",
      );
    } else {
      throw new MyError(`${Errors.NOT_GET_STOCKS}: ${errorMessage}`);
    }
  }
}
//Function to get stock by symbol. uses getstocks fun
export async function getStockBySymbol(
  symbol: string,
): Promise<StockData | undefined> {
  const allStocks = await getStocks(); // Reuse existing logic
  return allStocks.find((a) => a.symbol === symbol);
}

const getStockPricesWithCache = unstable_cache(
  async () => {
    console.log("...using cache");
    return await getStockPrices();
  },
  ["stock-prices"],
  { revalidate: 50 }, // 50 seconds
);

export async function getStockPrices(): Promise<ScrapedStockPrice[]> {
  try {
    // Load the site
    const stockPrices: ScrapedStockPrice[] = [];

    console.log("...attempting to scrape with a 7 second timeout");
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Use our enhanced fetch with retry logic
    const response = await fetchWithRetry(
      "https://afx.kwayisi.org/nse/",
      {
        headers: {
          "User-Agent": userAgent,
        },
      },
      2,
      1000,
    ); // 2 retries with 1 second delay

    const data = await response.text();

    // Extract data from site
    const $ = cheerio.load(data);

    $("div.t > table > tbody > tr").each((_idx, el) => {
      const data = $(el).extract({
        symbol: {
          selector: "td:first",
        },
        price: {
          selector: "td:eq(3)",
        },
        change: {
          selector: "td:eq(4)",
        },
      });
      stockPrices.push({
        symbol: data.symbol ?? "",
        price: data.price ? Number.parseFloat(data.price) : 0.0,
        change: data.change ? Number.parseFloat(data.change) : 0.0,
        lastUpdated: new Date(),
      });
    });

    // Update database with stock prices
    console.log("...updating prices in db");
    await database.updateStockPricesInDB({
      time: new Date(),
      details: stockPrices,
    });

    return stockPrices;
  } catch (err) {
    logError("getStockPrices:scraping", err, {
      operation: "web_scraping",
      url: "https://afx.kwayisi.org/nse/",
      timestamp: new Date().toISOString(),
    });

    console.error("...web scraping failed, using fallback values");
    //throw new MyError(Errors.NOT_GET_STOCK_PRICES);
    //TODO: FIND A WAY OF GETTING FALLBACK DATA
    try {
      const stocks = await database.getStockPricesFromDB();
      // Convert StockPrices to STOCKPRICES by adding lastUpdated
      return stocks.map((stock) => ({
        ...stock,
        lastUpdated: new Date(),
      }));
    } catch (err) {
      console.log("...error getting stocks from db", err);
      return [];
    }
  }
}

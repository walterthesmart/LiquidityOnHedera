/**
 * Server actions for enhanced Nigerian stocks with Hedera integration
 */

"use server";

import {
  getEnhancedNigerianStocks,
  getEnhancedStockBySymbol,
  getDeployedHederaStocks,
  getPendingHederaStocks,
  getHederaDeploymentStats,
  getStocksByDeploymentStatus,
  getStocksBySectorWithHederaInfo,
  validateAndGetEnhancedStock,
  searchEnhancedStocks,
  EnhancedStockData,
} from "@/lib/enhanced-stock-data";

import {
  fetchEnhancedNigerianStockPrice,
  fetchAllEnhancedNigerianStockPrices,
  fetchHederaDeployedStockPrices,
  EnhancedStockPrice,
} from "@/lib/nigerian-stock-price-service";

/**
 * Get all enhanced Nigerian stocks with Hedera integration
 */
export async function getEnhancedStocks(): Promise<EnhancedStockData[]> {
  try {
    return getEnhancedNigerianStocks();
  } catch (error) {
    console.error("Error fetching enhanced stocks:", error);
    throw new Error("Failed to fetch enhanced stocks");
  }
}

/**
 * Get enhanced stock by symbol
 */
export async function getEnhancedStockBySymbolAction(
  symbol: string,
): Promise<EnhancedStockData | null> {
  try {
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    return getEnhancedStockBySymbol(symbol.toUpperCase());
  } catch (error) {
    console.error("Error fetching enhanced stock by symbol:", error);
    throw new Error(`Failed to fetch enhanced stock for symbol: ${symbol}`);
  }
}

/**
 * Get only stocks deployed on Hedera
 */
export async function getHederaDeployedStocks(): Promise<EnhancedStockData[]> {
  try {
    return getDeployedHederaStocks();
  } catch (error) {
    console.error("Error fetching Hedera deployed stocks:", error);
    throw new Error("Failed to fetch Hedera deployed stocks");
  }
}

/**
 * Get stocks not yet deployed on Hedera
 */
export async function getPendingHederaStocksAction(): Promise<
  EnhancedStockData[]
> {
  try {
    return getPendingHederaStocks();
  } catch (error) {
    console.error("Error fetching pending Hedera stocks:", error);
    throw new Error("Failed to fetch pending Hedera stocks");
  }
}

/**
 * Get Hedera deployment statistics
 */
export async function getHederaDeploymentStatsAction() {
  try {
    return getHederaDeploymentStats();
  } catch (error) {
    console.error("Error fetching Hedera deployment stats:", error);
    throw new Error("Failed to fetch Hedera deployment statistics");
  }
}

/**
 * Get stocks grouped by deployment status
 */
export async function getStocksByDeploymentStatusAction() {
  try {
    // Return all stocks grouped by status
    const deployed = await getStocksByDeploymentStatus("deployed");
    const pending = await getStocksByDeploymentStatus("pending");
    const notDeployed = await getStocksByDeploymentStatus("not_deployed");

    return {
      deployed,
      pending,
      not_deployed: notDeployed,
    };
  } catch (error) {
    console.error("Error fetching stocks by deployment status:", error);
    throw new Error("Failed to fetch stocks by deployment status");
  }
}

/**
 * Get stocks grouped by sector with Hedera info
 */
export async function getStocksBySectorWithHederaInfoAction(sector: string) {
  try {
    return getStocksBySectorWithHederaInfo(sector);
  } catch (error) {
    console.error("Error fetching stocks by sector with Hedera info:", error);
    throw new Error("Failed to fetch stocks by sector with Hedera info");
  }
}

/**
 * Validate stock symbol and get enhanced data
 */
export async function validateAndGetEnhancedStockAction(symbol: string) {
  try {
    return validateAndGetEnhancedStock(symbol);
  } catch (error) {
    console.error("Error validating and fetching enhanced stock:", error);
    throw new Error(`Failed to validate stock symbol: ${symbol}`);
  }
}

/**
 * Search enhanced stocks with filters
 */
export async function searchEnhancedStocksAction(
  query: string,
  filters?: {
    sector?: string;
    isHederaDeployed?: boolean;
    minMarketCap?: number;
    maxMarketCap?: number;
  },
): Promise<EnhancedStockData[]> {
  try {
    // Get search results and apply filters
    let results = await searchEnhancedStocks(query);

    if (filters) {
      if (filters.sector) {
        results = results.filter((stock) => stock.sector === filters.sector);
      }
      if (filters.isHederaDeployed !== undefined) {
        results = results.filter(
          (stock) => stock.isBitfinityDeployed === filters.isHederaDeployed,
        );
      }
      if (filters.minMarketCap !== undefined) {
        results = results.filter(
          (stock) => (stock.marketCap || 0) >= filters.minMarketCap!,
        );
      }
      if (filters.maxMarketCap !== undefined) {
        results = results.filter(
          (stock) => (stock.marketCap || 0) <= filters.maxMarketCap!,
        );
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching enhanced stocks:", error);
    throw new Error("Failed to search enhanced stocks");
  }
}

/**
 * Get enhanced stock price with Hedera integration
 */
export async function getEnhancedStockPrice(
  symbol: string,
): Promise<EnhancedStockPrice | null> {
  try {
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    return await fetchEnhancedNigerianStockPrice(symbol.toUpperCase());
  } catch (error) {
    console.error("Error fetching enhanced stock price:", error);
    throw new Error(`Failed to fetch enhanced price for symbol: ${symbol}`);
  }
}

/**
 * Get all enhanced stock prices
 */
export async function getAllEnhancedStockPrices(): Promise<
  EnhancedStockPrice[]
> {
  try {
    return await fetchAllEnhancedNigerianStockPrices();
  } catch (error) {
    console.error("Error fetching all enhanced stock prices:", error);
    throw new Error("Failed to fetch all enhanced stock prices");
  }
}

/**
 * Get prices for Hedera-deployed stocks only
 */
export async function getHederaDeployedStockPrices(): Promise<
  EnhancedStockPrice[]
> {
  try {
    return await fetchHederaDeployedStockPrices();
  } catch (error) {
    console.error("Error fetching Hedera deployed stock prices:", error);
    throw new Error("Failed to fetch Hedera deployed stock prices");
  }
}

/**
 * Get comprehensive stock data with prices and Hedera integration
 */
export async function getComprehensiveStockData(symbol?: string) {
  try {
    if (symbol) {
      // Get specific stock data
      const stockData = await getEnhancedStockBySymbolAction(symbol);
      const priceData = await getEnhancedStockPrice(symbol);

      return {
        stock: stockData,
        price: priceData,
        isHederaDeployed: stockData?.isBitfinityDeployed || false,
        hederaTokenId: stockData?.hederaTokenAddress,
        hederaExplorerUrl: stockData?.bitfinityExplorerUrl,
      };
    } else {
      // Get all stocks data
      const stocksData = await getEnhancedStocks();
      const pricesData = await getAllEnhancedStockPrices();
      const deploymentStats = await getHederaDeploymentStatsAction();

      // Combine stock and price data
      const combinedData = stocksData.map((stock) => {
        const price = pricesData.find((p) => p.symbol === stock.symbol);
        return {
          ...stock,
          price: price?.price || 0,
          change: price?.change || 0,
          volume: price?.volume || 0,
          lastUpdated: price?.lastUpdated || new Date().toISOString(),
        };
      });

      return {
        stocks: combinedData,
        deploymentStats,
        totalStocks: stocksData.length,
        hederaDeployedCount: deploymentStats.deployed,
        pendingDeploymentCount: deploymentStats.pending,
      };
    }
  } catch (error) {
    console.error("Error fetching comprehensive stock data:", error);
    throw new Error("Failed to fetch comprehensive stock data");
  }
}

/**
 * Get market overview with Hedera integration stats
 */
export async function getMarketOverviewWithHedera() {
  try {
    const [allPrices, hederaPrices, deploymentStats, sectorData] =
      await Promise.all([
        getAllEnhancedStockPrices(),
        getHederaDeployedStockPrices(),
        getHederaDeploymentStatsAction(),
        Promise.resolve({}),
      ]);

    // Calculate market statistics
    const totalMarketCap = allPrices.reduce(
      (sum: number, stock: EnhancedStockPrice) => sum + (stock.marketCap || 0),
      0,
    );
    const hederaMarketCap = hederaPrices.reduce(
      (sum: number, stock: EnhancedStockPrice) => sum + (stock.marketCap || 0),
      0,
    );
    const totalVolume = allPrices.reduce(
      (sum: number, stock: EnhancedStockPrice) => sum + (stock.volume || 0),
      0,
    );

    const advancers = allPrices.filter(
      (stock: EnhancedStockPrice) => (stock.change || 0) > 0,
    ).length;
    const decliners = allPrices.filter(
      (stock: EnhancedStockPrice) => (stock.change || 0) < 0,
    ).length;
    const unchanged = allPrices.filter(
      (stock: EnhancedStockPrice) => (stock.change || 0) === 0,
    ).length;

    return {
      overview: {
        totalStocks: allPrices.length,
        hederaDeployedStocks: hederaPrices.length,
        totalMarketCap,
        hederaMarketCap,
        totalVolume,
        advancers,
        decliners,
        unchanged,
      },
      deploymentStats,
      sectorData,
      topGainers: allPrices
        .filter((stock: EnhancedStockPrice) => (stock.change || 0) > 0)
        .sort(
          (a: EnhancedStockPrice, b: EnhancedStockPrice) =>
            (b.change || 0) - (a.change || 0),
        )
        .slice(0, 5),
      topLosers: allPrices
        .filter((stock: EnhancedStockPrice) => (stock.change || 0) < 0)
        .sort(
          (a: EnhancedStockPrice, b: EnhancedStockPrice) =>
            (a.change || 0) - (b.change || 0),
        )
        .slice(0, 5),
      hederaTopPerformers: hederaPrices
        .sort(
          (a: EnhancedStockPrice, b: EnhancedStockPrice) =>
            (b.change || 0) - (a.change || 0),
        )
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching market overview with Hedera:", error);
    throw new Error("Failed to fetch market overview with Hedera integration");
  }
}

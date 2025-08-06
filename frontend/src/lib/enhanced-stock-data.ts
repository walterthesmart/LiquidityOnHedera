/**
 * Enhanced Stock Data Service
 * Combines Nigerian stock data with Bitfinity EVM token deployment information
 */

import { NIGERIAN_STOCKS_DATA } from "@/db/nigerian-stocks-data";
import { getStockBySymbol, NIGERIAN_STOCKS } from "@/lib/bitfinity-config";
import { bitfinityEVM } from "@/lib/bitfinity-evm";
import { Stock } from "@/db/schema";

export interface EnhancedStockData extends Omit<Stock, "id" | "tokenID"> {
  // Bitfinity EVM integration fields
  bitfinityExplorerUrl?: string;
  isBitfinityDeployed: boolean;
  bitfinityNetwork?: string;
  bitfinityDecimals?: number;
  contractAddress?: string;

  // Enhanced metadata
  blockchain: "bitfinity-evm";
  tokenStandard: "ERC20"; // ERC20 standard
  deploymentStatus: "deployed" | "pending" | "not_deployed";

  // Additional fields from Bitfinity config
  description?: string;

  // Override sector to make it required (from Stock schema)
  sector: string;
}

/**
 * Get enhanced stock data by symbol
 */
export async function getEnhancedStockData(
  symbol: string,
): Promise<EnhancedStockData | null> {
  try {
    // Get base stock data from database
    const baseStock = NIGERIAN_STOCKS_DATA.find(
      (stock) => stock.symbol === symbol,
    );
    if (!baseStock) {
      return null;
    }

    // Get Bitfinity config data
    const bitfinityStock = getStockBySymbol(symbol);

    // Check if token is deployed on Bitfinity
    const tokenAddress = await bitfinityEVM.getTokenAddress(symbol);
    const isDeployed = tokenAddress !== null;

    let contractAddress: string | undefined;
    let explorerUrl: string | undefined;

    if (isDeployed && tokenAddress) {
      contractAddress = tokenAddress;
      explorerUrl = bitfinityEVM.getTokenUrl(tokenAddress);
    }

    const enhancedData: EnhancedStockData = {
      ...baseStock,
      // Bitfinity EVM fields
      bitfinityExplorerUrl: explorerUrl,
      isBitfinityDeployed: isDeployed,
      bitfinityNetwork: bitfinityEVM.getNetworkConfig().name,
      bitfinityDecimals: 18, // Standard ERC20 decimals
      contractAddress,

      // Legacy field for compatibility
      hederaTokenAddress: null, // Not used in Bitfinity EVM

      // Metadata
      blockchain: "bitfinity-evm",
      tokenStandard: "ERC20",
      deploymentStatus: isDeployed ? "deployed" : "not_deployed",

      // Additional fields from config
      sector: bitfinityStock?.sector || "Unknown",
      description: bitfinityStock?.description,
    };

    return enhancedData;
  } catch (error) {
    console.error("Error getting enhanced stock data:", error);
    return null;
  }
}

/**
 * Get all enhanced stock data
 */
export async function getAllEnhancedStockData(): Promise<EnhancedStockData[]> {
  const enhancedStocks: EnhancedStockData[] = [];

  for (const stock of NIGERIAN_STOCKS_DATA) {
    const enhancedData = await getEnhancedStockData(stock.symbol);
    if (enhancedData) {
      enhancedStocks.push(enhancedData);
    }
  }

  return enhancedStocks;
}

/**
 * Get enhanced stock data by sector
 */
export async function getEnhancedStockDataBySector(
  sector: string,
): Promise<EnhancedStockData[]> {
  const allStocks = await getAllEnhancedStockData();
  return allStocks.filter((stock) => stock.sector === sector);
}

/**
 * Get deployed stocks only
 */
export async function getDeployedStocks(): Promise<EnhancedStockData[]> {
  const allStocks = await getAllEnhancedStockData();
  return allStocks.filter((stock) => stock.isBitfinityDeployed);
}

/**
 * Get stock deployment statistics
 */
export async function getDeploymentStats() {
  const allStocks = await getAllEnhancedStockData();
  const deployed = allStocks.filter((stock) => stock.isBitfinityDeployed);

  const sectorStats = allStocks.reduce(
    (acc, stock) => {
      const sector = stock.sector || "Unknown";
      if (!acc[sector]) {
        acc[sector] = { total: 0, deployed: 0 };
      }
      acc[sector].total++;
      if (stock.isBitfinityDeployed) {
        acc[sector].deployed++;
      }
      return acc;
    },
    {} as Record<string, { total: number; deployed: number }>,
  );

  return {
    totalStocks: allStocks.length,
    deployedStocks: deployed.length,
    deploymentPercentage: (deployed.length / allStocks.length) * 100,
    deployed: deployed.length,
    pending: allStocks.filter((stock) => stock.deploymentStatus === "pending")
      .length,
    sectorStats,
    network: bitfinityEVM.getNetworkConfig().name,
  };
}

/**
 * Search enhanced stock data
 */
export async function searchEnhancedStocks(
  query: string,
): Promise<EnhancedStockData[]> {
  const allStocks = await getAllEnhancedStockData();
  const lowercaseQuery = query.toLowerCase();

  return allStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(lowercaseQuery) ||
      stock.name.toLowerCase().includes(lowercaseQuery) ||
      stock.sector?.toLowerCase().includes(lowercaseQuery) ||
      stock.description?.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Get stock price with Bitfinity integration
 */
export async function getStockPriceWithBitfinity(symbol: string) {
  try {
    const enhancedData = await getEnhancedStockData(symbol);
    if (!enhancedData) {
      return null;
    }

    // Get current price from existing price service
    // This would integrate with your existing Nigerian stock price service
    // Note: currentPrice would come from price service integration
    const basePrice = 0; // TODO: Integrate with price service

    // If deployed on Bitfinity, get additional token metrics
    let tokenMetrics = null;
    if (enhancedData.isBitfinityDeployed && enhancedData.contractAddress) {
      try {
        const tokenInfo = await bitfinityEVM.getTokenInfo(symbol);
        if (tokenInfo) {
          tokenMetrics = {
            totalSupply: tokenInfo.totalSupply,
            maxSupply: tokenInfo.maxSupply,
            contractAddress: tokenInfo.tokenAddress,
            explorerUrl: bitfinityEVM.getTokenUrl(tokenInfo.tokenAddress),
          };
        }
      } catch (error) {
        console.error("Error getting token metrics:", error);
      }
    }

    return {
      ...enhancedData,
      currentPrice: basePrice,
      tokenMetrics,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting stock price with Bitfinity:", error);
    return null;
  }
}

/**
 * Validate stock symbol exists in both database and Bitfinity config
 */
export function validateStockSymbol(symbol: string): {
  isValid: boolean;
  inDatabase: boolean;
  inBitfinityConfig: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const inDatabase = NIGERIAN_STOCKS_DATA.some(
    (stock) => stock.symbol === symbol,
  );
  const inBitfinityConfig = NIGERIAN_STOCKS.some(
    (stock) => stock.symbol === symbol,
  );

  if (!inDatabase) {
    errors.push("Stock not found in database");
  }

  if (!inBitfinityConfig) {
    errors.push("Stock not found in Bitfinity configuration");
  }

  return {
    isValid: inDatabase && inBitfinityConfig,
    inDatabase,
    inBitfinityConfig,
    errors,
  };
}

/**
 * Get migration status for all stocks
 */
export async function getMigrationStatus() {
  const allStocks = await getAllEnhancedStockData();

  const migrationStats = {
    total: allStocks.length,
    migrated: 0,
    pending: 0,
    failed: 0,
    byStatus: {} as Record<string, number>,
  };

  allStocks.forEach((stock) => {
    const status = stock.deploymentStatus;
    migrationStats.byStatus[status] =
      (migrationStats.byStatus[status] || 0) + 1;

    switch (status) {
      case "deployed":
        migrationStats.migrated++;
        break;
      case "pending":
        migrationStats.pending++;
        break;
      case "not_deployed":
        migrationStats.failed++;
        break;
    }
  });

  return {
    ...migrationStats,
    migrationPercentage: (migrationStats.migrated / migrationStats.total) * 100,
    network: bitfinityEVM.getNetworkConfig().name,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get enhanced Nigerian stocks (alias for getAllEnhancedStockData)
 */
export async function getEnhancedNigerianStocks(): Promise<
  EnhancedStockData[]
> {
  return getAllEnhancedStockData();
}

/**
 * Get enhanced stock by symbol (alias for getEnhancedStockData)
 */
export async function getEnhancedStockBySymbol(
  symbol: string,
): Promise<EnhancedStockData | null> {
  return getEnhancedStockData(symbol);
}

/**
 * Get stocks by deployment status
 */
export async function getStocksByDeploymentStatus(
  status: "deployed" | "pending" | "not_deployed",
): Promise<EnhancedStockData[]> {
  const allStocks = await getAllEnhancedStockData();
  return allStocks.filter(
    (stock: EnhancedStockData) => stock.deploymentStatus === status,
  );
}

/**
 * Get stocks by sector with deployment info
 */
export async function getStocksBySectorWithHederaInfo(
  sector: string,
): Promise<EnhancedStockData[]> {
  const allStocks = await getAllEnhancedStockData();
  return allStocks.filter(
    (stock: EnhancedStockData) => stock.sector === sector,
  );
}

/**
 * Validate and get enhanced stock
 */
export async function validateAndGetEnhancedStock(
  symbol: string,
): Promise<EnhancedStockData | null> {
  if (!symbol || typeof symbol !== "string") {
    return null;
  }
  return getEnhancedStockData(symbol.toUpperCase());
}

// Note: searchEnhancedStocks is already defined above as an async function

/**
 * Get deployed Hedera stocks (alias for deployed stocks)
 */
export async function getDeployedHederaStocks(): Promise<EnhancedStockData[]> {
  return getDeployedStocks();
}

/**
 * Get pending Hedera stocks (alias for pending deployment status)
 */
export async function getPendingHederaStocks(): Promise<EnhancedStockData[]> {
  return getStocksByDeploymentStatus("pending");
}

/**
 * Get Hedera deployment stats (alias for deployment stats)
 */
export async function getHederaDeploymentStats() {
  return getDeploymentStats();
}

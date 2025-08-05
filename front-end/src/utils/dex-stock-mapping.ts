/**
 * DEX Stock Mapping Utility
 * 
 * This utility provides functions to map contract addresses from the DEX
 * to user-friendly stock information including names, symbols, and logos.
 */

import { getStockBySymbol } from "@/lib/bitfinity-config";
import { getStockLogoPath, getStockLogoAlt } from "@/utils/stock-logos";
import { getContractAddresses } from "@/abis";

/**
 * Interface for enhanced stock information displayed in the DEX
 */
export interface DEXStockInfo {
  contractAddress: string;
  symbol: string;
  name: string;
  companyName: string;
  sector: string;
  description?: string;
  logoPath: string;
  logoAlt: string;
}

/**
 * Create a reverse mapping from contract addresses to stock symbols
 * This is built dynamically based on the current chain's contract addresses
 */
function createAddressToSymbolMap(chainId: number): Record<string, string> {
  const contractAddresses = getContractAddresses(chainId);
  const addressToSymbolMap: Record<string, string> = {};

  if (contractAddresses?.tokens) {
    // Create reverse mapping: address -> symbol
    Object.entries(contractAddresses.tokens).forEach(([symbol, address]) => {
      if (typeof address === 'string') {
        addressToSymbolMap[address.toLowerCase()] = symbol;
      }
    });
  }

  return addressToSymbolMap;
}

/**
 * Get stock information by contract address
 * @param contractAddress - The contract address of the stock token
 * @param chainId - The current chain ID
 * @returns Enhanced stock information or null if not found
 */
export function getStockInfoByAddress(
  contractAddress: string,
  chainId: number
): DEXStockInfo | null {
  try {
    // Create address to symbol mapping for current chain
    const addressToSymbolMap = createAddressToSymbolMap(chainId);

    // Get symbol from contract address
    const symbol = addressToSymbolMap[contractAddress.toLowerCase()];
    if (!symbol) {
      console.warn(`No symbol found for contract address: ${contractAddress}`);
      return null;
    }

    // Get stock data from bitfinity config
    const stockData = getStockBySymbol(symbol);
    if (!stockData) {
      console.warn(`No stock data found for symbol: ${symbol}`);
      return null;
    }

    // Get logo information
    const logoPath = getStockLogoPath(symbol);
    const logoAlt = getStockLogoAlt(symbol, stockData.companyName);

    return {
      contractAddress,
      symbol: stockData.symbol,
      name: stockData.name,
      companyName: stockData.companyName,
      sector: stockData.sector,
      description: stockData.description,
      logoPath,
      logoAlt,
    };
  } catch (error) {
    console.error(`Error getting stock info for address ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Get stock information for multiple contract addresses
 * @param contractAddresses - Array of contract addresses
 * @param chainId - The current chain ID
 * @returns Array of enhanced stock information (null entries filtered out)
 */
export function getStockInfoByAddresses(
  contractAddresses: string[],
  chainId: number
): DEXStockInfo[] {
  return contractAddresses
    .map(address => getStockInfoByAddress(address, chainId))
    .filter((info): info is DEXStockInfo => info !== null);
}

/**
 * Check if a contract address is a valid stock token
 * @param contractAddress - The contract address to check
 * @param chainId - The current chain ID
 * @returns True if the address is a valid stock token
 */
export function isValidStockToken(contractAddress: string, chainId: number): boolean {
  const addressToSymbolMap = createAddressToSymbolMap(chainId);
  return contractAddress.toLowerCase() in addressToSymbolMap;
}

/**
 * Get all available stock tokens for the current chain
 * @param chainId - The current chain ID
 * @returns Array of all available stock information
 */
export function getAllAvailableStocks(chainId: number): DEXStockInfo[] {
  const contractAddresses = getContractAddresses(chainId);
  
  if (!contractAddresses?.tokens) {
    return [];
  }
  
  const addresses = Object.values(contractAddresses.tokens).filter(
    (address): address is string => typeof address === 'string'
  );
  
  return getStockInfoByAddresses(addresses, chainId);
}

/**
 * Format stock display name for UI
 * @param stockInfo - The stock information
 * @returns Formatted display name: "Company Name (SYMBOL)"
 */
export function formatStockDisplayName(stockInfo: DEXStockInfo): string {
  return `${stockInfo.companyName} (${stockInfo.symbol})`;
}

/**
 * Format stock display name with sector for detailed view
 * @param stockInfo - The stock information
 * @returns Formatted display name with sector
 */
export function formatStockDisplayNameWithSector(stockInfo: DEXStockInfo): string {
  return `${stockInfo.companyName} (${stockInfo.symbol}) - ${stockInfo.sector}`;
}

/**
 * Search stocks by name or symbol
 * @param query - Search query
 * @param chainId - The current chain ID
 * @returns Array of matching stock information
 */
export function searchStocks(query: string, chainId: number): DEXStockInfo[] {
  const allStocks = getAllAvailableStocks(chainId);
  const lowerQuery = query.toLowerCase();
  
  return allStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.companyName.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.sector.toLowerCase().includes(lowerQuery)
  );
}

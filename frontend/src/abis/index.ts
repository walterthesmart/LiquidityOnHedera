export { default as NGNStablecoinABI } from './NGNStablecoin.json';
export { default as NigerianStockTokenABI } from './NigerianStockToken.json';
export { default as StockNGNDEXABI } from './StockNGNDEX.json';
export { default as TradingPairManagerABI } from './TradingPairManager.json';
export { default as NigerianStockFactoryABI } from './NigerianStockFactory.json';

// Import contract configuration functions
import { getContractConfig, getTokenAddress as getTokenAddressFromConfig, getAvailableTokens as getAvailableTokensFromConfig, ContractConfig } from '../config/contracts';

// Extended contract config for Hedera-specific fields
interface ExtendedContractConfig extends ContractConfig {
  stockNGNDEX?: string;
  ngnStablecoin?: string;
  tradingPairManager?: string;
}

// Helper function to get current chain ID (fallback to Sepolia)
function getCurrentChainId(): number {
  // In a real app, this would come from wagmi useChainId hook
  // For build time, we'll default to Sepolia
  return 11155111; // Sepolia testnet
}

// Export contract address getter functions
export function getStockNGNDEXAddress(chainId?: number): string {
  const currentChainId = chainId || getCurrentChainId();
  const config = getContractConfig(currentChainId);

  // Check for Hedera-specific field first
  if (config && 'stockNGNDEX' in config) {
    return (config as ExtendedContractConfig).stockNGNDEX || '';
  }

  // Fallback to a default address or empty string
  return '';
}

export function getNGNStablecoinAddress(chainId?: number): string {
  const currentChainId = chainId || getCurrentChainId();
  const config = getContractConfig(currentChainId);

  // Check for Hedera-specific field first
  if (config && 'ngnStablecoin' in config) {
    return (config as ExtendedContractConfig).ngnStablecoin || '';
  }

  // Fallback to a default address or empty string
  return '';
}

export function getFactoryAddress(chainId?: number): string {
  const currentChainId = chainId || getCurrentChainId();
  const config = getContractConfig(currentChainId);
  return config?.factoryAddress || '';
}

export function getTradingPairManagerAddress(chainId?: number): string {
  const currentChainId = chainId || getCurrentChainId();
  const config = getContractConfig(currentChainId);

  // Check for Hedera-specific field first
  if (config && 'tradingPairManager' in config) {
    return (config as ExtendedContractConfig).tradingPairManager || '';
  }

  // Fallback to a default address or empty string
  return '';
}

// Re-export the config functions with the same names expected by components
export function getTokenAddress(chainId: number, symbol: string): string | null {
  return getTokenAddressFromConfig(chainId, symbol);
}

export function getAvailableTokens(chainId: number): string[] {
  return getAvailableTokensFromConfig(chainId);
}

export function getContractAddresses(chainId: number) {
  return getContractConfig(chainId);
}

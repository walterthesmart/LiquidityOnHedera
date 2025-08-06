/**
 * @commit 2.0.0 Initial release of native token service
 * @commit 2.0.1 Added support for mainnet deployment
 * @commit 2.0.2 Added frontend integration and type generation
 * Type definitions for Hedera native token service
 */

export interface NigerianStockData {
  symbol: string;
  name: string;
  totalSupply: string;
  memo: string;
  decimals?: number;
}

export interface TokenCreationResult {
  tokenId: string;
  transactionId: string;
  cost: string;
  symbol: string;
  name: string;
  totalSupply: string;
  decimals: number;
  treasuryAccountId: string;
  memo: string;
  explorerUrl: string;
}

export interface TokenMetadata {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  treasuryAccountId: string;
  memo: string;
  network: string;
  createdAt: string;
  transactionId: string;
  explorerUrl: string;
}

export interface HederaNetworkConfig {
  network: 'testnet' | 'mainnet' | 'previewnet';
  operatorAccountId: string;
  operatorPrivateKey: string;
}

export interface TokenServiceConfig extends HederaNetworkConfig {
  outputDir?: string;
  generateFrontendFiles?: boolean;
}

export interface FrontendTokenConfig {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  explorerUrl: string;
}

export interface FrontendConfig {
  network: string;
  tokens: FrontendTokenConfig[];
  generatedAt: string;
  version: string;
}

export interface TokenCreationSummary {
  totalTokens: number;
  successfulCreations: number;
  failedCreations: number;
  totalCost: string;
  tokens: TokenCreationResult[];
  errors: Array<{
    symbol: string;
    error: string;
  }>;
}

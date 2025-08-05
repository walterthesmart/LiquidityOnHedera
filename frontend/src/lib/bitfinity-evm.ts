/**
 * Bitfinity EVM Integration Service
 * Handles contract interactions for Nigerian Stock Exchange tokens
 */

import {
  createPublicClient,
  http,
  parseEther,
  formatEther,
  Address,
} from "viem";
import {
  SUPPORTED_NETWORKS,
  DEFAULT_NETWORK,
  getNetworkByChainId,
  getContractAddresses,
} from "./bitfinity-config";
import {
  NigerianStockTokenFactoryABI,
  NigerianStockTokenABI,
  getFactoryAddress,
  getTokenAddress as getTokenAddressFromABI,
  getAvailableTokens,
} from "../abis";

// Note: Contract ABIs are now imported from ../abis/index.ts
// This provides better type safety and keeps ABIs in sync with deployed contracts

/**
 * Multi-Network EVM Service Class
 * Supports Bitfinity EVM and Ethereum Sepolia networks
 */
export class MultiNetworkEVMService {
  private network: string;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;
  // Wallet client removed - using wagmi hooks for wallet interactions

  constructor(network: string = DEFAULT_NETWORK) {
    this.network = network;
    this.initializeClients();
  }

  private initializeClients() {
    const networkConfig = SUPPORTED_NETWORKS[this.network];
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${this.network}`);
    }

    // Create public client for reading
    this.publicClient = createPublicClient({
      chain: {
        id: networkConfig.chainId,
        name: networkConfig.name,
        network: this.network,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: {
          default: { http: [networkConfig.rpcUrl] },
          public: { http: [networkConfig.rpcUrl] },
        },
        blockExplorers: {
          default: { name: "Explorer", url: networkConfig.blockExplorer },
        },
      },
      transport: http(networkConfig.rpcUrl),
    });
  }

  /**
   * Switch to a different network
   */
  switchNetwork(network: string) {
    this.network = network;
    this.initializeClients();
  }

  /**
   * Get current network configuration
   */
  getNetworkConfig() {
    return SUPPORTED_NETWORKS[this.network];
  }

  /**
   * Get current chain ID
   */
  getChainId(): number {
    return SUPPORTED_NETWORKS[this.network]?.chainId || 0;
  }

  /**
   * Get token address by symbol from factory contract
   */
  async getTokenAddressFromContract(symbol: string): Promise<Address | null> {
    try {
      const factoryAddress = getFactoryAddress(this.getChainId());
      if (!factoryAddress) {
        throw new Error(
          `Factory address not configured for network: ${this.network}`,
        );
      }

      const address = await this.publicClient!.readContract({
        address: factoryAddress as Address,
        abi: NigerianStockTokenFactoryABI,
        functionName: "getTokenAddress",
        args: [symbol],
      });

      return address === "0x0000000000000000000000000000000000000000"
        ? null
        : (address as Address);
    } catch (error) {
      console.error("Error getting token address:", error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(
    tokenAddress: Address,
    userAddress: Address,
  ): Promise<string> {
    try {
      const balance = await this.publicClient!.readContract({
        address: tokenAddress,
        abi: NigerianStockTokenABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      return formatEther(balance as bigint);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(symbol: string) {
    try {
      const chainId = this.getChainId();
      const factoryAddress = getFactoryAddress(chainId);

      if (!factoryAddress) {
        throw new Error(
          `Factory address not configured for chain ID: ${chainId}`,
        );
      }

      const tokenInfo = (await this.publicClient!.readContract({
        address: factoryAddress as Address,
        abi: NigerianStockTokenFactoryABI,
        functionName: "getTokenInfo",
        args: [symbol],
      })) as readonly [Address, string, string, string, bigint, bigint, number];

      return {
        tokenAddress: tokenInfo[0],
        name: tokenInfo[1],
        symbol: tokenInfo[2],
        companyName: tokenInfo[3],
        totalSupply: formatEther(tokenInfo[4]),
        maxSupply: formatEther(tokenInfo[5]),
        decimals: tokenInfo[6],
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      return null;
    }
  }

  /**
   * Get all deployed tokens
   */
  async getAllTokens(): Promise<Address[]> {
    try {
      const chainId = this.getChainId();
      const contractAddresses = getContractAddresses(chainId);
      const factoryAddress = contractAddresses?.factoryAddress;

      if (!factoryAddress) {
        throw new Error(
          `Factory address not configured for chain ID: ${chainId}`,
        );
      }

      const tokens = (await this.publicClient!.readContract({
        address: factoryAddress as Address,
        abi: NigerianStockTokenFactoryABI,
        functionName: "getAllTokens",
      })) as readonly Address[];

      return [...tokens];
    } catch (error) {
      console.error("Error getting all tokens:", error);
      return [];
    }
  }

  /**
   * Check if current network is a testnet
   */
  isTestnet(): boolean {
    return SUPPORTED_NETWORKS[this.network]?.testnet ?? false;
  }

  /**
   * Get all available tokens for current network
   */
  getAvailableTokens(): string[] {
    const chainId = this.getChainId();
    return getAvailableTokens(chainId);
  }

  /**
   * Get token address by symbol for current network
   */
  getTokenAddress(symbol: string): string {
    const chainId = this.getChainId();
    return getTokenAddressFromABI(chainId, symbol);
  }

  /**
   * Get block explorer URL for a transaction
   */
  getTransactionUrl(txHash: string): string {
    const networkConfig = getNetworkByChainId(this.getChainId());
    return `${networkConfig?.blockExplorer || ""}/tx/${txHash}`;
  }

  /**
   * Get block explorer URL for a token
   */
  getTokenUrl(tokenAddress: string): string {
    const networkConfig = getNetworkByChainId(this.getChainId());
    return `${networkConfig?.blockExplorer || ""}/token/${tokenAddress}`;
  }

  /**
   * Get block explorer URL for an address
   */
  getAddressUrl(address: string): string {
    const networkConfig = getNetworkByChainId(this.getChainId());
    return `${networkConfig?.blockExplorer || ""}/address/${address}`;
  }
}

// Export singleton instance (backward compatibility)
export const bitfinityEVM = new MultiNetworkEVMService();

// Export class for direct usage
export { MultiNetworkEVMService as BitfinityEVMService };

// Export utility functions
export function formatTokenAmount(
  amount: string,
  decimals: number = 18,
): string {
  // decimals parameter available for future use
  console.debug("Formatting amount with decimals:", decimals);
  const num = parseFloat(amount);
  if (num === 0) return "0";
  if (num < 0.001) return "<0.001";
  if (num < 1) return num.toFixed(3);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

export function parseTokenAmount(amount: string): bigint {
  return parseEther(amount);
}

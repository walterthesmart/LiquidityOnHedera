/**
 * Bitfinity EVM Contract Service
 *
 * This service handles interactions with Nigerian Stock Token contracts
 * deployed on Bitfinity EVM, replacing the previous Hedera SDK integration.
 */

import { ethers } from "ethers";
import { toast } from "@/hooks/use-toast";

// Contract ABIs (simplified for key functions)
const NIGERIAN_STOCK_TOKEN_ABI = [
  // ERC20 Standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // Custom functions
  "function getStockInfo() view returns (tuple(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap, bool isActive, uint256 lastUpdated))",
  "function batchTransfer(address[] recipients, uint256[] amounts)",
  "function mint(address to, uint256 amount)",
  "function burnFrom(address from, uint256 amount)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",

  // Role management
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event StockMetadataUpdated(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap)",
  "event BatchTransferCompleted(uint256 totalRecipients, uint256 totalAmount)",
];

const FACTORY_ABI = [
  "function deployStockToken(string name, string symbol, uint256 initialSupply, tuple(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap, bool isActive, uint256 lastUpdated) stockMetadata, address tokenAdmin) returns (address)",
  "function getTokenAddress(string symbol) view returns (address)",
  "function getAllDeployedSymbols() view returns (string[])",
  "function getTokenInfo(string symbol) view returns (tuple(string symbol, string companyName, string sector, uint256 totalShares, uint256 marketCap, bool isActive, uint256 lastUpdated))",
  "function getFactoryStats() view returns (uint256 totalDeployedTokens, uint256 totalMarketCap, uint256 totalSymbols)",
  "function isValidToken(address tokenAddress) view returns (bool)",

  "event StockTokenDeployed(string indexed symbol, address indexed tokenAddress, string name, uint256 initialSupply, address admin)",
];

// Network configurations
const BITFINITY_NETWORKS = {
  testnet: {
    chainId: 355113,
    name: "Bitfinity Testnet",
    rpcUrl: "https://testnet.bitfinity.network",
    explorerUrl: "https://explorer.testnet.bitfinity.network",
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_TESTNET || "",
  },
  mainnet: {
    chainId: 355110,
    name: "Bitfinity Mainnet",
    rpcUrl: "https://mainnet.bitfinity.network",
    explorerUrl: "https://explorer.bitfinity.network",
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_MAINNET || "",
  },
};

export interface StockMetadata {
  symbol: string;
  companyName: string;
  sector: string;
  totalShares: bigint;
  marketCap: bigint;
  isActive: boolean;
  lastUpdated: bigint;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  metadata: StockMetadata;
}

export class BitfinityContractService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private network: "testnet" | "mainnet" = "testnet";
  private factoryContract: ethers.Contract | null = null;

  constructor(network: "testnet" | "mainnet" = "testnet") {
    this.network = network;
    this.initializeProvider();
  }

  /**
   * Initialize the provider and factory contract
   */
  private initializeProvider() {
    try {
      const networkConfig = BITFINITY_NETWORKS[this.network];
      this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

      if (networkConfig.factoryAddress) {
        this.factoryContract = new ethers.Contract(
          networkConfig.factoryAddress,
          FACTORY_ABI,
          this.provider,
        );
      }
    } catch (error) {
      console.error("Failed to initialize Bitfinity provider:", error);
    }
  }

  /**
   * Connect wallet and set signer
   */
  async connectWallet(): Promise<ethers.Signer | null> {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        // Switch to Bitfinity network if needed
        await this.switchToBitfinityNetwork();

        this.signer = await provider.getSigner();

        if (this.factoryContract) {
          // Connect signer to contract - type assertion needed for ethers contract connection
          this.factoryContract = this.factoryContract.connect(
            this.signer,
          ) as typeof this.factoryContract;
        }

        return this.signer;
      }
      throw new Error("No Ethereum wallet found");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Wallet Connection Failed",
        description:
          "Please make sure you have MetaMask or another Ethereum wallet installed.",
        variant: "destructive",
      });
      return null;
    }
  }

  /**
   * Switch to Bitfinity network
   */
  private async switchToBitfinityNetwork(): Promise<void> {
    if (!window.ethereum) return;

    const networkConfig = BITFINITY_NETWORKS[this.network];

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Network not added to wallet
      if (
        switchError &&
        typeof switchError === "object" &&
        "code" in switchError &&
        switchError.code === 4902
      ) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${networkConfig.chainId.toString(16)}`,
                chainName: networkConfig.name,
                nativeCurrency: {
                  name: "BTF",
                  symbol: "BTF",
                  decimals: 18,
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Bitfinity network:", addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get all deployed stock tokens
   */
  async getAllStockTokens(): Promise<string[]> {
    try {
      if (!this.factoryContract) {
        throw new Error("Factory contract not initialized");
      }

      const symbols = await this.factoryContract.getAllDeployedSymbols();
      return symbols;
    } catch (error) {
      console.error("Failed to get stock tokens:", error);
      return [];
    }
  }

  /**
   * Get token information by symbol
   */
  async getTokenInfo(symbol: string): Promise<TokenInfo | null> {
    try {
      if (!this.factoryContract) {
        throw new Error("Factory contract not initialized");
      }

      const tokenAddress = await this.factoryContract.getTokenAddress(symbol);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        NIGERIAN_STOCK_TOKEN_ABI,
        this.provider,
      );

      const [name, decimals, totalSupply, metadata] = await Promise.all([
        tokenContract.name(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.getStockInfo(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply,
        metadata: {
          symbol: metadata.symbol,
          companyName: metadata.companyName,
          sector: metadata.sector,
          totalShares: metadata.totalShares,
          marketCap: metadata.marketCap,
          isActive: metadata.isActive,
          lastUpdated: metadata.lastUpdated,
        },
      };
    } catch (error) {
      console.error(`Failed to get token info for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(
    tokenSymbol: string,
    userAddress: string,
  ): Promise<bigint> {
    try {
      if (!this.factoryContract) {
        throw new Error("Factory contract not initialized");
      }

      const tokenAddress =
        await this.factoryContract.getTokenAddress(tokenSymbol);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        NIGERIAN_STOCK_TOKEN_ABI,
        this.provider,
      );

      const balance = await tokenContract.balanceOf(userAddress);
      return balance;
    } catch (error) {
      console.error(`Failed to get balance for ${tokenSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Transfer tokens
   */
  async transferTokens(
    tokenSymbol: string,
    to: string,
    amount: bigint,
  ): Promise<string | null> {
    try {
      if (!this.signer || !this.factoryContract) {
        throw new Error("Wallet not connected or factory not initialized");
      }

      const tokenAddress =
        await this.factoryContract.getTokenAddress(tokenSymbol);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        NIGERIAN_STOCK_TOKEN_ABI,
        this.signer,
      );

      const tx = await tokenContract.transfer(to, amount);
      await tx.wait();

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${ethers.formatEther(amount)} ${tokenSymbol}`,
      });

      return tx.hash;
    } catch (error) {
      console.error(`Failed to transfer ${tokenSymbol}:`, error);
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer tokens. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }

  /**
   * Batch transfer tokens to multiple recipients
   */
  async batchTransferTokens(
    tokenSymbol: string,
    recipients: string[],
    amounts: bigint[],
  ): Promise<string | null> {
    try {
      if (!this.signer || !this.factoryContract) {
        throw new Error("Wallet not connected or factory not initialized");
      }

      if (recipients.length !== amounts.length) {
        throw new Error(
          "Recipients and amounts arrays must have the same length",
        );
      }

      const tokenAddress =
        await this.factoryContract.getTokenAddress(tokenSymbol);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        NIGERIAN_STOCK_TOKEN_ABI,
        this.signer,
      );

      const tx = await tokenContract.batchTransfer(recipients, amounts);
      await tx.wait();

      toast({
        title: "Batch Transfer Successful",
        description: `Successfully transferred ${tokenSymbol} to ${recipients.length} recipients`,
      });

      return tx.hash;
    } catch (error) {
      console.error(`Failed to batch transfer ${tokenSymbol}:`, error);
      toast({
        title: "Batch Transfer Failed",
        description: "Failed to transfer tokens. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }

  /**
   * Get factory statistics
   */
  async getFactoryStats(): Promise<{
    totalDeployedTokens: bigint;
    totalMarketCap: bigint;
    totalSymbols: bigint;
  } | null> {
    try {
      if (!this.factoryContract) {
        throw new Error("Factory contract not initialized");
      }

      const stats = await this.factoryContract.getFactoryStats();
      return {
        totalDeployedTokens: stats.totalDeployedTokens,
        totalMarketCap: stats.totalMarketCap,
        totalSymbols: stats.totalSymbols,
      };
    } catch (error) {
      console.error("Failed to get factory stats:", error);
      return null;
    }
  }

  /**
   * Get current network configuration
   */
  getNetworkConfig() {
    return BITFINITY_NETWORKS[this.network];
  }

  /**
   * Switch network
   */
  switchNetwork(network: "testnet" | "mainnet") {
    this.network = network;
    this.initializeProvider();
  }
}

// Export singleton instance
export const bitfinityService = new BitfinityContractService(
  process.env.NODE_ENV === "production" ? "mainnet" : "testnet",
);

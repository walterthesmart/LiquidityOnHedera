import { ethers } from 'ethers';
import contractsConfig from '../config/hedera-contracts.json';

// Type definitions for the contracts config
export interface TokenConfig {
  address: string;
  contractId: string;
  name: string;
  symbol: string;
  companyName: string;
  maxSupply: string;
  sector: string;
  description: string;
  status: string;
}

interface ContractsConfig {
  network: string;
  lastUpdated: string;
  deploymentStatus: string;
  contracts: {
    NGNStablecoin: {
      address: string;
      contractId: string;
      name: string;
      symbol: string;
      decimals: number;
      status: string;
    };
    NigerianStockFactory: {
      address: string;
      contractId: string;
      name: string;
      status: string;
    };
    StockNGNDEX: {
      address: string;
      contractId: string;
      name: string;
      status: string;
    };
    TradingPairManager: {
      address: string;
      contractId: string;
      name: string;
      status: string;
    };
  };
  stockTokens: Record<string, TokenConfig>;
}

// Type assertion for the imported config
const typedContractsConfig = contractsConfig as ContractsConfig;

// Import ABIs
import NGNStablecoinABI from '../abis/NGNStablecoin.json';
import NigerianStockTokenABI from '../abis/NigerianStockToken.json';
import StockNGNDEXABI from '../abis/StockNGNDEX.json';
import TradingPairManagerABI from '../abis/TradingPairManager.json';
import NigerianStockFactoryABI from '../abis/NigerianStockFactory.json';

// Hedera Testnet configuration
const HEDERA_TESTNET_CONFIG = {
  chainId: 296,
  name: 'Hedera Testnet',
  rpcUrl: 'https://testnet.hashio.io/api',
  blockExplorer: 'https://hashscan.io/testnet'
};

export class HederaContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_CONFIG.rpcUrl);
  }

  // Initialize with wallet connection
  async connect(walletProvider?: ethers.Eip1193Provider) {
    if (walletProvider) {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      this.signer = await ethersProvider.getSigner();
      return this.signer;
    }
    return null;
  }

  // Get contract instances
  getNGNStablecoin() {
    const address = contractsConfig.contracts?.NGNStablecoin?.address;
    if (!address) {
      throw new Error('NGN Stablecoin contract not deployed');
    }
    return new ethers.Contract(
      address,
      NGNStablecoinABI,
      this.signer || this.provider
    );
  }

  getStockToken(symbol: string) {
    const tokenConfig = typedContractsConfig.stockTokens?.[symbol];
    if (!tokenConfig?.address) {
      throw new Error(`Stock token ${symbol} not found or not deployed`);
    }

    return new ethers.Contract(
      tokenConfig.address,
      NigerianStockTokenABI,
      this.signer || this.provider
    );
  }

  getStockNGNDEX() {
    const address = contractsConfig.contracts?.StockNGNDEX?.address;
    if (!address) {
      throw new Error('StockNGNDEX contract not deployed');
    }
    return new ethers.Contract(
      address,
      StockNGNDEXABI,
      this.signer || this.provider
    );
  }

  getTradingPairManager() {
    const address = contractsConfig.contracts?.TradingPairManager?.address;
    if (!address) {
      throw new Error('TradingPairManager contract not deployed');
    }
    return new ethers.Contract(
      address,
      TradingPairManagerABI,
      this.signer || this.provider
    );
  }

  getStockFactory() {
    const address = contractsConfig.contracts?.NigerianStockFactory?.address;
    if (!address) {
      throw new Error('NigerianStockFactory contract not deployed');
    }
    return new ethers.Contract(
      address,
      NigerianStockFactoryABI,
      this.signer || this.provider
    );
  }

  // NGN Stablecoin operations
  async getNGNBalance(address: string): Promise<string> {
    try {
      const contract = this.getNGNStablecoin();
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting NGN balance:', error);
      return '0';
    }
  }

  async mintNGN(to: string, amount: string): Promise<ethers.ContractTransactionResponse | null> {
    try {
      if (!this.signer) throw new Error('Wallet not connected');
      const contract = this.getNGNStablecoin();
      const tx = await contract.mint(to, ethers.parseEther(amount));
      return tx;
    } catch (error) {
      console.error('Error minting NGN:', error);
      return null;
    }
  }

  // Stock token operations
  async getStockBalance(symbol: string, address: string): Promise<string> {
    try {
      const contract = this.getStockToken(symbol);
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Error getting ${symbol} balance:`, error);
      return '0';
    }
  }

  async getStockInfo(symbol: string) {
    try {
      const contract = this.getStockToken(symbol);
      const [name, totalSupply, maxSupply, companyName] = await Promise.all([
        contract.name(),
        contract.totalSupply(),
        contract.maxSupply(),
        contract.companyName()
      ]);

      return {
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupply),
        maxSupply: ethers.formatEther(maxSupply),
        companyName,
        address: typedContractsConfig.stockTokens[symbol].address
      };
    } catch (error) {
      console.error(`Error getting ${symbol} info:`, error);
      return null;
    }
  }

  // DEX operations
  async getStockPrice(stockSymbol: string): Promise<string> {
    try {
      // TODO: Implement actual price fetching from DEX
      // const dex = this.getStockNGNDEX();
      // const stockAddress = contractsConfig.stockTokens[stockSymbol].address;
      // const ngnAddress = contractsConfig.contracts.NGNStablecoin.address;

      // Get price from DEX (this would depend on your DEX implementation)
      // For now, return a mock price
      return '100.00';
    } catch (error) {
      console.error(`Error getting ${stockSymbol} price:`, error);
      return '0';
    }
  }

  async swapNGNForStock(
    stockSymbol: string, 
    ngnAmount: string, 
    minStockAmount: string
  ): Promise<ethers.ContractTransactionResponse | null> {
    try {
      if (!this.signer) throw new Error('Wallet not connected');
      
      const dex = this.getStockNGNDEX();
      const stockAddress = typedContractsConfig.stockTokens[stockSymbol].address;
      
      const tx = await dex.swapNGNForStock(
        stockAddress,
        ethers.parseEther(ngnAmount),
        ethers.parseEther(minStockAmount)
      );
      
      return tx;
    } catch (error) {
      console.error('Error swapping NGN for stock:', error);
      return null;
    }
  }

  async swapStockForNGN(
    stockSymbol: string, 
    stockAmount: string, 
    minNGNAmount: string
  ): Promise<ethers.ContractTransactionResponse | null> {
    try {
      if (!this.signer) throw new Error('Wallet not connected');
      
      const dex = this.getStockNGNDEX();
      const stockAddress = typedContractsConfig.stockTokens[stockSymbol].address;
      
      const tx = await dex.swapStockForNGN(
        stockAddress,
        ethers.parseEther(stockAmount),
        ethers.parseEther(minNGNAmount)
      );
      
      return tx;
    } catch (error) {
      console.error('Error swapping stock for NGN:', error);
      return null;
    }
  }

  // Utility functions
  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  getExplorerUrl(txHash: string): string {
    return `${HEDERA_TESTNET_CONFIG.blockExplorer}/transaction/${txHash}`;
  }

  getContractExplorerUrl(address: string): string {
    return `${HEDERA_TESTNET_CONFIG.blockExplorer}/contract/${address}`;
  }

  // Get all deployed contracts info
  getDeployedContracts() {
    return {
      network: contractsConfig.network,
      lastUpdated: contractsConfig.lastUpdated,
      deploymentStatus: contractsConfig.deploymentStatus,
      contracts: contractsConfig.contracts,
      stockTokens: contractsConfig.stockTokens
    };
  }

  // Check if contracts are deployed
  isFullyDeployed(): boolean {
    return contractsConfig.deploymentStatus === 'complete';
  }

  // Get all available stock symbols
  getAvailableStocks(): string[] {
    return Object.keys(typedContractsConfig.stockTokens);
  }

  // Get stock token config
  getStockConfig(symbol: string) {
    return typedContractsConfig.stockTokens[symbol];
  }
}

// Export singleton instance
export const hederaContractService = new HederaContractService();

// Export contract addresses for easy access
export const CONTRACT_ADDRESSES = {
  NGN_STABLECOIN: contractsConfig.contracts?.NGNStablecoin?.address || '',
  STOCK_FACTORY: contractsConfig.contracts?.NigerianStockFactory?.address || '',
  STOCK_NGN_DEX: contractsConfig.contracts?.StockNGNDEX?.address || '',
  TRADING_PAIR_MANAGER: contractsConfig.contracts?.TradingPairManager?.address || '',
  STOCK_TOKENS: Object.fromEntries(
    Object.entries(contractsConfig.stockTokens || {}).map(([symbol, config]) => [
      symbol,
      config?.address || ''
    ])
  )
};

export default hederaContractService;

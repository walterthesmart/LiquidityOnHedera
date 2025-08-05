export const SUPPORTED_NETWORKS = {
  BITFINITY_TESTNET: {
    id: 355113,
    name: 'Bitfinity EVM Testnet',
    rpcUrl: 'https://testnet.bitfinity.network',
    blockExplorer: 'https://explorer.testnet.bitfinity.network',
    nativeCurrency: {
      name: 'BFT',
      symbol: 'BFT',
      decimals: 18
    }
  },
  ETHEREUM_SEPOLIA: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  HEDERA_TESTNET: {
    id: 296,
    name: 'Hedera Testnet',
    rpcUrl: 'https://testnet.hashio.io/api',
    blockExplorer: 'https://hashscan.io/testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    }
  }
} as const;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

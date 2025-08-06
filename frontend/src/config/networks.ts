export const SUPPORTED_NETWORKS = {
  // Primary network with deployed contracts
  ETHEREUM_SEPOLIA: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    isPrimary: true,
    hasContracts: true
  },
  // Hedera networks for native HTS tokens
  HEDERA_TESTNET: {
    id: 296,
    name: 'Hedera Testnet',
    rpcUrl: 'https://testnet.hashio.io/api',
    blockExplorer: 'https://hashscan.io/testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    },
    isPrimary: false,
    hasContracts: false
  },
  HEDERA_MAINNET: {
    id: 295,
    name: 'Hedera Mainnet',
    rpcUrl: 'https://mainnet.hashio.io/api',
    blockExplorer: 'https://hashscan.io/mainnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    },
    isPrimary: false,
    hasContracts: false
  },
  // Bitfinity EVM networks
  BITFINITY_TESTNET: {
    id: 355113,
    name: 'Bitfinity EVM Testnet',
    rpcUrl: 'https://testnet.bitfinity.network',
    blockExplorer: 'https://explorer.testnet.bitfinity.network',
    nativeCurrency: {
      name: 'BFT',
      symbol: 'BFT',
      decimals: 18
    },
    isPrimary: false,
    hasContracts: false
  }
} as const;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

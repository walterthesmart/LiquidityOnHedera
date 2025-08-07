// RainbowKit configuration for multi-network EVM integration
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from "wagmi/chains";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Define Bitfinity EVM custom chains
export const bitfinityTestnet = {
  id: 355113,
  name: "Bitfinity Testnet",
  network: "bitfinity-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BTF",
    symbol: "BTF",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.bitfinity.network"],
    },
    public: {
      http: ["https://testnet.bitfinity.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bitfinity Explorer",
      url: "https://explorer.testnet.bitfinity.network",
    },
  },
  testnet: true,
  iconUrl: "/logo/png/BITFINITY.png",
  iconBackground: "#fff",
} as const;

export const bitfinityMainnet = {
  id: 355110,
  name: "Bitfinity Mainnet",
  network: "bitfinity-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BTF",
    symbol: "BTF",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.bitfinity.network"],
    },
    public: {
      http: ["https://mainnet.bitfinity.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bitfinity Explorer",
      url: "https://explorer.bitfinity.network",
    },
  },
  testnet: false,
  iconUrl: "/logo/png/BITFINITY.png",
  iconBackground: "#fff",
} as const;

// Define Hedera Hashgraph custom chains
export const hederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  network: "hedera-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
    public: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
  iconUrl: "/logo/png/HEDERA.png",
  iconBackground: "#fff",
} as const;

export const hederaMainnet = {
  id: 295,
  name: "Hedera Mainnet",
  network: "hedera-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.hashio.io/api"],
    },
    public: {
      http: ["https://mainnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/mainnet",
    },
  },
  testnet: false,
  iconUrl: "/logo/png/HEDERA.png",
  iconBackground: "#fff",
} as const;

// Legacy RainbowKit configuration - now replaced by the main configuration in rainbowkit.tsx
// This config is kept for reference but the active configuration includes Bitfinity EVM networks

export const config: ReturnType<typeof getDefaultConfig> = getDefaultConfig({
  appName: "Liquidity Nigerian Stock Trading",
  projectId,
  chains: [
    // Primary networks for Nigerian stock trading
    hederaTestnet,
    hederaMainnet,
    bitfinityTestnet,
    bitfinityMainnet,
    // Include popular chains for broader wallet support
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});

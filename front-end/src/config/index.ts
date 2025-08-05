// RainbowKit configuration for multi-network EVM integration
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
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

// Legacy RainbowKit configuration - now replaced by the main configuration in rainbowkit.tsx
// This config is kept for reference but the active configuration includes Bitfinity EVM networks

export const config: ReturnType<typeof getDefaultConfig> = getDefaultConfig({
  appName: "Liquidity Nigerian Stock Trading",
  projectId,
  chains: [
    // Primary networks for Nigerian stock trading
    bitfinityTestnet,
    bitfinityMainnet,
    sepolia, // Ethereum Sepolia testnet for additional testing
    // Include popular chains for broader wallet support
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});

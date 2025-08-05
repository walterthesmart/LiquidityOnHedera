import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenvConfig({ path: resolve(__dirname, ".env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Bitfinity EVM Networks
    bitfinity_testnet: {
      url: "https://testnet.bitfinity.network",
      chainId: 355113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    bitfinity_mainnet: {
      url: "https://mainnet.bitfinity.network",
      chainId: 355110,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 11155111,
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Hedera Testnet
    hedera: {
      url: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    // Block explorer configuration
    apiKey: {
      bitfinity_testnet: "no-api-key-needed",
      bitfinity_mainnet: "no-api-key-needed",
      sepolia: process.env.ETHERSCAN_API_KEY || "dummy",
      hedera: "no-api-key-needed",
    },
    customChains: [
      {
        network: "bitfinity_testnet",
        chainId: 355113,
        urls: {
          apiURL: "https://explorer.testnet.bitfinity.network/api",
          browserURL: "https://explorer.testnet.bitfinity.network",
        },
      },
      {
        network: "bitfinity_mainnet",
        chainId: 355110,
        urls: {
          apiURL: "https://explorer.bitfinity.network/api",
          browserURL: "https://explorer.bitfinity.network",
        },
      },
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
      {
        network: "hedera",
        chainId: 296,
        urls: {
          apiURL: "https://hashscan.io/testnet/api",
          browserURL: "https://hashscan.io/testnet",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;

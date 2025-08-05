import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

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
    hardhat: {
      chainId: 31337,
      gas: 30000000,
      gasPrice: 1000000000,
      blockGasLimit: 30000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 30000000,
      gasPrice: 1000000000,
      blockGasLimit: 30000000,
    },
    bitfinity_testnet: {
      url: "https://testnet.bitfinity.network",
      chainId: 355113,
      accounts: process.env.BITFINITY_PRIVATE_KEY ? [process.env.BITFINITY_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    bitfinity_mainnet: {
      url: "https://mainnet.bitfinity.network",
      chainId: 355110,
      accounts: process.env.BITFINITY_PRIVATE_KEY ? [process.env.BITFINITY_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 11155111,
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    // Hedera Testnet
    hedera_testnet: {
      url: process.env.HEDERA_TESTNET_RPC_URL || "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
      timeout: 60000,
    },
    // Hedera Mainnet
    hedera_mainnet: {
      url: process.env.HEDERA_MAINNET_RPC_URL || "https://mainnet.hashio.io/api",
      chainId: 295,
      accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
  },
  etherscan: {
    // Block explorer API configuration
    apiKey: {
      bitfinity_testnet: process.env.BITFINITY_API_KEY || "dummy",
      bitfinity_mainnet: process.env.BITFINITY_API_KEY || "dummy",
      sepolia: process.env.ETHERSCAN_API_KEY || "dummy",
    },
    customChains: [
      {
        network: "bitfinity_testnet",
        chainId: 355113,
        urls: {
          apiURL: "https://explorer-api.testnet.bitfinity.network/api",
          browserURL: "https://explorer.testnet.bitfinity.network",
        },
      },
      {
        network: "bitfinity_mainnet",
        chainId: 355110,
        urls: {
          apiURL: "https://explorer-api.bitfinity.network/api",
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
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
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

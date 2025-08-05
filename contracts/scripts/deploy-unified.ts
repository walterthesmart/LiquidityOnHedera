import { ethers } from "hardhat";
import { writeFileSync, existsSync, mkdirSync, copyFileSync, readFileSync } from "fs";
import { resolve, join } from "path";

/**
 * Unified Multi-EVM Deployment Script
 *
 * This script consolidates all contract deployments into a single command:
 * - NGN Stablecoin contract
 * - Stock Token Factory contract
 * - StockNGNDEX contract
 * - TradingPairManager contract
 * - Stock tokens (if needed)
 *
 * Features:
 * - Supports multiple networks (Bitfinity, Sepolia, Hedera, etc.)
 * - Automatic ABI transfer to front-end
 * - Deployment verification
 * - Comprehensive error handling
 * - Deployment summary generation
 */

interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl?: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface ContractConfig {
  ngnStablecoin: {
    name: string;
    symbol: string;
    maxSupply: string;
    mintingCap: string;
    mintingEnabled: boolean;
    burningEnabled: boolean;
    transfersEnabled: boolean;
  };
  dex: {
    defaultFeeRate: number;
    maxPriceImpact: number;
    minLiquidity: string;
    swapDeadline: number;
    emergencyMode: boolean;
  };
  tradingPairManager: {
    defaultFeeRate: number;
    defaultLiquidityTarget: string;
    defaultRebalanceThreshold: number;
    maxPairsPerBatch: number;
    autoLiquidityEnabled: boolean;
    emergencyWithdrawDelay: number;
  };
  stockFactory: {
    deployStockTokens: boolean;
    stockTokensToCreate: Array<{
      name: string;
      symbol: string;
      totalSupply: string;
      companyName: string;
      sector: string;
      marketCap: string;
    }>;
  };
}

interface DeploymentResult {
  network: NetworkConfig;
  deployer: string;
  timestamp: string;
  totalGasUsed: string;
  estimatedCostETH: string;
  contracts: {
    ngnStablecoin?: {
      address: string;
      txHash: string;
      gasUsed: string;
    };
    stockFactory?: {
      address: string;
      txHash: string;
      gasUsed: string;
    };
    stockNGNDEX?: {
      address: string;
      txHash: string;
      gasUsed: string;
    };
    tradingPairManager?: {
      address: string;
      txHash: string;
      gasUsed: string;
    };
  };
  stockTokens: Array<{
    name: string;
    symbol: string;
    address: string;
    txHash: string;
    gasUsed: string;
  }>;
  verification: {
    verified: boolean;
    errors: string[];
  };
  abiTransfer: {
    success: boolean;
    transferredFiles: string[];
    errors: string[];
  };
}

// Network configurations
const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  bitfinity: {
    name: "Bitfinity EVM Testnet",
    chainId: 355113,
    rpcUrl: "https://testnet.bitfinity.network",
    blockExplorer: "https://explorer.testnet.bitfinity.network",
    nativeCurrency: {
      name: "Bitfinity Token",
      symbol: "BFT",
      decimals: 18,
    },
  },
  sepolia: {
    name: "Ethereum Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  hedera: {
    name: "Hedera Testnet",
    chainId: 296,
    rpcUrl: "https://testnet.hashio.io/api",
    blockExplorer: "https://hashscan.io/testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
  },
  localhost: {
    name: "Hardhat Local",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

// Contract configurations by network
const CONTRACT_CONFIGS: Record<string, ContractConfig> = {
  bitfinity: {
    ngnStablecoin: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(), // 1B NGN
      mintingCap: ethers.parseEther("10000000").toString(), // 10M NGN daily
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dex: {
      defaultFeeRate: 30, // 0.3%
      maxPriceImpact: 500, // 5%
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false,
    },
    tradingPairManager: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000, // 10%
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400, // 24 hours
    },
    stockFactory: {
      deployStockTokens: false, // Use existing tokens from Sepolia
      stockTokensToCreate: [],
    },
  },
  sepolia: {
    ngnStablecoin: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(),
      mintingCap: ethers.parseEther("10000000").toString(),
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dex: {
      defaultFeeRate: 30,
      maxPriceImpact: 500,
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800,
      emergencyMode: false,
    },
    tradingPairManager: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000,
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400,
    },
    stockFactory: {
      deployStockTokens: true, // Deploy stock tokens on Sepolia
      stockTokensToCreate: [
        {
          name: "Dangote Cement",
          symbol: "DANGCEM",
          totalSupply: ethers.parseEther("1000000").toString(),
          companyName: "Dangote Cement Plc",
          sector: "Industrial Goods",
          marketCap: ethers.parseEther("7710000000000").toString(), // 7.71T NGN
        },
        {
          name: "MTN Nigeria",
          symbol: "MTNN",
          totalSupply: ethers.parseEther("2000000").toString(),
          companyName: "MTN Nigeria Communications Plc",
          sector: "ICT",
          marketCap: ethers.parseEther("5500000000000").toString(), // 5.5T NGN
        },
        // Add more as needed
      ],
    },
  },
  hedera: {
    ngnStablecoin: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(),
      mintingCap: ethers.parseEther("10000000").toString(),
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dex: {
      defaultFeeRate: 30,
      maxPriceImpact: 500,
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800,
      emergencyMode: false,
    },
    tradingPairManager: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000,
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400,
    },
    stockFactory: {
      deployStockTokens: false,
      stockTokensToCreate: [],
    },
  },
  localhost: {
    ngnStablecoin: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(),
      mintingCap: ethers.parseEther("10000000").toString(),
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dex: {
      defaultFeeRate: 30,
      maxPriceImpact: 500,
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800,
      emergencyMode: false,
    },
    tradingPairManager: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000,
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400,
    },
    stockFactory: {
      deployStockTokens: true,
      stockTokensToCreate: [
        {
          name: "Test Stock A",
          symbol: "TESTA",
          totalSupply: ethers.parseEther("1000000").toString(),
          companyName: "Test Company A",
          sector: "Technology",
          marketCap: ethers.parseEther("1000000000").toString(), // 1B NGN
        },
        {
          name: "Test Stock B",
          symbol: "TESTB",
          totalSupply: ethers.parseEther("500000").toString(),
          companyName: "Test Company B",
          sector: "Finance",
          marketCap: ethers.parseEther("500000000").toString(), // 500M NGN
        },
      ],
    },
  },
};

/**
 * Transfer ABIs from contract artifacts to front-end directory
 */
async function transferABIs(deploymentResult: DeploymentResult): Promise<void> {
  console.log("\n📁 Transferring ABIs to front-end...");

  const artifactsDir = resolve(__dirname, "../artifacts/contracts");
  const frontendABIDir = resolve(__dirname, "../../front-end/src/abis");

  // Ensure front-end ABI directory exists
  if (!existsSync(frontendABIDir)) {
    mkdirSync(frontendABIDir, { recursive: true });
  }

  const abiFiles = [
    "NGNStablecoin.sol/NGNStablecoin.json",
    "NigerianStockTokenFactory.sol/NigerianStockTokenFactory.json",
    "NigerianStockToken.sol/NigerianStockToken.json",
    "StockNGNDEX.sol/StockNGNDEX.json",
    "TradingPairManager.sol/TradingPairManager.json",
  ];

  deploymentResult.abiTransfer.transferredFiles = [];
  deploymentResult.abiTransfer.errors = [];

  for (const abiFile of abiFiles) {
    try {
      const sourcePath = join(artifactsDir, abiFile);
      const fileName = abiFile.split("/")[1]; // Get just the filename
      const destPath = join(frontendABIDir, fileName);

      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        deploymentResult.abiTransfer.transferredFiles.push(fileName);
        console.log(`   ✅ Copied ${fileName}`);
      } else {
        const error = `Source file not found: ${sourcePath}`;
        deploymentResult.abiTransfer.errors.push(error);
        console.log(`   ⚠️  ${error}`);
      }
    } catch (error) {
      const errorMsg = `Failed to copy ${abiFile}: ${error}`;
      deploymentResult.abiTransfer.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }

  deploymentResult.abiTransfer.success = deploymentResult.abiTransfer.errors.length === 0;

  // Update front-end ABI index file
  await updateABIIndex(deploymentResult);
}

/**
 * Update the front-end ABI index file with new contract addresses
 */
async function updateABIIndex(deploymentResult: DeploymentResult): Promise<void> {
  try {
    const indexPath = resolve(__dirname, "../../front-end/src/abis/index.ts");

    if (!existsSync(indexPath)) {
      console.log("   ⚠️  ABI index file not found, skipping address update");
      return;
    }

    let indexContent = readFileSync(indexPath, "utf8");

    // Update contract addresses for the deployed network
    const chainId = deploymentResult.network.chainId;

    // Create address updates
    const addressUpdates: Record<string, string> = {};

    if (deploymentResult.contracts.ngnStablecoin) {
      addressUpdates.ngnStablecoin = deploymentResult.contracts.ngnStablecoin.address;
    }
    if (deploymentResult.contracts.stockFactory) {
      addressUpdates.factoryAddress = deploymentResult.contracts.stockFactory.address;
    }
    if (deploymentResult.contracts.stockNGNDEX) {
      addressUpdates.stockNGNDEX = deploymentResult.contracts.stockNGNDEX.address;
    }
    if (deploymentResult.contracts.tradingPairManager) {
      addressUpdates.tradingPairManager = deploymentResult.contracts.tradingPairManager.address;
    }

    // Update stock token addresses
    const tokenUpdates: Record<string, string> = {};
    for (const token of deploymentResult.stockTokens) {
      tokenUpdates[token.symbol] = token.address;
    }

    // Replace the addresses in the index file
    const chainIdPattern = new RegExp(
      `(${chainId}:\\s*{[^}]*?)("factoryAddress":\\s*)"[^"]*"`,
      "g"
    );
    if (addressUpdates.factoryAddress) {
      indexContent = indexContent.replace(chainIdPattern, `$1$2"${addressUpdates.factoryAddress}"`);
    }

    // Write updated content back
    writeFileSync(indexPath, indexContent);
    console.log("   ✅ Updated ABI index with new contract addresses");
  } catch (error) {
    console.error(`   ❌ Failed to update ABI index: ${error}`);
    deploymentResult.abiTransfer.errors.push(`Failed to update ABI index: ${error}`);
  }
}

/**
 * Verify deployed contracts
 */
async function verifyContracts(deploymentResult: DeploymentResult): Promise<void> {
  console.log("\n🔍 Verifying deployed contracts...");

  deploymentResult.verification.verified = true;
  deploymentResult.verification.errors = [];

  try {
    // Verify NGN Stablecoin
    if (deploymentResult.contracts.ngnStablecoin) {
      console.log("   Verifying NGN Stablecoin...");
      const ngnContract = await ethers.getContractAt(
        "NGNStablecoin",
        deploymentResult.contracts.ngnStablecoin.address
      );

      const [name, symbol, decimals] = await Promise.all([
        ngnContract.name(),
        ngnContract.symbol(),
        ngnContract.decimals(),
      ]);

      console.log(`   ✅ NGN Stablecoin: ${name} (${symbol}) - ${decimals} decimals`);
    }

    // Verify Stock Factory
    if (deploymentResult.contracts.stockFactory) {
      console.log("   Verifying Stock Factory...");
      const factoryContract = await ethers.getContractAt(
        "NigerianStockTokenFactory",
        deploymentResult.contracts.stockFactory.address
      );

      const totalTokens = await factoryContract.totalDeployedTokens();
      console.log(`   ✅ Stock Factory: ${totalTokens} tokens deployed`);
    }

    // Verify DEX
    if (deploymentResult.contracts.stockNGNDEX) {
      console.log("   Verifying StockNGNDEX...");
      const dexContract = await ethers.getContractAt(
        "StockNGNDEX",
        deploymentResult.contracts.stockNGNDEX.address
      );

      const ngnToken = await dexContract.ngnToken();
      console.log(`   ✅ StockNGNDEX: NGN token at ${ngnToken}`);
    }

    // Verify Trading Pair Manager
    if (deploymentResult.contracts.tradingPairManager) {
      console.log("   Verifying TradingPairManager...");
      const managerContract = await ethers.getContractAt(
        "TradingPairManager",
        deploymentResult.contracts.tradingPairManager.address
      );

      const dexAddress = await managerContract.dexContract();
      console.log(`   ✅ TradingPairManager: DEX at ${dexAddress}`);
    }

    // Verify stock tokens
    for (const token of deploymentResult.stockTokens) {
      console.log(`   Verifying ${token.symbol}...`);
      const tokenContract = await ethers.getContractAt("NigerianStockToken", token.address);

      const [name, symbol, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.totalSupply(),
      ]);

      console.log(`   ✅ ${symbol}: ${name} - ${ethers.formatEther(totalSupply)} tokens`);
    }
  } catch (error) {
    deploymentResult.verification.verified = false;
    const errorMsg = `Contract verification failed: ${error}`;
    deploymentResult.verification.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

/**
 * Save deployment results to file
 */
async function saveDeploymentResults(deploymentResult: DeploymentResult): Promise<void> {
  console.log("\n💾 Saving deployment results...");

  const deploymentsDir = resolve(__dirname, "../deployments");
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = deploymentResult.network.name.toLowerCase().replace(/\s+/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Save detailed deployment result
  const deploymentFile = join(deploymentsDir, `${networkName}-${timestamp}.json`);
  writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));

  // Save latest deployment (for easy reference)
  const latestFile = join(deploymentsDir, `${networkName}-latest.json`);
  writeFileSync(latestFile, JSON.stringify(deploymentResult, null, 2));

  console.log(`   ✅ Deployment results saved to: ${deploymentFile}`);
  console.log(`   ✅ Latest deployment saved to: ${latestFile}`);
}

/**
 * Print deployment summary
 */
function printDeploymentSummary(deploymentResult: DeploymentResult): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));

  console.log(
    `📡 Network: ${deploymentResult.network.name} (Chain ID: ${deploymentResult.network.chainId})`
  );
  console.log(`👤 Deployer: ${deploymentResult.deployer}`);
  console.log(`⏰ Timestamp: ${deploymentResult.timestamp}`);
  console.log(`⛽ Total Gas Used: ${deploymentResult.totalGasUsed}`);
  console.log(
    `💰 Estimated Cost: ${deploymentResult.estimatedCostETH} ${deploymentResult.network.nativeCurrency.symbol}`
  );

  console.log("\n📦 DEPLOYED CONTRACTS:");
  if (deploymentResult.contracts.ngnStablecoin) {
    console.log(`   NGN Stablecoin: ${deploymentResult.contracts.ngnStablecoin.address}`);
    console.log(`   └─ Transaction: ${deploymentResult.contracts.ngnStablecoin.txHash}`);
  }
  if (deploymentResult.contracts.stockFactory) {
    console.log(`   Stock Factory: ${deploymentResult.contracts.stockFactory.address}`);
    console.log(`   └─ Transaction: ${deploymentResult.contracts.stockFactory.txHash}`);
  }
  if (deploymentResult.contracts.stockNGNDEX) {
    console.log(`   StockNGNDEX: ${deploymentResult.contracts.stockNGNDEX.address}`);
    console.log(`   └─ Transaction: ${deploymentResult.contracts.stockNGNDEX.txHash}`);
  }
  if (deploymentResult.contracts.tradingPairManager) {
    console.log(`   TradingPairManager: ${deploymentResult.contracts.tradingPairManager.address}`);
    console.log(`   └─ Transaction: ${deploymentResult.contracts.tradingPairManager.txHash}`);
  }

  if (deploymentResult.stockTokens.length > 0) {
    console.log("\n🪙 DEPLOYED STOCK TOKENS:");
    for (const token of deploymentResult.stockTokens) {
      console.log(`   ${token.symbol}: ${token.address}`);
      console.log(`   └─ ${token.name} (${token.txHash})`);
    }
  }

  console.log("\n🔍 VERIFICATION:");
  if (deploymentResult.verification.verified) {
    console.log("   ✅ All contracts verified successfully");
  } else {
    console.log("   ❌ Verification failed:");
    for (const error of deploymentResult.verification.errors) {
      console.log(`      - ${error}`);
    }
  }

  console.log("\n📁 ABI TRANSFER:");
  if (deploymentResult.abiTransfer.success) {
    console.log("   ✅ ABIs transferred successfully to front-end");
    console.log(`   📄 Files transferred: ${deploymentResult.abiTransfer.transferredFiles.length}`);
    for (const file of deploymentResult.abiTransfer.transferredFiles) {
      console.log(`      - ${file}`);
    }
  } else {
    console.log("   ❌ ABI transfer failed:");
    for (const error of deploymentResult.abiTransfer.errors) {
      console.log(`      - ${error}`);
    }
  }

  if (deploymentResult.network.blockExplorer) {
    console.log("\n🔗 BLOCK EXPLORER LINKS:");
    if (deploymentResult.contracts.ngnStablecoin) {
      console.log(
        `   NGN Stablecoin: ${deploymentResult.network.blockExplorer}/address/${deploymentResult.contracts.ngnStablecoin.address}`
      );
    }
    if (deploymentResult.contracts.stockFactory) {
      console.log(
        `   Stock Factory: ${deploymentResult.network.blockExplorer}/address/${deploymentResult.contracts.stockFactory.address}`
      );
    }
    if (deploymentResult.contracts.stockNGNDEX) {
      console.log(
        `   StockNGNDEX: ${deploymentResult.network.blockExplorer}/address/${deploymentResult.contracts.stockNGNDEX.address}`
      );
    }
    if (deploymentResult.contracts.tradingPairManager) {
      console.log(
        `   TradingPairManager: ${deploymentResult.network.blockExplorer}/address/${deploymentResult.contracts.tradingPairManager.address}`
      );
    }
  }

  console.log("\n🔗 NEXT STEPS:");
  console.log("1. Update front-end configuration with new contract addresses");
  console.log("2. Create trading pairs for stock tokens");
  console.log("3. Add initial liquidity to trading pairs");
  console.log("4. Test swapping functionality");
  console.log("5. Set up monitoring and alerts");

  console.log(`\n${"=".repeat(80)}`);
}

/**
 * Main deployment function
 */
async function deployUnified(networkName: string): Promise<void> {
  console.log("🚀 Starting Unified Deployment...");
  console.log(`📡 Target Network: ${networkName}\n`);

  // Validate network
  const networkConfig = NETWORK_CONFIGS[networkName];
  const contractConfig = CONTRACT_CONFIGS[networkName];

  if (!networkConfig || !contractConfig) {
    throw new Error(
      `Unsupported network: ${networkName}. Supported networks: ${Object.keys(NETWORK_CONFIGS).join(", ")}`
    );
  }

  // Get deployer and network info
  const [deployer] = await ethers.getSigners();

  console.log(`👤 Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ${networkConfig.nativeCurrency.symbol}`);

  if (balance < ethers.parseEther("0.01")) {
    console.log(
      `⚠️  Warning: Low ${networkConfig.nativeCurrency.symbol} balance. You may need more for deployment.`
    );
  }

  // Initialize deployment result
  const deploymentResult: DeploymentResult = {
    network: networkConfig,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    totalGasUsed: "0",
    estimatedCostETH: "0",
    contracts: {},
    stockTokens: [],
    verification: {
      verified: false,
      errors: [],
    },
    abiTransfer: {
      success: false,
      transferredFiles: [],
      errors: [],
    },
  };

  let totalGasUsed = 0n;

  try {
    // Step 1: Deploy NGN Stablecoin
    console.log("\n📦 Step 1: Deploying NGN Stablecoin...");
    const NGNStablecoin = await ethers.getContractFactory("NGNStablecoin");

    const ngnStablecoin = await NGNStablecoin.deploy(deployer.address, {
      name: contractConfig.ngnStablecoin.name,
      symbol: contractConfig.ngnStablecoin.symbol,
      decimals: 18,
      maxSupply: contractConfig.ngnStablecoin.maxSupply,
      mintingCap: contractConfig.ngnStablecoin.mintingCap,
      lastMintReset: 0,
      currentDayMinted: 0,
      mintingEnabled: contractConfig.ngnStablecoin.mintingEnabled,
      burningEnabled: contractConfig.ngnStablecoin.burningEnabled,
      transfersEnabled: contractConfig.ngnStablecoin.transfersEnabled,
    });

    await ngnStablecoin.waitForDeployment();
    const ngnAddress = await ngnStablecoin.getAddress();

    const ngnTx = ngnStablecoin.deploymentTransaction();
    if (ngnTx) {
      const ngnReceipt = await ngnTx.wait();
      if (ngnReceipt) {
        totalGasUsed += ngnReceipt.gasUsed;
        deploymentResult.contracts.ngnStablecoin = {
          address: ngnAddress,
          txHash: ngnReceipt.hash,
          gasUsed: ngnReceipt.gasUsed.toString(),
        };
      }
    }

    console.log(`   ✅ NGN Stablecoin deployed: ${ngnAddress}`);

    // Step 2: Deploy Stock Factory (if needed)
    let stockFactoryAddress = "";
    if (contractConfig.stockFactory.deployStockTokens) {
      console.log("\n📦 Step 2: Deploying Stock Token Factory...");
      const StockFactory = await ethers.getContractFactory("NigerianStockTokenFactory");

      const stockFactory = await StockFactory.deploy(deployer.address);
      await stockFactory.waitForDeployment();
      stockFactoryAddress = await stockFactory.getAddress();

      const factoryTx = stockFactory.deploymentTransaction();
      if (factoryTx) {
        const factoryReceipt = await factoryTx.wait();
        if (factoryReceipt) {
          totalGasUsed += factoryReceipt.gasUsed;
          deploymentResult.contracts.stockFactory = {
            address: stockFactoryAddress,
            txHash: factoryReceipt.hash,
            gasUsed: factoryReceipt.gasUsed.toString(),
          };
        }
      }

      console.log(`   ✅ Stock Factory deployed: ${stockFactoryAddress}`);

      // Deploy stock tokens
      console.log("\n📦 Step 2b: Deploying Stock Tokens...");
      for (const tokenConfig of contractConfig.stockFactory.stockTokensToCreate) {
        console.log(`   Deploying ${tokenConfig.symbol}...`);

        // Prepare stock metadata
        const stockMetadata = {
          symbol: tokenConfig.symbol,
          companyName: tokenConfig.companyName,
          sector: tokenConfig.sector,
          totalShares: tokenConfig.totalSupply,
          marketCap: tokenConfig.marketCap,
          isActive: true,
          lastUpdated: Math.floor(Date.now() / 1000),
        };

        const deployTx = await stockFactory.deployStockToken(
          tokenConfig.name,
          tokenConfig.symbol,
          tokenConfig.totalSupply,
          stockMetadata,
          deployer.address
        );

        const deployReceipt = await deployTx.wait();
        if (deployReceipt) {
          totalGasUsed += deployReceipt.gasUsed;

          // Get the deployed token address from events
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const deployedEvent = deployReceipt.logs.find((log: any) => {
            try {
              const parsed = stockFactory.interface.parseLog(log);
              return parsed?.name === "StockTokenDeployed";
            } catch {
              return false;
            }
          });

          if (deployedEvent) {
            const parsed = stockFactory.interface.parseLog(deployedEvent);
            const tokenAddress = parsed?.args[0];

            deploymentResult.stockTokens.push({
              name: tokenConfig.name,
              symbol: tokenConfig.symbol,
              address: tokenAddress,
              txHash: deployReceipt.hash,
              gasUsed: deployReceipt.gasUsed.toString(),
            });

            console.log(`      ✅ ${tokenConfig.symbol} deployed: ${tokenAddress}`);
          }
        }

        // Small delay to avoid overwhelming the network
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } else {
      console.log("\n⏭️  Step 2: Skipping Stock Factory deployment (using existing tokens)");
    }

    // Step 3: Deploy StockNGNDEX
    console.log("\n📦 Step 3: Deploying StockNGNDEX...");
    const StockNGNDEX = await ethers.getContractFactory("StockNGNDEX");

    const stockNGNDEX = await StockNGNDEX.deploy(ngnAddress, deployer.address, {
      defaultFeeRate: contractConfig.dex.defaultFeeRate,
      maxPriceImpact: contractConfig.dex.maxPriceImpact,
      minLiquidity: contractConfig.dex.minLiquidity,
      swapDeadline: contractConfig.dex.swapDeadline,
      emergencyMode: contractConfig.dex.emergencyMode,
    });

    await stockNGNDEX.waitForDeployment();
    const dexAddress = await stockNGNDEX.getAddress();

    const dexTx = stockNGNDEX.deploymentTransaction();
    if (dexTx) {
      const dexReceipt = await dexTx.wait();
      if (dexReceipt) {
        totalGasUsed += dexReceipt.gasUsed;
        deploymentResult.contracts.stockNGNDEX = {
          address: dexAddress,
          txHash: dexReceipt.hash,
          gasUsed: dexReceipt.gasUsed.toString(),
        };
      }
    }

    console.log(`   ✅ StockNGNDEX deployed: ${dexAddress}`);

    // Step 4: Deploy TradingPairManager
    console.log("\n📦 Step 4: Deploying TradingPairManager...");
    const TradingPairManager = await ethers.getContractFactory("TradingPairManager");

    const tradingPairManager = await TradingPairManager.deploy(
      ngnAddress,
      dexAddress,
      stockFactoryAddress || ethers.ZeroAddress, // Use zero address if no factory deployed
      deployer.address,
      {
        defaultFeeRate: contractConfig.tradingPairManager.defaultFeeRate,
        defaultLiquidityTarget: contractConfig.tradingPairManager.defaultLiquidityTarget,
        defaultRebalanceThreshold: contractConfig.tradingPairManager.defaultRebalanceThreshold,
        maxPairsPerBatch: contractConfig.tradingPairManager.maxPairsPerBatch,
        autoLiquidityEnabled: contractConfig.tradingPairManager.autoLiquidityEnabled,
        emergencyWithdrawDelay: contractConfig.tradingPairManager.emergencyWithdrawDelay,
      }
    );

    await tradingPairManager.waitForDeployment();
    const managerAddress = await tradingPairManager.getAddress();

    const managerTx = tradingPairManager.deploymentTransaction();
    if (managerTx) {
      const managerReceipt = await managerTx.wait();
      if (managerReceipt) {
        totalGasUsed += managerReceipt.gasUsed;
        deploymentResult.contracts.tradingPairManager = {
          address: managerAddress,
          txHash: managerReceipt.hash,
          gasUsed: managerReceipt.gasUsed.toString(),
        };
      }
    }

    console.log(`   ✅ TradingPairManager deployed: ${managerAddress}`);

    // Step 5: Mint initial NGN supply for testing
    console.log("\n💰 Step 5: Minting initial NGN supply...");
    const initialMintAmount = ethers.parseEther("1000000"); // 1M NGN for testing
    const mintTx = await ngnStablecoin.mint(deployer.address, initialMintAmount);
    const mintReceipt = await mintTx.wait();
    if (mintReceipt) {
      totalGasUsed += mintReceipt.gasUsed;
    }
    console.log(`   ✅ Minted ${ethers.formatEther(initialMintAmount)} NGN for testing`);

    // Update final gas usage and cost estimation
    deploymentResult.totalGasUsed = totalGasUsed.toString();
    const gasPrice = await ethers.provider.getFeeData();
    const estimatedCost = totalGasUsed * (gasPrice.gasPrice || 0n);
    deploymentResult.estimatedCostETH = ethers.formatEther(estimatedCost);

    // Step 6: Verify contracts
    await verifyContracts(deploymentResult);

    // Step 7: Transfer ABIs to front-end
    await transferABIs(deploymentResult);

    // Step 8: Save deployment results
    await saveDeploymentResults(deploymentResult);

    // Step 9: Print summary
    printDeploymentSummary(deploymentResult);

    console.log("\n🎉 Unified deployment completed successfully!");
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Get network name from command line arguments or environment
  const networkName = process.env.HARDHAT_NETWORK || "localhost";

  console.log("🚀 Unified Multi-EVM Deployment Script");
  console.log("=====================================");

  await deployUnified(networkName);
}

// Execute deployment if this script is run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { deployUnified, NETWORK_CONFIGS, CONTRACT_CONFIGS };

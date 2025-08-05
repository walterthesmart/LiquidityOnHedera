import { ethers } from "hardhat";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

/**
 * Multi-EVM Deployment Script for NGN Stablecoin + DEX System
 *
 * This script deploys the complete tokenized asset trading system including:
 * - NGN Stablecoin contract
 * - StockNGNDEX contract
 * - TradingPairManager contract
 * - Integration with existing stock tokens
 *
 * Supports deployment to:
 * - Bitfinity EVM Testnet (preferred)
 * - Ethereum Sepolia Testnet (where stocks are deployed)
 * - Other EVM-compatible networks
 */

interface DeploymentConfig {
  network: string;
  chainId: number;
  ngnConfig: {
    name: string;
    symbol: string;
    maxSupply: string;
    mintingCap: string;
    mintingEnabled: boolean;
    burningEnabled: boolean;
    transfersEnabled: boolean;
  };
  dexConfig: {
    defaultFeeRate: number;
    maxPriceImpact: number;
    minLiquidity: string;
    swapDeadline: number;
    emergencyMode: boolean;
  };
  managerConfig: {
    defaultFeeRate: number;
    defaultLiquidityTarget: string;
    defaultRebalanceThreshold: number;
    maxPairsPerBatch: number;
    autoLiquidityEnabled: boolean;
    emergencyWithdrawDelay: number;
  };
  stockTokens?: string[]; // Existing stock token addresses for integration
}

interface DeploymentResult {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  gasUsed: string;
  contracts: {
    ngnStablecoin: string;
    stockNGNDEX: string;
    tradingPairManager: string;
    stockFactory?: string;
  };
  configuration: DeploymentConfig;
  tradingPairs: Array<{
    stockToken: string;
    symbol: string;
    companyName: string;
    initialNGNLiquidity: string;
    initialStockLiquidity: string;
    feeRate: number;
  }>;
}

// Network-specific configurations
const NETWORK_CONFIGS: Record<string, DeploymentConfig> = {
  bitfinity_testnet: {
    network: "Bitfinity EVM Testnet",
    chainId: 355113,
    ngnConfig: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(), // 1B NGN max supply
      mintingCap: ethers.parseEther("10000000").toString(), // 10M NGN daily minting cap
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dexConfig: {
      defaultFeeRate: 30, // 0.3% fee
      maxPriceImpact: 500, // 5% max price impact
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false,
    },
    managerConfig: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(), // 100K NGN default target
      defaultRebalanceThreshold: 1000, // 10% threshold
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400, // 24 hours
    },
  },
  sepolia: {
    network: "Ethereum Sepolia Testnet",
    chainId: 11155111,
    ngnConfig: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(),
      mintingCap: ethers.parseEther("10000000").toString(),
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dexConfig: {
      defaultFeeRate: 30,
      maxPriceImpact: 500,
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800,
      emergencyMode: false,
    },
    managerConfig: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000,
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400,
    },
    // Existing stock tokens on Sepolia (from your deployment)
    stockTokens: [
      "0x2EC5d749D0DF8Aa8b1Af4128d0b0Cb76417A8DeE", // DANGCEM
      "0xa19FB869e72ecC01797BcF57B690Ecee3101888A", // MTNN
      "0x00b41E1164843E291bB5B496b50E3b143C278016", // ZENITHBANK
      "0x2f6c483D1ad3659B9b915cA164Fd6BA4089788EE", // GTCO
      "0x085b9cD55F29b89362C80429e8C406Cf809625C6", // NB
    ],
  },
  hardhat: {
    network: "Hardhat Local",
    chainId: 31337,
    ngnConfig: {
      name: "Nigerian Naira Stablecoin",
      symbol: "NGN",
      maxSupply: ethers.parseEther("1000000000").toString(),
      mintingCap: ethers.parseEther("10000000").toString(),
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true,
    },
    dexConfig: {
      defaultFeeRate: 30,
      maxPriceImpact: 500,
      minLiquidity: ethers.parseEther("1000").toString(),
      swapDeadline: 1800,
      emergencyMode: false,
    },
    managerConfig: {
      defaultFeeRate: 30,
      defaultLiquidityTarget: ethers.parseEther("100000").toString(),
      defaultRebalanceThreshold: 1000,
      maxPairsPerBatch: 10,
      autoLiquidityEnabled: true,
      emergencyWithdrawDelay: 86400,
    },
  },
};

async function main() {
  console.log("🚀 Starting NGN Stablecoin + DEX System Deployment...\n");

  // Get network information
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  const config = NETWORK_CONFIGS[networkName];

  if (!config) {
    throw new Error(`Network configuration not found for: ${networkName}`);
  }

  console.log(`📡 Network: ${config.network} (Chain ID: ${config.chainId})`);
  console.log(`🔗 Network Name: ${networkName}\n`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  let totalGasUsed = 0n;
  const deploymentResult: DeploymentResult = {
    network: config.network,
    chainId: config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    gasUsed: "0",
    contracts: {
      ngnStablecoin: "",
      stockNGNDEX: "",
      tradingPairManager: "",
    },
    configuration: config,
    tradingPairs: [],
  };

  try {
    // 1. Deploy NGN Stablecoin
    console.log("📦 Deploying NGN Stablecoin...");
    const NGNStablecoin = await ethers.getContractFactory("NGNStablecoin");

    const ngnStablecoin = await NGNStablecoin.deploy(deployer.address, {
      name: config.ngnConfig.name,
      symbol: config.ngnConfig.symbol,
      decimals: 18,
      maxSupply: config.ngnConfig.maxSupply,
      mintingCap: config.ngnConfig.mintingCap,
      lastMintReset: 0,
      currentDayMinted: 0,
      mintingEnabled: config.ngnConfig.mintingEnabled,
      burningEnabled: config.ngnConfig.burningEnabled,
      transfersEnabled: config.ngnConfig.transfersEnabled,
    });

    await ngnStablecoin.waitForDeployment();
    const ngnAddress = await ngnStablecoin.getAddress();
    deploymentResult.contracts.ngnStablecoin = ngnAddress;

    const ngnReceipt = await ngnStablecoin.deploymentTransaction()?.wait();
    if (ngnReceipt) {
      totalGasUsed += ngnReceipt.gasUsed;
    }

    console.log(`✅ NGN Stablecoin deployed to: ${ngnAddress}`);
    console.log(`   Gas used: ${ngnReceipt?.gasUsed.toString()}\n`);

    // 2. Deploy StockNGNDEX
    console.log("📦 Deploying StockNGNDEX...");
    const StockNGNDEX = await ethers.getContractFactory("StockNGNDEX");

    const stockNGNDEX = await StockNGNDEX.deploy(ngnAddress, deployer.address, {
      defaultFeeRate: config.dexConfig.defaultFeeRate,
      maxPriceImpact: config.dexConfig.maxPriceImpact,
      minLiquidity: config.dexConfig.minLiquidity,
      swapDeadline: config.dexConfig.swapDeadline,
      emergencyMode: config.dexConfig.emergencyMode,
    });

    await stockNGNDEX.waitForDeployment();
    const dexAddress = await stockNGNDEX.getAddress();
    deploymentResult.contracts.stockNGNDEX = dexAddress;

    const dexReceipt = await stockNGNDEX.deploymentTransaction()?.wait();
    if (dexReceipt) {
      totalGasUsed += dexReceipt.gasUsed;
    }

    console.log(`✅ StockNGNDEX deployed to: ${dexAddress}`);
    console.log(`   Gas used: ${dexReceipt?.gasUsed.toString()}\n`);

    // 3. Authorize DEX contract in NGN stablecoin
    console.log("🔐 Authorizing DEX contract in NGN stablecoin...");
    const authTx = await ngnStablecoin.authorizeDEXContracts([dexAddress], [true]);
    const authReceipt = await authTx.wait();
    if (authReceipt) {
      totalGasUsed += authReceipt.gasUsed;
    }
    console.log(`✅ DEX contract authorized\n`);

    // 4. Deploy TradingPairManager (if stock factory exists)
    let stockFactoryAddress = "";

    // Try to find existing stock factory
    if (config.stockTokens && config.stockTokens.length > 0) {
      // For Sepolia, use the known factory address
      if (networkName === "sepolia") {
        stockFactoryAddress = "0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A";
      }
    }

    if (stockFactoryAddress) {
      console.log("📦 Deploying TradingPairManager...");
      const TradingPairManager = await ethers.getContractFactory("TradingPairManager");

      const tradingPairManager = await TradingPairManager.deploy(
        ngnAddress,
        dexAddress,
        stockFactoryAddress,
        deployer.address,
        {
          defaultFeeRate: config.managerConfig.defaultFeeRate,
          defaultLiquidityTarget: config.managerConfig.defaultLiquidityTarget,
          defaultRebalanceThreshold: config.managerConfig.defaultRebalanceThreshold,
          maxPairsPerBatch: config.managerConfig.maxPairsPerBatch,
          autoLiquidityEnabled: config.managerConfig.autoLiquidityEnabled,
          emergencyWithdrawDelay: config.managerConfig.emergencyWithdrawDelay,
        }
      );

      await tradingPairManager.waitForDeployment();
      const managerAddress = await tradingPairManager.getAddress();
      deploymentResult.contracts.tradingPairManager = managerAddress;
      deploymentResult.contracts.stockFactory = stockFactoryAddress;

      const managerReceipt = await tradingPairManager.deploymentTransaction()?.wait();
      if (managerReceipt) {
        totalGasUsed += managerReceipt.gasUsed;
      }

      console.log(`✅ TradingPairManager deployed to: ${managerAddress}`);
      console.log(`   Gas used: ${managerReceipt?.gasUsed.toString()}\n`);
    } else {
      console.log("⚠️  No stock factory found, skipping TradingPairManager deployment\n");
    }

    // 5. Mint initial NGN supply for testing
    console.log("💰 Minting initial NGN supply for testing...");
    const initialMintAmount = ethers.parseEther("1000000"); // 1M NGN for testing
    const mintTx = await ngnStablecoin.mint(deployer.address, initialMintAmount);
    const mintReceipt = await mintTx.wait();
    if (mintReceipt) {
      totalGasUsed += mintReceipt.gasUsed;
    }
    console.log(`✅ Minted ${ethers.formatEther(initialMintAmount)} NGN for testing\n`);

    // Update final gas usage
    deploymentResult.gasUsed = totalGasUsed.toString();

    // 6. Save deployment results
    console.log("💾 Saving deployment results...");
    const deploymentsDir = resolve(__dirname, "../deployments");
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `ngn-dex-system-${networkName}-${config.chainId}.json`;
    const filepath = resolve(deploymentsDir, filename);

    writeFileSync(filepath, JSON.stringify(deploymentResult, null, 2));
    console.log(`✅ Deployment results saved to: ${filepath}\n`);

    // 7. Display summary
    console.log("🎉 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`Network: ${config.network}`);
    console.log(`Chain ID: ${config.chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Total Gas Used: ${totalGasUsed.toString()}`);
    console.log(`Estimated Cost: ${ethers.formatEther(totalGasUsed * 20000000000n)} ETH`);
    console.log("\n📋 Deployed Contracts:");
    console.log(`NGN Stablecoin: ${deploymentResult.contracts.ngnStablecoin}`);
    console.log(`StockNGNDEX: ${deploymentResult.contracts.stockNGNDEX}`);
    if (deploymentResult.contracts.tradingPairManager) {
      console.log(`TradingPairManager: ${deploymentResult.contracts.tradingPairManager}`);
    }
    console.log("\n🔗 Next Steps:");
    console.log("1. Create trading pairs for existing stock tokens");
    console.log("2. Add initial liquidity to trading pairs");
    console.log("3. Test swapping functionality");
    console.log("4. Update frontend configuration");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as deployNGNDEXSystem, NETWORK_CONFIGS };

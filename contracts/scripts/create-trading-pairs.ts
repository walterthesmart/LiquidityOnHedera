import { ethers } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * Trading Pair Creation Script
 *
 * This script creates trading pairs between NGN stablecoin and existing stock tokens
 * Supports both individual and batch creation of trading pairs
 * Includes proper gas pricing and retry logic for Sepolia testnet
 */

interface GasSettings {
  gasPrice: bigint;
  gasLimit: number;
}

/**
 * Get optimal gas settings for transactions
 * Includes buffer to handle pending transactions and network congestion
 */
async function getOptimalGasSettings(operation: "approve" | "create"): Promise<GasSettings> {
  const feeData = await ethers.provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || ethers.parseUnits("2", "gwei");

  // Add 50% buffer to handle pending transactions and ensure faster confirmation
  const gasPrice = (baseGasPrice * 150n) / 100n;

  // Set appropriate gas limits for different operations
  const gasLimit = operation === "approve" ? 60000 : 200000;

  return { gasPrice, gasLimit };
}

/**
 * Execute transaction with retry logic for gas-related failures
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   🔄 ${operationName} (attempt ${attempt}/${maxRetries})...`);
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("replacement transaction underpriced") ||
        errorMessage.includes("nonce too low") ||
        errorMessage.includes("already known")
      ) {
        console.log(`   ⚠️  Gas/nonce issue on attempt ${attempt}, retrying with higher gas...`);

        if (attempt < maxRetries) {
          // Wait a bit before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
      } else {
        // Non-gas related error, don't retry
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Check for pending transactions and warn user
 */
async function checkPendingTransactions(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const networkNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

  if (pendingNonce > networkNonce) {
    console.log(`⚠️  Warning: You have ${pendingNonce - networkNonce} pending transaction(s)`);
    console.log(`   This may cause gas pricing issues. Consider waiting for them to confirm.`);
    console.log(`   The script will use higher gas prices to handle this.\n`);
  } else {
    console.log(`✅ No pending transactions detected.\n`);
  }
}

interface StockTokenInfo {
  address: string;
  symbol: string;
  name: string;
  companyName: string;
  initialNGNLiquidity: string;
  initialStockLiquidity: string;
  feeRate: number;
  targetLiquidity: string;
}

interface DeploymentData {
  contracts: {
    ngnStablecoin: string;
    stockNGNDEX: string;
    tradingPairManager?: string;
    stockFactory?: string;
  };
  network: string;
  chainId: number;
}

// Predefined stock tokens for different networks
const STOCK_TOKENS: Record<string, StockTokenInfo[]> = {
  sepolia: [
    {
      address: "0xc4cB0e9A47FFb17F927c94e590E4D3CCd03B40DB",
      symbol: "DANGCEM",
      name: "Dangote Cement Token",
      companyName: "Dangote Cement Plc",
      initialNGNLiquidity: ethers.parseEther("50000").toString(), // 50K NGN
      initialStockLiquidity: ethers.parseEther("1000").toString(), // 1K tokens
      feeRate: 30, // 0.3%
      targetLiquidity: ethers.parseEther("100000").toString(), // 100K NGN target
    },
    {
      address: "0x26FB154F273Ec41469a4423b9C6828d07CbFc085",
      symbol: "MTNN",
      name: "MTN Nigeria Token",
      companyName: "MTN Nigeria Communications Plc",
      initialNGNLiquidity: ethers.parseEther("40000").toString(),
      initialStockLiquidity: ethers.parseEther("800").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("80000").toString(),
    },
    {
      address: "0x402F234048d41cB8031aF7B59E9d2Fbfc4BEF678",
      symbol: "ZENITHBANK",
      name: "Zenith Bank Token",
      companyName: "Zenith Bank Plc",
      initialNGNLiquidity: ethers.parseEther("60000").toString(),
      initialStockLiquidity: ethers.parseEther("1200").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("120000").toString(),
    },
    {
      address: "0x2E323Fc3FdE45b33B3143Db18BBc8c6F5B765183",
      symbol: "GTCO",
      name: "GTCO Token",
      companyName: "Guaranty Trust Holding Company Plc",
      initialNGNLiquidity: ethers.parseEther("45000").toString(),
      initialStockLiquidity: ethers.parseEther("900").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("90000").toString(),
    },
    {
      address: "0xff7ab2b0FcC6f9E4689a5e5bbDd692bf48eE3FeE",
      symbol: "NB",
      name: "Nigerian Breweries Token",
      companyName: "Nigerian Breweries Plc",
      initialNGNLiquidity: ethers.parseEther("35000").toString(),
      initialStockLiquidity: ethers.parseEther("700").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("70000").toString(),
    },
    // Additional 33 deployed tokens
    {
      address: "0xe17F10218Ff46FA0B2D8F82483eC6D8958B24bC9",
      symbol: "ACCESS",
      name: "Access Holdings Token",
      companyName: "Access Holdings Plc",
      initialNGNLiquidity: ethers.parseEther("30000").toString(),
      initialStockLiquidity: ethers.parseEther("600").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("60000").toString(),
    },
    {
      address: "0x2d0940D2160248D851601703626d7933DC2b5298",
      symbol: "BUACEMENT",
      name: "BUA Cement Token",
      companyName: "BUA Cement Plc",
      initialNGNLiquidity: ethers.parseEther("40000").toString(),
      initialStockLiquidity: ethers.parseEther("800").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("80000").toString(),
    },
    {
      address: "0x3A366d23CeFaF01C710894dAFD86009E6bA8E86D",
      symbol: "AIRTELAFRI",
      name: "Airtel Africa Token",
      companyName: "Airtel Africa Plc",
      initialNGNLiquidity: ethers.parseEther("35000").toString(),
      initialStockLiquidity: ethers.parseEther("700").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("70000").toString(),
    },
    {
      address: "0xbE34d21903CEdB7268C1b0BcE9a027812F5EC834",
      symbol: "FBNH",
      name: "FBNH Token",
      companyName: "FBN Holdings Plc",
      initialNGNLiquidity: ethers.parseEther("25000").toString(),
      initialStockLiquidity: ethers.parseEther("500").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("50000").toString(),
    },
    {
      address: "0xf0926AD7B56b65C12Fe1D005d38BD67F6c7C6CBC",
      symbol: "UBA",
      name: "UBA Token",
      companyName: "United Bank for Africa Plc",
      initialNGNLiquidity: ethers.parseEther("30000").toString(),
      initialStockLiquidity: ethers.parseEther("600").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("60000").toString(),
    },
    {
      address: "0x78836734F5398375Ea463010c4D1a0c857634D1A",
      symbol: "NESTLE",
      name: "Nestle Nigeria Token",
      companyName: "Nestle Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("20000").toString(),
      initialStockLiquidity: ethers.parseEther("400").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("40000").toString(),
    },
    {
      address: "0xf0BD07108e4B5B926f219f38E04b0eE6E2E8Ad45",
      symbol: "SEPLAT",
      name: "Seplat Energy Token",
      companyName: "Seplat Energy Plc",
      initialNGNLiquidity: ethers.parseEther("25000").toString(),
      initialStockLiquidity: ethers.parseEther("500").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("50000").toString(),
    },
    {
      address: "0xEbcD1b3bB7d9bd171e35bf65a0C14F67E58A225D",
      symbol: "STANBIC",
      name: "Stanbic IBTC Token",
      companyName: "Stanbic IBTC Holdings Plc",
      initialNGNLiquidity: ethers.parseEther("20000").toString(),
      initialStockLiquidity: ethers.parseEther("400").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("40000").toString(),
    },
    {
      address: "0xF384aB95bcf03836e06dEf9e79609d94d9612aDc",
      symbol: "OANDO",
      name: "Oando Token",
      companyName: "Oando Plc",
      initialNGNLiquidity: ethers.parseEther("15000").toString(),
      initialStockLiquidity: ethers.parseEther("300").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("30000").toString(),
    },
    {
      address: "0xD27e008b63bE96FBA40DB046Ca17a944841B2Be2",
      symbol: "CONOIL",
      name: "Conoil Token",
      companyName: "Conoil Plc",
      initialNGNLiquidity: ethers.parseEther("10000").toString(),
      initialStockLiquidity: ethers.parseEther("200").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("20000").toString(),
    },
    {
      address: "0xD3A3999200d166b30decd53131D66EEC22D9FC4d",
      symbol: "WAPCO",
      name: "WAPCO Token",
      companyName: "Lafarge Africa Plc",
      initialNGNLiquidity: ethers.parseEther("15000").toString(),
      initialStockLiquidity: ethers.parseEther("300").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("30000").toString(),
    },
    {
      address: "0xd7A55E1098163e13a5f3B50ED339134bD4658De6",
      symbol: "FLOURMILL",
      name: "Flour Mills Token",
      companyName: "Flour Mills of Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("12000").toString(),
      initialStockLiquidity: ethers.parseEther("240").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("24000").toString(),
    },
    {
      address: "0xC7D24f4D51fc9943663191fBa27958fFc5a7a5Aa",
      symbol: "PRESCO",
      name: "Presco Token",
      companyName: "Presco Plc",
      initialNGNLiquidity: ethers.parseEther("8000").toString(),
      initialStockLiquidity: ethers.parseEther("160").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("16000").toString(),
    },
    {
      address: "0x096352CCb386114873A9847e7Ae083603FE4c84B",
      symbol: "CADBURY",
      name: "Cadbury Token",
      companyName: "Cadbury Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("10000").toString(),
      initialStockLiquidity: ethers.parseEther("200").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("20000").toString(),
    },
    {
      address: "0x4D20a560da2c7cD407b67FE1f62D2BE142e1DF45",
      symbol: "GUINNESS",
      name: "Guinness Token",
      companyName: "Guinness Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("12000").toString(),
      initialStockLiquidity: ethers.parseEther("240").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("24000").toString(),
    },
    // Continue with remaining tokens
    {
      address: "0xd2E3F7fc768E0C32fc7EDdDC5052Fc4E594Ec40F",
      symbol: "INTBREW",
      name: "International Breweries Token",
      companyName: "International Breweries Plc",
      initialNGNLiquidity: ethers.parseEther("8000").toString(),
      initialStockLiquidity: ethers.parseEther("160").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("16000").toString(),
    },
    {
      address: "0x8bC8924B95A5459e995C62B6752B6aFd2860a12f",
      symbol: "CHAMPION",
      name: "Champion Breweries Token",
      companyName: "Champion Breweries Plc",
      initialNGNLiquidity: ethers.parseEther("6000").toString(),
      initialStockLiquidity: ethers.parseEther("120").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("12000").toString(),
    },
    {
      address: "0xa0a2e8D34049c795d2Ccd78cC5bc354a3199e13F",
      symbol: "UNILEVER",
      name: "Unilever Token",
      companyName: "Unilever Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("15000").toString(),
      initialStockLiquidity: ethers.parseEther("300").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("30000").toString(),
    },
    {
      address: "0x4af5B35688511E6AFD4738a641Ad87517ef60404",
      symbol: "TRANSCORP",
      name: "Transcorp Token",
      companyName: "Transnational Corporation Plc",
      initialNGNLiquidity: ethers.parseEther("10000").toString(),
      initialStockLiquidity: ethers.parseEther("200").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("20000").toString(),
    },
    {
      address: "0x3E0edd3A58a13C1421f8C7f646127f801caeE3ED",
      symbol: "BUAFOODS",
      name: "BUA Foods Token",
      companyName: "BUA Foods Plc",
      initialNGNLiquidity: ethers.parseEther("12000").toString(),
      initialStockLiquidity: ethers.parseEther("240").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("24000").toString(),
    },
    {
      address: "0x1A959C4357173dFE5E4ACd373cd4A8e358AeDC09",
      symbol: "DANGSUGAR",
      name: "Dangote Sugar Token",
      companyName: "Dangote Sugar Refinery Plc",
      initialNGNLiquidity: ethers.parseEther("15000").toString(),
      initialStockLiquidity: ethers.parseEther("300").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("30000").toString(),
    },
    {
      address: "0xc16A32564BFf3A778087eDd9E1185D9C29d96dC7",
      symbol: "UACN",
      name: "UACN Token",
      companyName: "UAC of Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("8000").toString(),
      initialStockLiquidity: ethers.parseEther("160").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("16000").toString(),
    },
    {
      address: "0x3d9F99f3c479DC6f3d9a1390AadC33aD6b83A707",
      symbol: "PZ",
      name: "PZ Cussons Token",
      companyName: "PZ Cussons Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("10000").toString(),
      initialStockLiquidity: ethers.parseEther("200").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("20000").toString(),
    },
    {
      address: "0xBb11F71ae636307898F922dbC8793BB4443A6276",
      symbol: "TOTAL",
      name: "TotalEnergies Token",
      companyName: "TotalEnergies Marketing Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("12000").toString(),
      initialStockLiquidity: ethers.parseEther("240").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("24000").toString(),
    },
    {
      address: "0x80E70d7784F4452d3D15E8dFc84E7d9310275a09",
      symbol: "ETERNA",
      name: "Eterna Token",
      companyName: "Eterna Plc",
      initialNGNLiquidity: ethers.parseEther("6000").toString(),
      initialStockLiquidity: ethers.parseEther("120").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("12000").toString(),
    },
    {
      address: "0x99d76D737847c7079A8B3acFc9420a57bCc72fe7",
      symbol: "GEREGU",
      name: "Geregu Power Token",
      companyName: "Geregu Power Plc",
      initialNGNLiquidity: ethers.parseEther("8000").toString(),
      initialStockLiquidity: ethers.parseEther("160").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("16000").toString(),
    },
    {
      address: "0x6b209251003793275e302E7d4512866a86dF26b4",
      symbol: "TRANSPOWER",
      name: "Transcorp Power Token",
      companyName: "Transcorp Power Plc",
      initialNGNLiquidity: ethers.parseEther("6000").toString(),
      initialStockLiquidity: ethers.parseEther("120").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("12000").toString(),
    },
    {
      address: "0x0887DcA31922b24Cb447CF106b9dEc0F53A92E55",
      symbol: "FIDSON",
      name: "Fidson Healthcare Token",
      companyName: "Fidson Healthcare Plc",
      initialNGNLiquidity: ethers.parseEther("5000").toString(),
      initialStockLiquidity: ethers.parseEther("100").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("10000").toString(),
    },
    {
      address: "0xB7D1d82e2564fc8E92a8F4000e281bC7022A5579",
      symbol: "MAYBAKER",
      name: "May & Baker Token",
      companyName: "May & Baker Nigeria Plc",
      initialNGNLiquidity: ethers.parseEther("4000").toString(),
      initialStockLiquidity: ethers.parseEther("80").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("8000").toString(),
    },
    {
      address: "0xddAF08c8DBC520e54983746c615c5F9a1E1C8940",
      symbol: "OKOMUOIL",
      name: "Okomu Oil Token",
      companyName: "Okomu Oil Palm Plc",
      initialNGNLiquidity: ethers.parseEther("6000").toString(),
      initialStockLiquidity: ethers.parseEther("120").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("12000").toString(),
    },
    {
      address: "0x615E8B54820a8797C2B7dBa6202dC5aB78fc4A65",
      symbol: "LIVESTOCK",
      name: "Livestock Feeds Token",
      companyName: "Livestock Feeds Plc",
      initialNGNLiquidity: ethers.parseEther("5000").toString(),
      initialStockLiquidity: ethers.parseEther("100").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("10000").toString(),
    },
    {
      address: "0x9bF27FB85dB4751d9bF2C33Be689948405A489Af",
      symbol: "CWG",
      name: "CWG Token",
      companyName: "CWG Plc",
      initialNGNLiquidity: ethers.parseEther("4000").toString(),
      initialStockLiquidity: ethers.parseEther("80").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("8000").toString(),
    },
    {
      address: "0x05DB17284C867BAA98aCa5D4177731235c764E9A",
      symbol: "TRANSCOHOT",
      name: "Transcorp Hotels Token",
      companyName: "Transcorp Hotels Plc",
      initialNGNLiquidity: ethers.parseEther("8000").toString(),
      initialStockLiquidity: ethers.parseEther("160").toString(),
      feeRate: 30,
      targetLiquidity: ethers.parseEther("16000").toString(),
    },
  ],
  bitfinity_testnet: [
    // Will be populated when stock tokens are deployed to Bitfinity
  ],
  hardhat: [
    // For local testing - will deploy mock tokens
  ],
};

async function loadDeploymentData(networkName: string): Promise<DeploymentData> {
  const deploymentsDir = resolve(__dirname, "../deployments");

  // Find the deployment file
  const files = require("fs").readdirSync(deploymentsDir);
  const deploymentFile = files.find(
    (file: string) => file.startsWith(`ngn-dex-system-${networkName}-`) && file.endsWith(".json")
  );

  if (!deploymentFile) {
    throw new Error(`Deployment file not found for network: ${networkName}`);
  }

  const filepath = resolve(deploymentsDir, deploymentFile);
  const data = JSON.parse(readFileSync(filepath, "utf8"));

  return {
    contracts: data.contracts,
    network: data.network,
    chainId: data.chainId,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createTradingPair(dexContract: any, ngnContract: any, stockInfo: StockTokenInfo) {
  console.log(`📦 Creating trading pair for ${stockInfo.symbol}...`);

  try {
    // Check if stock token exists and get its info
    const stockContract = await ethers.getContractAt("NigerianStockToken", stockInfo.address);
    const stockMetadata = await stockContract.getStockInfo();

    console.log(`   Company: ${stockMetadata.companyName}`);
    console.log(`   Symbol: ${stockMetadata.symbol}`);

    // Check if pair already exists
    try {
      const existingPair = await dexContract.getTradingPair(stockInfo.address);
      if (existingPair.isActive) {
        console.log(`   ⚠️  Trading pair already exists for ${stockInfo.symbol}`);
        return false;
      }
    } catch {
      // Pair doesn't exist, continue with creation
    }

    // Approve tokens for DEX with proper gas settings
    const approveGasSettings = await getOptimalGasSettings("approve");
    console.log(
      `   ⛽ Using gas price: ${ethers.formatUnits(approveGasSettings.gasPrice, "gwei")} gwei`
    );

    await executeWithRetry(async () => {
      console.log(`   💰 Approving ${ethers.formatEther(stockInfo.initialNGNLiquidity)} NGN...`);
      const ngnApproveTx = await ngnContract.approve(
        await dexContract.getAddress(),
        stockInfo.initialNGNLiquidity,
        {
          gasPrice: approveGasSettings.gasPrice,
          gasLimit: approveGasSettings.gasLimit,
        }
      );
      return await ngnApproveTx.wait();
    }, `NGN approval for ${stockInfo.symbol}`);

    await executeWithRetry(async () => {
      console.log(
        `   💰 Approving ${ethers.formatEther(stockInfo.initialStockLiquidity)} ${stockInfo.symbol}...`
      );
      const stockApproveTx = await stockContract.approve(
        await dexContract.getAddress(),
        stockInfo.initialStockLiquidity,
        {
          gasPrice: approveGasSettings.gasPrice,
          gasLimit: approveGasSettings.gasLimit,
        }
      );
      return await stockApproveTx.wait();
    }, `${stockInfo.symbol} approval`);

    // Create trading pair with proper gas settings
    const createGasSettings = await getOptimalGasSettings("create");

    const receipt = await executeWithRetry(async () => {
      console.log(`   🔄 Creating trading pair...`);
      const createTx = await dexContract.createTradingPair(
        stockInfo.address,
        stockInfo.initialNGNLiquidity,
        stockInfo.initialStockLiquidity,
        stockInfo.feeRate,
        {
          gasPrice: createGasSettings.gasPrice,
          gasLimit: createGasSettings.gasLimit,
        }
      );
      return await createTx.wait();
    }, `Trading pair creation for ${stockInfo.symbol}`);

    console.log(`   ✅ Trading pair created! Gas used: ${receipt.gasUsed.toString()}`);

    // Get the current price
    const currentPrice = await dexContract.getCurrentPrice(stockInfo.address);
    console.log(
      `   💱 Initial price: ${ethers.formatEther(currentPrice)} NGN per ${stockInfo.symbol}`
    );

    return true;
  } catch (error) {
    console.error(`   ❌ Failed to create trading pair for ${stockInfo.symbol}:`, error);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting Trading Pair Creation...\n");

  // Check for pending transactions
  await checkPendingTransactions();

  // Get network information
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  console.log(`📡 Network: ${networkName}\n`);

  // Load deployment data
  const deploymentData = await loadDeploymentData(networkName);
  console.log(`📋 Loaded deployment data for ${deploymentData.network}`);
  console.log(`🔗 NGN Stablecoin: ${deploymentData.contracts.ngnStablecoin}`);
  console.log(`🔗 StockNGNDEX: ${deploymentData.contracts.stockNGNDEX}\n`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Get contract instances
  const ngnContract = await ethers.getContractAt(
    "NGNStablecoin",
    deploymentData.contracts.ngnStablecoin
  );

  const dexContract = await ethers.getContractAt(
    "StockNGNDEX",
    deploymentData.contracts.stockNGNDEX
  );

  // Check NGN balance
  const ngnBalance = await ngnContract.balanceOf(deployer.address);
  console.log(`💰 NGN Balance: ${ethers.formatEther(ngnBalance)} NGN\n`);

  if (ngnBalance === 0n) {
    console.log("⚠️  No NGN balance found. Minting initial supply...");
    const mintAmount = ethers.parseEther("1000000"); // 1M NGN
    const mintTx = await ngnContract.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log(`✅ Minted ${ethers.formatEther(mintAmount)} NGN\n`);
  }

  // Get stock tokens for this network
  const stockTokens = STOCK_TOKENS[networkName] || [];

  if (stockTokens.length === 0) {
    console.log(`⚠️  No stock tokens configured for network: ${networkName}`);
    console.log("Please add stock token configurations to the STOCK_TOKENS object.");
    return;
  }

  console.log(`📊 Found ${stockTokens.length} stock tokens to process\n`);

  let successfulPairs = 0;
  const createdPairs: Array<{
    stockToken: string;
    symbol: string;
    companyName: string;
    initialNGNLiquidity: string;
    initialStockLiquidity: string;
    feeRate: number;
  }> = [];

  // Create trading pairs
  for (const stockInfo of stockTokens) {
    const success = await createTradingPair(dexContract, ngnContract, stockInfo);

    if (success) {
      successfulPairs++;
      createdPairs.push({
        stockToken: stockInfo.address,
        symbol: stockInfo.symbol,
        companyName: stockInfo.companyName,
        initialNGNLiquidity: stockInfo.initialNGNLiquidity,
        initialStockLiquidity: stockInfo.initialStockLiquidity,
        feeRate: stockInfo.feeRate,
      });
    }

    console.log(""); // Add spacing between pairs
  }

  // Save results
  const resultsDir = resolve(__dirname, "../deployments");
  const resultsFile = resolve(resultsDir, `trading-pairs-${networkName}-${Date.now()}.json`);

  const results = {
    network: deploymentData.network,
    chainId: deploymentData.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    totalPairsProcessed: stockTokens.length,
    successfulPairs,
    failedPairs: stockTokens.length - successfulPairs,
    contracts: deploymentData.contracts,
    createdPairs,
  };

  writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  // Display summary
  console.log("🎉 Trading Pair Creation Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${deploymentData.network}`);
  console.log(`Total Pairs Processed: ${stockTokens.length}`);
  console.log(`Successful Pairs: ${successfulPairs}`);
  console.log(`Failed Pairs: ${stockTokens.length - successfulPairs}`);
  console.log(`Results saved to: ${resultsFile}\n`);

  if (successfulPairs > 0) {
    console.log("✅ Created Trading Pairs:");
    createdPairs.forEach((pair) => {
      console.log(`   ${pair.symbol} (${pair.companyName})`);
      console.log(`   Address: ${pair.stockToken}`);
      console.log(
        `   Initial Liquidity: ${ethers.formatEther(pair.initialNGNLiquidity)} NGN / ${ethers.formatEther(pair.initialStockLiquidity)} ${pair.symbol}`
      );
      console.log(`   Fee Rate: ${pair.feeRate / 100}%\n`);
    });
  }

  console.log("🔗 Next Steps:");
  console.log("1. Test swapping functionality");
  console.log("2. Monitor liquidity and rebalance if needed");
  console.log("3. Update frontend with new trading pairs");
  console.log("4. Set up automated liquidity management");
}

// Execute script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as createTradingPairs, STOCK_TOKENS };

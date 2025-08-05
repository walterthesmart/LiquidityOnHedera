/**
 * Verification Script for Sepolia Deployed Contracts
 *
 * This script verifies all deployed contracts on Sepolia Etherscan
 * including the factory and all Nigerian stock tokens
 */

import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";

// Load deployment data
interface DeployedToken {
  symbol: string;
  name: string;
  address: string;
  companyName: string;
  maxSupply: string;
  initialSupply?: string;
  sector?: string;
}

interface DeploymentData {
  factoryAddress: string;
  deployer: string;
  tokens: DeployedToken[];
  chainId: string;
  deployedAt: string;
}

async function loadDeploymentData(): Promise<DeploymentData> {
  const deploymentPath = path.resolve(
    __dirname,
    "..",
    "deployments",
    "nigerian-stocks-sepolia-11155111.json"
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as DeploymentData;
  return deploymentData;
}

async function verifyFactory(factoryAddress: string, deployer: string) {
  console.log("\n🏭 Verifying Factory Contract...");
  console.log(`   📍 Address: ${factoryAddress}`);
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${factoryAddress}`);

  try {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [deployer],
      contract: "contracts/NigerianStockTokenFactory.sol:NigerianStockTokenFactory",
    });
    console.log("   ✅ Factory verification successful!");
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Already Verified")) {
      console.log("   ✅ Factory already verified!");
      return true;
    }
    console.error("   ❌ Factory verification failed:", errorMessage);
    return false;
  }
}

async function verifyToken(token: DeployedToken, adminAddress: string) {
  console.log(`\n🪙 Verifying ${token.symbol} Token...`);
  console.log(`   📍 Address: ${token.address}`);
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${token.address}`);

  try {
    // Constructor arguments for NigerianStockToken (5 parameters)
    // Based on the actual deployed contract state
    let stockMetadata;
    let initialSupply = token.maxSupply;

    // Use specific values for known tokens based on deployment data
    if (token.symbol === "DANGCEM") {
      stockMetadata = {
        symbol: "DANGCEM",
        companyName: "Dangote Cement Plc",
        sector: "Industrial Goods",
        totalShares: "17040000000000000000000000000",
        marketCap: "7710000000000",
        isActive: true,
        lastUpdated: 1753278792,
      };
      initialSupply = "17040000000000000000000000000";
    } else {
      // Default metadata for other tokens
      stockMetadata = {
        symbol: token.symbol,
        companyName: token.companyName,
        sector: token.sector || "Unknown",
        totalShares: token.maxSupply,
        marketCap: 0,
        isActive: true,
        lastUpdated: Math.floor(Date.now() / 1000),
      };
    }

    const constructorArgs = [
      token.name, // _name
      token.symbol, // _symbol
      initialSupply, // _initialSupply
      stockMetadata, // _stockMetadata
      adminAddress, // _admin
    ];

    await hre.run("verify:verify", {
      address: token.address,
      constructorArguments: constructorArgs,
      contract: "contracts/NigerianStockToken.sol:NigerianStockToken",
    });

    console.log(`   ✅ ${token.symbol} verification successful!`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Already Verified")) {
      console.log(`   ✅ ${token.symbol} already verified!`);
      return true;
    }
    console.error(`   ❌ ${token.symbol} verification failed:`, errorMessage);
    return false;
  }
}

async function verifyDEXContracts() {
  console.log("\n🔄 Verifying DEX System Contracts...");

  // Load DEX deployment data if it exists
  const dexDeploymentPath = path.resolve(
    __dirname,
    "..",
    "deployments",
    "ngn-dex-sepolia-11155111.json"
  );

  if (!fs.existsSync(dexDeploymentPath)) {
    console.log("   ⚠️  DEX deployment file not found - skipping DEX verification");
    return;
  }

  try {
    const dexData = JSON.parse(fs.readFileSync(dexDeploymentPath, "utf8")) as Record<
      string,
      unknown
    >;

    // Verify NGN Stablecoin
    if (dexData.ngnStablecoin) {
      console.log("\n💰 Verifying NGN Stablecoin...");
      console.log(`   📍 Address: ${dexData.ngnStablecoin}`);

      try {
        await hre.run("verify:verify", {
          address: dexData.ngnStablecoin,
          constructorArguments: [dexData.deployer],
          contract: "contracts/NGNStablecoin.sol:NGNStablecoin",
        });
        console.log("   ✅ NGN Stablecoin verification successful!");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Already Verified")) {
          console.log("   ✅ NGN Stablecoin already verified!");
        } else {
          console.error("   ❌ NGN Stablecoin verification failed:", errorMessage);
        }
      }
    }

    // Verify StockNGNDEX
    if (dexData.stockNGNDEX) {
      console.log("\n🔄 Verifying StockNGNDEX...");
      console.log(`   📍 Address: ${dexData.stockNGNDEX}`);

      try {
        const dexConstructorArgs = [
          dexData.ngnStablecoin,
          dexData.deployer,
          {
            defaultFeeRate: 30,
            maxPriceImpact: 500,
            minLiquidity: hre.ethers.parseEther("1000").toString(),
            swapDeadline: 1800,
            emergencyMode: false,
          },
        ];

        await hre.run("verify:verify", {
          address: dexData.stockNGNDEX,
          constructorArguments: dexConstructorArgs,
          contract: "contracts/StockNGNDEX.sol:StockNGNDEX",
        });
        console.log("   ✅ StockNGNDEX verification successful!");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Already Verified")) {
          console.log("   ✅ StockNGNDEX already verified!");
        } else {
          console.error("   ❌ StockNGNDEX verification failed:", errorMessage);
        }
      }
    }
  } catch (error) {
    console.error("   ❌ Error verifying DEX contracts:", error);
  }
}

interface VerificationResults {
  factory: boolean;
  tokens: Array<{
    symbol: string;
    address: string;
    success: boolean;
  }>;
}

async function generateVerificationReport(
  deploymentData: DeploymentData,
  results: VerificationResults
) {
  const reportPath = path.resolve(
    __dirname,
    "..",
    "verification-reports",
    `sepolia-verification-${Date.now()}.json`
  );
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const successfulTokens = results.tokens.filter((r) => r.success);
  const successRate = Math.round((successfulTokens.length / results.tokens.length) * 100);

  const report = {
    network: "Ethereum Sepolia Testnet",
    chainId: 11155111,
    verificationDate: new Date().toISOString(),
    factoryAddress: deploymentData.factoryAddress,
    deployer: deploymentData.deployer,
    totalTokens: deploymentData.tokens.length,
    verificationResults: results,
    etherscanLinks: {
      factory: `https://sepolia.etherscan.io/address/${deploymentData.factoryAddress}`,
      tokens: deploymentData.tokens.map((token) => ({
        symbol: token.symbol,
        address: token.address,
        etherscan: `https://sepolia.etherscan.io/address/${token.address}`,
      })),
    },
    summary: {
      factoryVerified: results.factory,
      tokensVerified: successfulTokens.length,
      totalTokens: results.tokens.length,
      successRate: `${successRate}%`,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Verification report saved: ${reportPath}`);

  return report;
}

async function main() {
  console.log("🔍 Starting Sepolia Contract Verification...");
  console.log("================================================================================");

  try {
    // Load deployment data
    const deploymentData = await loadDeploymentData();
    console.log(`📂 Loaded deployment data for ${deploymentData.tokens.length} tokens`);

    const results: VerificationResults = {
      factory: false,
      tokens: [],
    };

    // Verify factory contract
    results.factory = await verifyFactory(deploymentData.factoryAddress, deploymentData.deployer);

    // Verify all token contracts
    console.log(`\n🪙 Verifying ${deploymentData.tokens.length} token contracts...`);

    for (const token of deploymentData.tokens) {
      const success = await verifyToken(token, deploymentData.deployer);
      results.tokens.push({
        symbol: token.symbol,
        address: token.address,
        success,
      });

      // Add delay between verifications to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Verify DEX contracts if they exist
    await verifyDEXContracts();

    // Generate verification report
    const report = await generateVerificationReport(deploymentData, results);

    console.log(
      "\n================================================================================"
    );
    console.log("🎉 Verification Process Complete!");
    console.log(`📊 Factory: ${results.factory ? "✅ Verified" : "❌ Failed"}`);
    console.log(
      `📊 Tokens: ${results.tokens.filter((r) => r.success).length}/${
        results.tokens.length
      } verified`
    );
    console.log(`📊 Success Rate: ${report.summary.successRate}`);
    console.log("\n🔗 View contracts on Etherscan:");
    console.log(
      `   Factory: https://sepolia.etherscan.io/address/${deploymentData.factoryAddress}`
    );
    console.log("   All tokens: Check the verification report for individual links");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exitCode = 1;
  }
}

// Execute the verification
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { main as verifySepolia };

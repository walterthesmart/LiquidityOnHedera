import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import fs from "fs";

// Load environment variables
dotenvConfig({ path: resolve(__dirname, "..", ".env") });

interface DeploymentResult {
  factoryAddress: string;
  deployedTokens: {
    symbol: string;
    name: string;
    address: string;
    totalSupply: string;
  }[];
  network: string;
  deployer: string;
  gasUsed: string;
  timestamp: number;
}

async function main() {
  console.log("🔍 Starting contract verification on Bitfinity EVM...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📋 Verification Details:");
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}`);

  try {
    // Load deployment results
    const deploymentFile = resolve(__dirname, "..", "deployments", `${network.name}-latest.json`);

    if (!fs.existsSync(deploymentFile)) {
      console.error("❌ No deployment file found. Please deploy contracts first.");
      process.exit(1);
    }

    const deploymentData: DeploymentResult = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

    console.log("\n🏭 Verifying Factory Contract...");
    console.log(`   Factory Address: ${deploymentData.factoryAddress}`);

    // Get factory contract
    const factory = await ethers.getContractAt(
      "NigerianStockTokenFactory",
      deploymentData.factoryAddress
    );

    // Verify factory functionality
    const factoryStats = await factory.getFactoryStats();
    console.log(`   ✅ Total deployed tokens: ${factoryStats._totalDeployedTokens}`);
    console.log(`   ✅ Total market cap: ${factoryStats._totalMarketCap} NGN`);
    console.log(`   ✅ Total symbols: ${factoryStats._totalSymbols}`);

    // Verify deployed tokens
    console.log("\n🪙 Verifying Deployed Tokens...");
    let verifiedTokens = 0;
    let failedTokens = 0;

    for (const tokenData of deploymentData.deployedTokens) {
      try {
        console.log(
          `\n   [${verifiedTokens + failedTokens + 1}/${deploymentData.deployedTokens.length}] Verifying ${tokenData.symbol}...`
        );

        // Get token contract
        const token = await ethers.getContractAt("NigerianStockToken", tokenData.address);

        // Verify basic token properties
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          token.name(),
          token.symbol(),
          token.decimals(),
          token.totalSupply(),
        ]);

        console.log(`      Name: ${name}`);
        console.log(`      Symbol: ${symbol}`);
        console.log(`      Decimals: ${decimals}`);
        console.log(`      Total Supply: ${ethers.formatEther(totalSupply)}`);

        // Verify stock metadata
        const stockInfo = await token.getStockInfo();
        console.log(`      Company: ${stockInfo.companyName}`);
        console.log(`      Sector: ${stockInfo.sector}`);
        console.log(`      Market Cap: ${stockInfo.marketCap} NGN`);
        console.log(`      Active: ${stockInfo.isActive}`);

        // Verify admin roles
        const ADMIN_ROLE = await token.ADMIN_ROLE();
        const hasAdminRole = await token.hasRole(ADMIN_ROLE, deployer.address);
        console.log(`      Admin Role: ${hasAdminRole ? "✅" : "❌"}`);

        // Verify token is not paused
        const isPaused = await token.paused();
        console.log(`      Paused: ${isPaused ? "❌" : "✅"}`);

        // Verify factory registration
        const factoryTokenAddress = await factory.getTokenAddress(symbol);
        const isValidToken = await factory.isValidToken(tokenData.address);

        if (factoryTokenAddress.toLowerCase() === tokenData.address.toLowerCase() && isValidToken) {
          console.log(`      Factory Registration: ✅`);
          verifiedTokens++;
        } else {
          console.log(`      Factory Registration: ❌`);
          failedTokens++;
        }
      } catch (error) {
        console.error(`      ❌ Failed to verify ${tokenData.symbol}:`, error);
        failedTokens++;
      }
    }

    // Verify factory token list
    console.log("\n📜 Verifying Factory Token Registry...");
    const deployedSymbols = await factory.getAllDeployedSymbols();
    console.log(`   Registered symbols: ${deployedSymbols.length}`);
    console.log(`   Expected symbols: ${deploymentData.deployedTokens.length}`);

    if (deployedSymbols.length === deploymentData.deployedTokens.length) {
      console.log("   ✅ Symbol count matches");
    } else {
      console.log("   ❌ Symbol count mismatch");
    }

    // Test factory pagination
    console.log("\n🔄 Testing Factory Pagination...");
    const [paginatedSymbols] = await factory.getDeployedTokensPaginated(0, 5);
    console.log(`   First 5 symbols: ${paginatedSymbols.join(", ")}`);
    console.log(`   ✅ Pagination working`);

    // Summary
    console.log("\n📊 Verification Summary:");
    console.log(`   ✅ Verified tokens: ${verifiedTokens}`);
    console.log(`   ❌ Failed tokens: ${failedTokens}`);
    console.log(
      `   📈 Success rate: ${((verifiedTokens / (verifiedTokens + failedTokens)) * 100).toFixed(1)}%`
    );

    if (failedTokens === 0) {
      console.log("\n🎉 All contracts verified successfully!");
    } else {
      console.log(
        `\n⚠️  ${failedTokens} contracts failed verification. Please check the logs above.`
      );
    }

    // Test a sample transaction (if not on mainnet)
    if (network.name.includes("testnet") || network.chainId === BigInt(31337)) {
      console.log("\n🧪 Testing Sample Transaction...");

      if (deploymentData.deployedTokens.length > 0) {
        const firstToken = deploymentData.deployedTokens[0];
        const token = await ethers.getContractAt("NigerianStockToken", firstToken.address);

        try {
          // Test minting (admin should be able to mint)
          const mintAmount = ethers.parseEther("100");
          const tx = await token.mint(deployer.address, mintAmount);
          await tx.wait();

          const balance = await token.balanceOf(deployer.address);
          console.log(`   ✅ Minted ${ethers.formatEther(mintAmount)} ${firstToken.symbol}`);
          console.log(`   ✅ Current balance: ${ethers.formatEther(balance)} ${firstToken.symbol}`);
        } catch (error) {
          console.error("   ❌ Failed to test minting:", error);
        }
      }
    }

    console.log("\n✅ Contract verification completed!");
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

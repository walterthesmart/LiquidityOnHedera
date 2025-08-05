import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as readline from "readline";

/**
 * NGN Token Minting Script
 *
 * This script allows minting NGN tokens to any address
 * Supports interactive input for amount and recipient
 */

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function formatNumber(num: string): string {
  return parseFloat(num).toLocaleString();
}

async function main(): Promise<void> {
  console.log("🪙 NGN Token Minting Script");
  console.log("============================\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;

  console.log(`📡 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Load deployment data
  const deploymentFile = resolve(
    __dirname,
    `../deployments/ngn-dex-system-${networkName}-${network.chainId}.json`
  );

  let deploymentData: DeploymentData;
  try {
    deploymentData = JSON.parse(readFileSync(deploymentFile, "utf8")) as DeploymentData;
  } catch (error) {
    console.error(`❌ Could not load deployment file: ${deploymentFile}`);
    console.error("Please ensure the NGN DEX system is deployed first.");
    process.exit(1);
  }

  // Get NGN contract
  const ngnContract = await ethers.getContractAt(
    "NGNStablecoin",
    deploymentData.contracts.ngnStablecoin
  );

  console.log(`💰 NGN Contract: ${deploymentData.contracts.ngnStablecoin}`);

  // Check current balance and total supply
  const deployerBalance = await ngnContract.balanceOf(deployer.address);
  const totalSupply = await ngnContract.totalSupply();
  const config = await ngnContract.getConfig();
  const maxSupply = config.maxSupply;

  console.log(`📊 Current Status:`);
  console.log(`   Your Balance: ${formatNumber(ethers.formatEther(deployerBalance))} NGN`);
  console.log(`   Total Supply: ${formatNumber(ethers.formatEther(totalSupply))} NGN`);
  console.log(`   Max Supply: ${formatNumber(ethers.formatEther(maxSupply))} NGN\n`);

  try {
    // Get mint amount
    const amountInput = await askQuestion("💰 Enter amount to mint (in NGN): ");
    const amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
      console.error("❌ Invalid amount. Please enter a positive number.");
      process.exit(1);
    }

    // Get recipient address (default to deployer)
    const recipientInput = await askQuestion(
      `📍 Enter recipient address (press Enter for ${deployer.address}): `
    );
    const recipient = recipientInput || deployer.address;

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      console.error("❌ Invalid recipient address.");
      process.exit(1);
    }

    const amountWei = ethers.parseEther(amount.toString());

    // Check if minting would exceed max supply
    const newTotalSupply = totalSupply + amountWei;
    if (newTotalSupply > maxSupply) {
      console.error(`❌ Minting ${formatNumber(amount.toString())} NGN would exceed max supply.`);
      console.error(
        `   Available to mint: ${formatNumber(ethers.formatEther(maxSupply - totalSupply))} NGN`
      );
      process.exit(1);
    }

    // Confirm the transaction
    console.log(`\n📋 Transaction Summary:`);
    console.log(`   Amount: ${formatNumber(amount.toString())} NGN`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   New Total Supply: ${formatNumber(ethers.formatEther(newTotalSupply))} NGN`);

    const confirm = await askQuestion("\n✅ Confirm minting? (y/N): ");
    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      console.log("❌ Minting cancelled.");
      process.exit(0);
    }

    // Execute minting with proper gas settings
    console.log("\n🔄 Minting tokens...");

    // Get current gas price and add significant buffer to replace any pending transactions
    const feeData = await ethers.provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || ethers.parseUnits("2", "gwei");
    const gasPrice = (baseGasPrice * 150n) / 100n; // 50% buffer to replace pending transactions

    console.log(`⛽ Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

    const tx = await ngnContract.mint(recipient, amountWei, {
      gasPrice,
      gasLimit: 100000, // Set reasonable gas limit
    });
    console.log(`📤 Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Minting successful! Gas used: ${receipt?.gasUsed.toString()}`);

    // Show updated balances
    const newRecipientBalance = await ngnContract.balanceOf(recipient);
    const newTotalSupplyActual = await ngnContract.totalSupply();

    console.log(`\n📊 Updated Status:`);
    console.log(
      `   Recipient Balance: ${formatNumber(ethers.formatEther(newRecipientBalance))} NGN`
    );
    console.log(
      `   New Total Supply: ${formatNumber(ethers.formatEther(newTotalSupplyActual))} NGN`
    );
  } catch (error: unknown) {
    console.error("❌ Error during minting:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
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

export { main as mintNGN };

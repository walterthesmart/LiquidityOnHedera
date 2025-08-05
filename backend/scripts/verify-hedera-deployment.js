#!/usr/bin/env node

/**
 * Verify Hedera Deployment
 * 
 * Simple script to verify what was actually deployed on Hedera testnet
 */

const { ethers } = require("ethers");

const HEDERA_RPC = "https://testnet.hashio.io/api";

// Contract addresses from our deployment
const ADDRESSES = {
  factory: "0xf867ace8Ed1F51f50EDc2A7DAe477Ac19cdaCF68",
  ngnStablecoin: "0x4bB9F94c2aBd8fd1BA789f8d7f7174e194330628",
  stockNGNDEX: "0x0A34513Cec5f80408B3d5d65F7E129A80adDdb59",
  tradingPairManager: "0xAeB0F58b0F7A01283175eF30BFFF618F872f960e"
};

async function main() {
  console.log("🔍 Verifying Hedera testnet deployment...");
  
  require('dotenv').config();
  
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  const signer = new ethers.Wallet(process.env.BITFINITY_PRIVATE_KEY, provider);
  
  console.log("📝 Using account:", signer.address);
  
  const balance = await provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");
  
  // Check network
  const network = await provider.getNetwork();
  console.log(`🌐 Network: Chain ID ${network.chainId}`);
  
  console.log("\n📋 Checking contract deployments...");
  
  for (const [name, address] of Object.entries(ADDRESSES)) {
    console.log(`\n🔍 Checking ${name} at ${address}...`);
    
    try {
      // Check if address has code
      const code = await provider.getCode(address);
      console.log(`   📄 Code length: ${code.length} characters`);
      
      if (code === "0x") {
        console.log(`   ❌ No contract code found`);
      } else {
        console.log(`   ✅ Contract code found`);
        
        // Try to get transaction count (nonce) to see if it's an active address
        const nonce = await provider.getTransactionCount(address);
        console.log(`   📊 Transaction count: ${nonce}`);
        
        // Try to get balance
        const contractBalance = await provider.getBalance(address);
        console.log(`   💰 Balance: ${ethers.formatEther(contractBalance)} HBAR`);
      }
      
      // Check recent transactions
      try {
        const latestBlock = await provider.getBlockNumber();
        console.log(`   📦 Latest block: ${latestBlock}`);
        
        // Look for transactions in recent blocks
        let found = false;
        for (let i = 0; i < 10 && !found; i++) {
          const blockNumber = latestBlock - i;
          try {
            const block = await provider.getBlock(blockNumber, true);
            if (block && block.transactions) {
              for (const tx of block.transactions) {
                if (tx.to === address || tx.from === address) {
                  console.log(`   📨 Found transaction: ${tx.hash}`);
                  found = true;
                  break;
                }
              }
            }
          } catch (blockError) {
            // Skip this block
          }
        }
        
        if (!found) {
          console.log(`   📭 No recent transactions found`);
        }
      } catch (txError) {
        console.log(`   ⚠️  Could not check transactions: ${txError.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking contract: ${error.message}`);
    }
  }
  
  console.log("\n🔗 Hedera Explorer Links:");
  for (const [name, address] of Object.entries(ADDRESSES)) {
    console.log(`   ${name}: https://hashscan.io/testnet/contract/${address}`);
  }
  
  console.log("\n📊 Account Explorer:");
  console.log(`   Your account: https://hashscan.io/testnet/account/${signer.address}`);
  
  // Try to interact with contracts using minimal ABIs
  console.log("\n🔧 Testing contract interactions...");
  
  // Test factory with minimal ABI
  try {
    console.log("\n🏭 Testing Factory contract...");
    const factoryABI = [
      "function totalDeployedTokens() external view returns (uint256)"
    ];
    const factory = new ethers.Contract(ADDRESSES.factory, factoryABI, provider);
    const totalTokens = await factory.totalDeployedTokens();
    console.log(`   ✅ Factory responsive - Total tokens: ${totalTokens}`);
  } catch (error) {
    console.log(`   ❌ Factory interaction failed: ${error.message}`);
  }
  
  // Test NGN token with ERC20 ABI
  try {
    console.log("\n💰 Testing NGN Stablecoin...");
    const erc20ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function totalSupply() external view returns (uint256)"
    ];
    const ngnToken = new ethers.Contract(ADDRESSES.ngnStablecoin, erc20ABI, provider);
    const name = await ngnToken.name();
    const symbol = await ngnToken.symbol();
    const totalSupply = await ngnToken.totalSupply();
    console.log(`   ✅ NGN Token responsive - ${name} (${symbol}), Supply: ${ethers.formatEther(totalSupply)}`);
  } catch (error) {
    console.log(`   ❌ NGN Token interaction failed: ${error.message}`);
  }
  
  console.log("\n🎯 Summary:");
  console.log("If contracts show code but interactions fail, they may be deployed");
  console.log("but with different ABIs or constructor parameters than expected.");
  console.log("Check the Hedera explorer links above for detailed information.");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;

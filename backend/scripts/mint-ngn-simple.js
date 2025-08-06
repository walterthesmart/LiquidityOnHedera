require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Use the newly deployed NGN contract address
const NGN_CONTRACT_ADDRESS = '0xa03D66E92A4F6b0D766cEC0C5f22424036B39e6A';

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Simple NGN ABI with just the functions we need
const NGN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
  try {
    log('🪙 Minting NGN Tokens...', 'cyan');
    log('='.repeat(40), 'cyan');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api'
    );
    
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY;
    if (!privateKey) {
      throw new Error('HEDERA_PRIVATE_KEY or OPERATOR_PVKEY not found in environment variables');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`📝 Minting to account: ${wallet.address}`, 'blue');
    
    // Check HBAR balance
    const balance = await provider.getBalance(wallet.address);
    log(`💰 HBAR balance: ${ethers.formatEther(balance)} HBAR`, 'blue');
    
    // Create contract instance with simple ABI
    const ngnContract = new ethers.Contract(NGN_CONTRACT_ADDRESS, NGN_ABI, wallet);
    log(`📦 NGN Contract: ${NGN_CONTRACT_ADDRESS}`, 'blue');
    
    // Wait a bit for the contract to be fully available
    log(`⏳ Waiting for contract to be ready...`, 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    // Test contract with simple calls
    log(`\n🧪 Testing contract...`, 'cyan');
    
    try {
      // Try to get basic info
      const symbol = await ngnContract.symbol();
      log(`✅ Contract accessible - Symbol: ${symbol}`, 'green');
      
      const totalSupply = await ngnContract.totalSupply();
      log(`📊 Current total supply: ${ethers.formatEther(totalSupply)} NGN`, 'blue');
      
      const currentBalance = await ngnContract.balanceOf(wallet.address);
      log(`💳 Current balance: ${ethers.formatEther(currentBalance)} NGN`, 'blue');
      
    } catch (error) {
      log(`⚠️  Contract test warning: ${error.message}`, 'yellow');
      log(`   Proceeding with minting anyway...`, 'yellow');
    }
    
    // Mint 100,000,000 NGN tokens
    const mintAmount = ethers.parseEther('100000000'); // 100 million NGN
    log(`\n🚀 Minting ${ethers.formatEther(mintAmount)} NGN tokens...`, 'cyan');
    
    const mintTx = await ngnContract.mint(wallet.address, mintAmount, {
      gasLimit: 800000,
      gasPrice: ethers.parseUnits('370', 'gwei')
    });
    
    log(`📝 Transaction submitted: ${mintTx.hash}`, 'yellow');
    log(`🔗 View on HashScan: https://hashscan.io/testnet/transaction/${mintTx.hash}`, 'blue');
    
    // Wait for confirmation
    log(`⏳ Waiting for confirmation...`, 'yellow');
    const receipt = await mintTx.wait();
    
    if (receipt.status === 1) {
      log(`✅ Minting transaction confirmed!`, 'green');
      log(`   • Block: ${receipt.blockNumber}`, 'blue');
      log(`   • Gas used: ${receipt.gasUsed.toString()}`, 'blue');
    } else {
      throw new Error('Transaction failed');
    }
    
    // Wait a bit and check final balance
    log(`⏳ Waiting for balance update...`, 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    try {
      const finalBalance = await ngnContract.balanceOf(wallet.address);
      const finalTotalSupply = await ngnContract.totalSupply();
      
      log(`\n🎉 MINTING COMPLETED SUCCESSFULLY!`, 'green');
      log('='.repeat(40), 'green');
      log(`📊 Final Results:`, 'cyan');
      log(`   • Your NGN Balance: ${ethers.formatEther(finalBalance)} NGN`, 'green');
      log(`   • Total NGN Supply: ${ethers.formatEther(finalTotalSupply)} NGN`, 'green');
      log(`   • Transaction: ${mintTx.hash}`, 'blue');
      
    } catch (error) {
      log(`⚠️  Could not verify final balance: ${error.message}`, 'yellow');
      log(`   But minting transaction was successful!`, 'green');
    }
    
    log(`\n💡 Ready for Frontend Use:`, 'cyan');
    log(`   1. Connect wallet ${wallet.address} to frontend`, 'yellow');
    log(`   2. Visit: http://localhost:3000/nigerian-stocks`, 'yellow');
    log(`   3. You should have 100,000,000 NGN for trading`, 'yellow');
    
    return {
      contractAddress: NGN_CONTRACT_ADDRESS,
      mintedAmount: ethers.formatEther(mintAmount),
      transactionHash: mintTx.hash,
      walletAddress: wallet.address
    };
    
  } catch (error) {
    log(`\n❌ Minting failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

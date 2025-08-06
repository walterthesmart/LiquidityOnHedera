require('dotenv').config();
const { ethers } = require('ethers');

// NGN contract address
const NGN_CONTRACT_ADDRESS = '0xa03D66E92A4F6b0D766cEC0C5f22424036B39e6A';

// Simple NGN ABI
const NGN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('💳 Checking NGN Token Balance...', 'cyan');
    log('='.repeat(40), 'cyan');
    
    // Setup provider
    const provider = new ethers.JsonRpcProvider(
      process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api'
    );
    
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY;
    if (!privateKey) {
      throw new Error('HEDERA_PRIVATE_KEY or OPERATOR_PVKEY not found in environment variables');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`📝 Checking balance for: ${wallet.address}`, 'blue');
    
    // Create contract instance
    const ngnContract = new ethers.Contract(NGN_CONTRACT_ADDRESS, NGN_ABI, provider);
    log(`📦 NGN Contract: ${NGN_CONTRACT_ADDRESS}`, 'blue');
    
    // Wait a bit for network sync
    log(`⏳ Waiting for network sync...`, 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Get contract info
      const [name, symbol, decimals] = await Promise.all([
        ngnContract.name(),
        ngnContract.symbol(),
        ngnContract.decimals()
      ]);
      
      log(`\n📊 Contract Info:`, 'cyan');
      log(`   • Name: ${name}`, 'blue');
      log(`   • Symbol: ${symbol}`, 'blue');
      log(`   • Decimals: ${decimals}`, 'blue');
      
      // Get balances
      const [balance, totalSupply] = await Promise.all([
        ngnContract.balanceOf(wallet.address),
        ngnContract.totalSupply()
      ]);
      
      log(`\n💰 Balance Information:`, 'cyan');
      log(`   • Your NGN Balance: ${ethers.formatEther(balance)} NGN`, 'green');
      log(`   • Total NGN Supply: ${ethers.formatEther(totalSupply)} NGN`, 'blue');
      
      if (balance > 0) {
        log(`\n🎉 SUCCESS! You have NGN tokens ready for trading!`, 'green');
        log(`💡 Next Steps:`, 'cyan');
        log(`   1. Connect wallet ${wallet.address} to frontend`, 'yellow');
        log(`   2. Visit: http://localhost:3000/nigerian-stocks`, 'yellow');
        log(`   3. Start trading with your ${ethers.formatEther(balance)} NGN`, 'yellow');
      } else {
        log(`\n⚠️  No NGN balance found. Minting may still be processing.`, 'yellow');
        log(`   Try again in a few minutes.`, 'yellow');
      }
      
      return {
        contractAddress: NGN_CONTRACT_ADDRESS,
        walletAddress: wallet.address,
        balance: ethers.formatEther(balance),
        totalSupply: ethers.formatEther(totalSupply),
        hasBalance: balance > 0
      };
      
    } catch (error) {
      log(`❌ Could not read contract: ${error.message}`, 'red');
      log(`   This might be due to network delays. Try again later.`, 'yellow');
      return null;
    }
    
  } catch (error) {
    log(`\n❌ Balance check failed: ${error.message}`, 'red');
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

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Deployed NGN contract address
const NGN_CONTRACT_ADDRESS = '0x545ED512dc51117B22a44c95232Aefa1D62d6492';

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function readNGNABI() {
  const artifactPath = path.join(__dirname, '../artifacts/contracts/NGNStablecoin.sol/NGNStablecoin.json');
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`NGN contract artifact not found: ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
}

async function main() {
  try {
    log('🪙 Starting NGN Token Minting...', 'cyan');
    log('=' * 50, 'cyan');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api'
    );
    
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY;
    if (!privateKey) {
      throw new Error('HEDERA_PRIVATE_KEY or OPERATOR_PVKEY not found in environment variables');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`📝 Minting with account: ${wallet.address}`, 'blue');
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`, 'blue');
    
    // Get NGN contract
    const ngnABI = await readNGNABI();
    const ngnContract = new ethers.Contract(NGN_CONTRACT_ADDRESS, ngnABI, wallet);
    
    log(`\n📦 NGN Contract: ${NGN_CONTRACT_ADDRESS}`, 'blue');
    
    // Test contract accessibility first
    log(`\n🔍 Testing contract accessibility...`, 'cyan');

    try {
      // Try to get contract name first (simplest call)
      const name = await ngnContract.name();
      log(`✅ Contract accessible - Name: ${name}`, 'green');
    } catch (error) {
      log(`❌ Contract not accessible: ${error.message}`, 'red');
      throw new Error(`Contract at ${NGN_CONTRACT_ADDRESS} is not accessible or not deployed properly`);
    }

    // Check contract info
    try {
      const [symbol, decimals, totalSupply] = await Promise.all([
        ngnContract.symbol(),
        ngnContract.decimals(),
        ngnContract.totalSupply()
      ]);

      log(`\n📊 Contract Info:`, 'cyan');
      log(`   • Symbol: ${symbol}`, 'blue');
      log(`   • Decimals: ${decimals}`, 'blue');
      log(`   • Total Supply: ${ethers.formatEther(totalSupply)} NGN`, 'blue');
    } catch (error) {
      log(`⚠️  Could not get full contract info: ${error.message}`, 'yellow');
    }

    // Check current NGN balance
    try {
      const currentBalance = await ngnContract.balanceOf(wallet.address);
      log(`💳 Current NGN balance: ${ethers.formatEther(currentBalance)} NGN`, 'blue');
    } catch (error) {
      log(`⚠️  Could not get balance: ${error.message}`, 'yellow');
      log(`   This might be normal for a new contract`, 'yellow');
    }
    
    // Mint 100,000,000 NGN tokens
    const mintAmount = ethers.parseEther('100000000'); // 100 million NGN
    log(`\n🚀 Minting ${ethers.formatEther(mintAmount)} NGN tokens...`, 'cyan');
    
    const mintTx = await ngnContract.mint(wallet.address, mintAmount, {
      gasLimit: 500000,
      gasPrice: ethers.parseUnits('370', 'gwei')
    });
    
    log(`📝 Transaction hash: ${mintTx.hash}`, 'yellow');
    log(`🔗 View on HashScan: https://hashscan.io/testnet/transaction/${mintTx.hash}`, 'blue');
    
    // Wait for confirmation
    log(`⏳ Waiting for confirmation...`, 'yellow');
    const receipt = await mintTx.wait();
    
    if (receipt.status === 1) {
      log(`✅ Minting successful!`, 'green');
      log(`   • Block: ${receipt.blockNumber}`, 'blue');
      log(`   • Gas used: ${receipt.gasUsed.toString()}`, 'blue');
    } else {
      throw new Error('Transaction failed');
    }
    
    // Check new balance
    const newBalance = await ngnContract.balanceOf(wallet.address);
    const newTotalSupply = await ngnContract.totalSupply();
    
    log(`\n📊 Updated Balances:`, 'cyan');
    log(`   • Your NGN balance: ${ethers.formatEther(newBalance)} NGN`, 'green');
    log(`   • Total NGN supply: ${ethers.formatEther(newTotalSupply)} NGN`, 'green');
    log(`   • Minted amount: ${ethers.formatEther(mintAmount)} NGN`, 'green');
    
    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      contractAddress: NGN_CONTRACT_ADDRESS,
      minterAddress: wallet.address,
      mintedAmount: ethers.formatEther(mintAmount),
      transactionHash: mintTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      newBalance: ethers.formatEther(newBalance),
      newTotalSupply: ethers.formatEther(newTotalSupply)
    };
    
    // Save minting record
    const recordsDir = path.join(__dirname, '../records');
    if (!fs.existsSync(recordsDir)) {
      fs.mkdirSync(recordsDir, { recursive: true });
    }
    
    const recordFile = path.join(recordsDir, `ngn-mint-${Date.now()}.json`);
    fs.writeFileSync(recordFile, JSON.stringify(summary, null, 2));
    
    log(`\n📄 Minting record saved: ${recordFile}`, 'blue');
    log(`\n🎉 NGN MINTING COMPLETED SUCCESSFULLY!`, 'green');
    log('=' * 50, 'green');
    
    log(`\n💡 Next Steps:`, 'cyan');
    log(`   1. Connect your wallet to the frontend`, 'yellow');
    log(`   2. Visit: http://localhost:3000/nigerian-stocks`, 'yellow');
    log(`   3. Your wallet should show ${ethers.formatEther(newBalance)} NGN`, 'yellow');
    log(`   4. Start trading Nigerian stocks!`, 'yellow');
    
    return summary;
    
  } catch (error) {
    log(`\n❌ Minting failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Run minting if this file is executed directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

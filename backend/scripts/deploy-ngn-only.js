require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function readCompiledContract(contractName) {
  const artifactPath = path.join(__dirname, '../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return {
    bytecode: artifact.bytecode,
    abi: artifact.abi
  };
}

async function main() {
  try {
    log('🪙 Deploying NGN Stablecoin Only...', 'cyan');
    log('='.repeat(50), 'cyan');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api'
    );
    
    const privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY;
    if (!privateKey) {
      throw new Error('HEDERA_PRIVATE_KEY or OPERATOR_PVKEY not found in environment variables');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`📝 Deploying with account: ${wallet.address}`, 'blue');
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`, 'blue');
    
    // Deploy NGN Stablecoin
    log('\n📦 Deploying NGN Stablecoin...', 'cyan');
    const ngnContract = await readCompiledContract('NGNStablecoin');
    const NGNFactory = new ethers.ContractFactory(ngnContract.abi, ngnContract.bytecode, wallet);
    
    const stablecoinConfig = {
      name: 'Nigerian Naira Stablecoin',
      symbol: 'NGN',
      decimals: 18,
      maxSupply: ethers.parseEther('1000000000'), // 1 billion NGN
      mintingCap: ethers.parseEther('100000000'), // 100 million NGN daily cap
      lastMintReset: 0,
      currentDayMinted: 0,
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true
    };
    
    log(`🚀 Deploying with config:`, 'yellow');
    log(`   • Name: ${stablecoinConfig.name}`, 'blue');
    log(`   • Symbol: ${stablecoinConfig.symbol}`, 'blue');
    log(`   • Max Supply: ${ethers.formatEther(stablecoinConfig.maxSupply)} NGN`, 'blue');
    log(`   • Daily Minting Cap: ${ethers.formatEther(stablecoinConfig.mintingCap)} NGN`, 'blue');
    
    const ngnStablecoin = await NGNFactory.deploy(
      wallet.address, // admin
      stablecoinConfig,
      {
        gasLimit: 4000000,
        gasPrice: ethers.parseUnits('370', 'gwei')
      }
    );
    
    log(`⏳ Waiting for deployment...`, 'yellow');
    await ngnStablecoin.waitForDeployment();
    const ngnAddress = await ngnStablecoin.getAddress();
    
    log(`✅ NGN Stablecoin deployed to: ${ngnAddress}`, 'green');
    log(`🔗 View on HashScan: https://hashscan.io/testnet/contract/${ngnAddress}`, 'blue');
    
    // Test the contract immediately
    log(`\n🧪 Testing deployed contract...`, 'cyan');
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        ngnStablecoin.name(),
        ngnStablecoin.symbol(),
        ngnStablecoin.decimals(),
        ngnStablecoin.totalSupply()
      ]);
      
      log(`✅ Contract test successful:`, 'green');
      log(`   • Name: ${name}`, 'blue');
      log(`   • Symbol: ${symbol}`, 'blue');
      log(`   • Decimals: ${decimals}`, 'blue');
      log(`   • Total Supply: ${ethers.formatEther(totalSupply)} NGN`, 'blue');
    } catch (error) {
      log(`❌ Contract test failed: ${error.message}`, 'red');
      throw error;
    }
    
    // Mint 100,000,000 NGN tokens
    log(`\n🪙 Minting 100,000,000 NGN tokens...`, 'cyan');
    const mintAmount = ethers.parseEther('100000000');
    
    const mintTx = await ngnStablecoin.mint(wallet.address, mintAmount, {
      gasLimit: 500000,
      gasPrice: ethers.parseUnits('370', 'gwei')
    });
    
    log(`📝 Mint transaction hash: ${mintTx.hash}`, 'yellow');
    log(`🔗 View on HashScan: https://hashscan.io/testnet/transaction/${mintTx.hash}`, 'blue');
    
    // Wait for confirmation
    log(`⏳ Waiting for mint confirmation...`, 'yellow');
    const receipt = await mintTx.wait();
    
    if (receipt.status === 1) {
      log(`✅ Minting successful!`, 'green');
    } else {
      throw new Error('Minting transaction failed');
    }
    
    // Check final balance
    const finalBalance = await ngnStablecoin.balanceOf(wallet.address);
    const finalTotalSupply = await ngnStablecoin.totalSupply();
    
    log(`\n🎉 MINTING COMPLETED!`, 'green');
    log('='.repeat(50), 'green');
    log(`📊 Final Results:`, 'cyan');
    log(`   • Contract Address: ${ngnAddress}`, 'blue');
    log(`   • Your NGN Balance: ${ethers.formatEther(finalBalance)} NGN`, 'green');
    log(`   • Total NGN Supply: ${ethers.formatEther(finalTotalSupply)} NGN`, 'green');
    log(`   • Minted Amount: ${ethers.formatEther(mintAmount)} NGN`, 'green');
    
    // Update frontend config with new address
    const frontendConfigPath = path.join(__dirname, '../../frontend/src/config/hedera-contracts.json');
    if (fs.existsSync(frontendConfigPath)) {
      const config = JSON.parse(fs.readFileSync(frontendConfigPath, 'utf8'));
      config.contracts.NGNStablecoin.address = ngnAddress;
      config.lastUpdated = new Date().toISOString();
      fs.writeFileSync(frontendConfigPath, JSON.stringify(config, null, 2));
      log(`✅ Frontend config updated with new NGN address`, 'green');
    }
    
    log(`\n💡 Next Steps:`, 'cyan');
    log(`   1. Connect your wallet (${wallet.address}) to the frontend`, 'yellow');
    log(`   2. Visit: http://localhost:3000/nigerian-stocks`, 'yellow');
    log(`   3. Your wallet should show 100,000,000 NGN`, 'yellow');
    log(`   4. Start trading Nigerian stocks!`, 'yellow');
    
    return {
      contractAddress: ngnAddress,
      mintedAmount: ethers.formatEther(mintAmount),
      finalBalance: ethers.formatEther(finalBalance),
      transactionHash: mintTx.hash
    };
    
  } catch (error) {
    log(`\n❌ Deployment/Minting failed: ${error.message}`, 'red');
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

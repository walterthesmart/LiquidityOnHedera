#!/usr/bin/env node

/**
 * Sepolia ETH Utilities
 * 
 * This script provides utilities for working with Ethereum Sepolia testnet,
 * including balance checking, faucet integration, and network detection.
 * Extends the existing BFT minting utilities for Sepolia ETH support.
 * 
 * Usage:
 *   node scripts/sepolia-eth-utils.js --address 0x1234... --action balance
 *   node scripts/sepolia-eth-utils.js --address 0x1234... --action faucet
 *   node scripts/sepolia-eth-utils.js --action network-info
 * 
 * Requirements:
 *   - Node.js 16+
 *   - Access to Ethereum Sepolia testnet
 */

const https = require('https');
const { program } = require('commander');

// Sepolia network configuration
const SEPOLIA_CONFIG = {
  name: 'Ethereum Sepolia Testnet',
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  chainId: 11155111,
  explorer: 'https://sepolia.etherscan.io',
  currency: 'ETH',
  faucets: [
    {
      name: 'Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Official Sepolia faucet - requires Alchemy account'
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      description: 'Infura Sepolia faucet - requires Infura account'
    },
    {
      name: 'QuickNode Sepolia Faucet',
      url: 'https://faucet.quicknode.com/ethereum/sepolia',
      description: 'QuickNode Sepolia faucet - no account required'
    },
    {
      name: 'Chainlink Sepolia Faucet',
      url: 'https://faucets.chain.link/sepolia',
      description: 'Chainlink Sepolia faucet - requires social media verification'
    }
  ]
};

/**
 * Utility Functions
 */

// Convert decimal amount to hexadecimal wei (18 decimals)
function toHexWei(amount) {
  const wei = BigInt(Math.floor(parseFloat(amount) * 1e18));
  return '0x' + wei.toString(16);
}

// Convert hexadecimal wei to decimal amount
function fromHexWei(hexWei) {
  const wei = BigInt(hexWei);
  return (Number(wei) / 1e18).toFixed(6);
}

// Validate Ethereum address format
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Generate unique request ID
function generateRequestId() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * JSON-RPC Request Handler for Sepolia
 */
async function makeSepoliaRpcRequest(method, params = []) {
  const requestData = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: generateRequestId()
  };

  const postData = JSON.stringify(requestData);
  const url = new URL(SEPOLIA_CONFIG.rpcUrl);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Sepolia-ETH-Utility/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`JSON-RPC Error: ${response.error.message} (Code: ${response.error.code})`));
          } else {
            resolve(response.result);
          }
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Core Sepolia Functions
 */

// Get current ETH balance of an address
async function getSepoliaBalance(address) {
  console.log(`📊 Checking Sepolia ETH balance for ${address}...`);
  
  try {
    const balance = await makeSepoliaRpcRequest('eth_getBalance', [address, 'latest']);
    const balanceDecimal = fromHexWei(balance);
    
    console.log(`   Current balance: ${balanceDecimal} ${SEPOLIA_CONFIG.currency}`);
    return { hex: balance, decimal: balanceDecimal };
  } catch (error) {
    console.error(`   ❌ Failed to get balance: ${error.message}`);
    throw error;
  }
}

// Get network information
async function getNetworkInfo() {
  console.log(`🌐 Sepolia Network Information:`);
  console.log(`   Name: ${SEPOLIA_CONFIG.name}`);
  console.log(`   Chain ID: ${SEPOLIA_CONFIG.chainId}`);
  console.log(`   RPC URL: ${SEPOLIA_CONFIG.rpcUrl}`);
  console.log(`   Explorer: ${SEPOLIA_CONFIG.explorer}`);
  console.log(`   Currency: ${SEPOLIA_CONFIG.currency}`);
  
  try {
    // Get latest block number
    const blockNumber = await makeSepoliaRpcRequest('eth_blockNumber');
    const blockNumberDecimal = parseInt(blockNumber, 16);
    console.log(`   Latest Block: ${blockNumberDecimal.toLocaleString()}`);
    
    // Get gas price
    const gasPrice = await makeSepoliaRpcRequest('eth_gasPrice');
    const gasPriceGwei = parseFloat(fromHexWei(gasPrice)) * 1e9;
    console.log(`   Current Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
    
    return {
      chainId: SEPOLIA_CONFIG.chainId,
      blockNumber: blockNumberDecimal,
      gasPrice: gasPriceGwei
    };
  } catch (error) {
    console.error(`   ❌ Failed to get network info: ${error.message}`);
    throw error;
  }
}

// Display faucet information
function displayFaucetInfo() {
  console.log(`\n💧 Sepolia ETH Faucets:`);
  console.log(`=====================================`);
  
  SEPOLIA_CONFIG.faucets.forEach((faucet, index) => {
    console.log(`\n${index + 1}. ${faucet.name}`);
    console.log(`   URL: ${faucet.url}`);
    console.log(`   Description: ${faucet.description}`);
  });
  
  console.log(`\n📝 Instructions:`);
  console.log(`   1. Visit one of the faucet URLs above`);
  console.log(`   2. Enter your wallet address`);
  console.log(`   3. Complete any required verification`);
  console.log(`   4. Wait for the transaction to be processed`);
  console.log(`   5. Check your balance using: node scripts/sepolia-eth-utils.js --address YOUR_ADDRESS --action balance`);
}

// Check if address has sufficient ETH for deployment
async function checkDeploymentReadiness(address, requiredETH = 0.1) {
  console.log(`\n🔍 Checking deployment readiness for ${address}...`);
  
  try {
    const balance = await getSepoliaBalance(address);
    const balanceNum = parseFloat(balance.decimal);
    
    console.log(`\n📊 Deployment Readiness Report:`);
    console.log(`   Current Balance: ${balance.decimal} ETH`);
    console.log(`   Required Balance: ${requiredETH} ETH`);
    
    if (balanceNum >= requiredETH) {
      console.log(`   ✅ Ready for deployment!`);
      return true;
    } else {
      const needed = requiredETH - balanceNum;
      console.log(`   ❌ Insufficient balance. Need ${needed.toFixed(6)} more ETH`);
      console.log(`   💡 Get Sepolia ETH from faucets using: --action faucet`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Failed to check readiness: ${error.message}`);
    return false;
  }
}

// Estimate gas costs for deployment
async function estimateDeploymentCosts() {
  console.log(`\n⛽ Estimating Sepolia deployment costs...`);
  
  try {
    const gasPrice = await makeSepoliaRpcRequest('eth_gasPrice');
    const gasPriceWei = BigInt(gasPrice);
    
    // Estimated gas usage for Nigerian Stock Token deployment
    const factoryGas = 3000000n; // Factory deployment
    const tokenGas = 2500000n;   // Per token deployment
    const sampleTokens = 5n;     // Sample tokens for Sepolia
    
    const totalGas = factoryGas + (tokenGas * sampleTokens);
    const totalCostWei = totalGas * gasPriceWei;
    const totalCostETH = fromHexWei('0x' + totalCostWei.toString(16));
    
    console.log(`   Factory Gas: ${factoryGas.toLocaleString()}`);
    console.log(`   Per Token Gas: ${tokenGas.toLocaleString()}`);
    console.log(`   Sample Tokens: ${sampleTokens}`);
    console.log(`   Total Gas: ${totalGas.toLocaleString()}`);
    console.log(`   Gas Price: ${fromHexWei(gasPrice)} ETH (${(parseFloat(fromHexWei(gasPrice)) * 1e9).toFixed(2)} gwei)`);
    console.log(`   Estimated Cost: ${totalCostETH} ETH`);
    
    return {
      totalGas: totalGas.toString(),
      gasPrice: gasPrice,
      estimatedCost: totalCostETH
    };
  } catch (error) {
    console.error(`   ❌ Failed to estimate costs: ${error.message}`);
    throw error;
  }
}

/**
 * Main Action Handler
 */
async function handleAction(options) {
  const { address, action, requiredEth } = options;
  
  console.log(`\n🚀 Sepolia ETH Utilities`);
  console.log(`=====================================`);
  console.log(`Action: ${action}`);
  if (address) console.log(`Address: ${address}`);
  console.log(`=====================================\n`);

  try {
    switch (action) {
      case 'balance':
        if (!address) {
          throw new Error('Address is required for balance check');
        }
        if (!isValidAddress(address)) {
          throw new Error('Invalid Ethereum address format');
        }
        await getSepoliaBalance(address);
        break;

      case 'network-info':
        await getNetworkInfo();
        break;

      case 'faucet':
        displayFaucetInfo();
        break;

      case 'deployment-ready':
        if (!address) {
          throw new Error('Address is required for deployment readiness check');
        }
        if (!isValidAddress(address)) {
          throw new Error('Invalid Ethereum address format');
        }
        await checkDeploymentReadiness(address, requiredEth);
        break;

      case 'estimate-costs':
        await estimateDeploymentCosts();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`\n❌ Action failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CLI Setup
 */
program
  .name('sepolia-eth-utils')
  .description('Utilities for working with Ethereum Sepolia testnet')
  .version('1.0.0')
  .option('-a, --address <address>', 'Ethereum address to work with')
  .requiredOption('--action <action>', 'Action to perform (balance|network-info|faucet|deployment-ready|estimate-costs)')
  .option('--required-eth <amount>', 'Required ETH amount for deployment readiness check', '0.1')
  .action(async (options) => {
    await handleAction(options);
  });

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

module.exports = {
  getSepoliaBalance,
  getNetworkInfo,
  displayFaucetInfo,
  checkDeploymentReadiness,
  estimateDeploymentCosts,
  isValidAddress,
  SEPOLIA_CONFIG
};

#!/usr/bin/env node

/**
 * BFT Testnet Token Minting Utility
 * 
 * This script uses the Bitfinity EVM JSON-RPC API to mint native testnet tokens
 * using the ic_mintNativeToken method. It includes proper error handling,
 * balance verification, and hexadecimal conversion utilities.
 * 
 * Usage:
 *   node scripts/mint-bft-tokens.js --address 0x1234... --amount 10
 *   node scripts/mint-bft-tokens.js --address 0x1234... --amount 10 --network testnet
 * 
 * Requirements:
 *   - Node.js 16+
 *   - Access to Bitfinity testnet
 */

const https = require('https');
const { program } = require('commander');

// Multi-network configurations
const NETWORKS = {
  // Bitfinity EVM Networks
  bitfinity_testnet: {
    name: 'Bitfinity Testnet',
    rpcUrl: 'https://testnet.bitfinity.network',
    chainId: 355113,
    explorer: 'https://explorer.testnet.bitfinity.network',
    currency: 'BTF',
    type: 'bitfinity',
    supportsMinting: true
  },
  bitfinity_mainnet: {
    name: 'Bitfinity Mainnet',
    rpcUrl: 'https://mainnet.bitfinity.network',
    chainId: 355110,
    explorer: 'https://explorer.bitfinity.network',
    currency: 'BTF',
    type: 'bitfinity',
    supportsMinting: true
  },
  // Ethereum Networks
  sepolia: {
    name: 'Ethereum Sepolia Testnet',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
    explorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    type: 'ethereum',
    supportsMinting: false
  },
  // Backward compatibility
  testnet: {
    name: 'Bitfinity Testnet',
    rpcUrl: 'https://testnet.bitfinity.network',
    chainId: 355113,
    explorer: 'https://explorer.testnet.bitfinity.network',
    currency: 'BTF',
    type: 'bitfinity',
    supportsMinting: true
  },
  mainnet: {
    name: 'Bitfinity Mainnet',
    rpcUrl: 'https://mainnet.bitfinity.network',
    chainId: 355110,
    explorer: 'https://explorer.bitfinity.network',
    currency: 'BTF',
    type: 'bitfinity',
    supportsMinting: true
  }
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
 * JSON-RPC Request Handler
 */
async function makeJsonRpcRequest(network, method, params = []) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const requestData = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: generateRequestId()
  };

  const postData = JSON.stringify(requestData);
  const url = new URL(networkConfig.rpcUrl);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'BFT-Minting-Utility/1.0'
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
 * Core Minting Functions
 */

// Get current balance of an address
async function getBalance(network, address) {
  console.log(`📊 Checking balance for ${address}...`);
  
  try {
    const balance = await makeJsonRpcRequest(network, 'eth_getBalance', [address, 'latest']);
    const balanceDecimal = fromHexWei(balance);
    
    console.log(`   Current balance: ${balanceDecimal} ${NETWORKS[network].currency}`);
    return { hex: balance, decimal: balanceDecimal };
  } catch (error) {
    console.error(`   ❌ Failed to get balance: ${error.message}`);
    throw error;
  }
}

// Mint native tokens using ic_mint_native_token (Bitfinity only)
async function mintNativeTokens(network, address, amount) {
  const networkConfig = NETWORKS[network];

  if (!networkConfig.supportsMinting) {
    throw new Error(`Minting not supported on ${networkConfig.name}. Use faucets instead.`);
  }

  console.log(`🪙 Minting ${amount} ${networkConfig.currency} to ${address}...`);

  try {
    const hexAmount = toHexWei(amount);
    console.log(`   Amount in hex wei: ${hexAmount}`);

    const result = await makeJsonRpcRequest(network, 'ic_mintNativeToken', [address, hexAmount]);

    console.log(`   ✅ Minting successful!`);
    console.log(`   Transaction hash: ${result}`);

    return result;
  } catch (error) {
    console.error(`   ❌ Minting failed: ${error.message}`);
    throw error;
  }
}

// Wait for transaction confirmation (optional)
async function waitForTransaction(network, txHash, maxAttempts = 10) {
  console.log(`⏳ Waiting for transaction confirmation...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const receipt = await makeJsonRpcRequest(network, 'eth_getTransactionReceipt', [txHash]);
      
      if (receipt) {
        console.log(`   ✅ Transaction confirmed in block ${parseInt(receipt.blockNumber, 16)}`);
        return receipt;
      }
      
      console.log(`   Attempt ${attempt}/${maxAttempts}: Transaction pending...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
    } catch (error) {
      console.log(`   Attempt ${attempt}/${maxAttempts}: ${error.message}`);
      if (attempt === maxAttempts) {
        console.log(`   ⚠️  Transaction confirmation timeout, but minting may still be successful`);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
}

/**
 * Display faucet information for networks that don't support minting
 */
function displayFaucetInfo(network) {
  const networkConfig = NETWORKS[network];

  console.log(`\n💧 ${networkConfig.name} Faucets:`);
  console.log(`=====================================`);

  switch (network) {
    case 'sepolia':
      console.log(`\n1. Sepolia Faucet`);
      console.log(`   URL: https://sepoliafaucet.com/`);
      console.log(`   Description: Official Sepolia faucet - requires Alchemy account`);

      console.log(`\n2. Infura Sepolia Faucet`);
      console.log(`   URL: https://www.infura.io/faucet/sepolia`);
      console.log(`   Description: Infura Sepolia faucet - requires Infura account`);

      console.log(`\n3. QuickNode Sepolia Faucet`);
      console.log(`   URL: https://faucet.quicknode.com/ethereum/sepolia`);
      console.log(`   Description: QuickNode Sepolia faucet - no account required`);

      console.log(`\n4. Chainlink Sepolia Faucet`);
      console.log(`   URL: https://faucets.chain.link/sepolia`);
      console.log(`   Description: Chainlink Sepolia faucet - requires social media verification`);
      break;

    default:
      console.log(`   No faucet information available for ${networkConfig.name}`);
  }

  console.log(`\n📝 Instructions:`);
  console.log(`   1. Visit one of the faucet URLs above`);
  console.log(`   2. Enter your wallet address`);
  console.log(`   3. Complete any required verification`);
  console.log(`   4. Wait for the transaction to be processed`);
  console.log(`   5. Check your balance using the balance checker`);
}

/**
 * Main Minting Process
 */
async function mintTokens(options) {
  const { address, amount, network } = options;
  
  console.log(`\n🚀 BFT Token Minting Utility`);
  console.log(`=====================================`);
  console.log(`Network: ${NETWORKS[network].name}`);
  console.log(`RPC URL: ${NETWORKS[network].rpcUrl}`);
  console.log(`Target Address: ${address}`);
  console.log(`Amount: ${amount} ${NETWORKS[network].currency}`);
  console.log(`=====================================\n`);

  try {
    // Step 1: Validate address
    if (!isValidAddress(address)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Step 2: Get initial balance
    const initialBalance = await getBalance(network, address);

    // Step 3: Mint tokens or show faucet info
    let txHash = null;

    if (NETWORKS[network].supportsMinting) {
      txHash = await mintNativeTokens(network, address, amount);
    } else {
      console.log(`\n⚠️  Direct minting not supported on ${NETWORKS[network].name}`);
      console.log(`   Please use faucets to obtain ${NETWORKS[network].currency}:`);
      displayFaucetInfo(network);
      return; // Exit early for non-minting networks
    }

    // Step 4: Wait for confirmation (optional)
    if (txHash) {
      await waitForTransaction(network, txHash);
    }

    // Step 5: Verify final balance
    console.log(`\n🔍 Verifying minting results...`);
    const finalBalance = await getBalance(network, address);

    // Step 6: Calculate and display results
    const balanceIncrease = parseFloat(finalBalance.decimal) - parseFloat(initialBalance.decimal);
    
    console.log(`\n📈 Minting Summary:`);
    console.log(`   Initial Balance: ${initialBalance.decimal} ${NETWORKS[network].currency}`);
    console.log(`   Final Balance: ${finalBalance.decimal} ${NETWORKS[network].currency}`);
    console.log(`   Balance Increase: ${balanceIncrease.toFixed(6)} ${NETWORKS[network].currency}`);
    
    if (txHash) {
      console.log(`   Transaction: ${NETWORKS[network].explorer}/tx/${txHash}`);
    }
    
    if (Math.abs(balanceIncrease - parseFloat(amount)) < 0.000001) {
      console.log(`   ✅ Minting verified successfully!`);
    } else {
      console.log(`   ⚠️  Balance increase doesn't match expected amount`);
    }

  } catch (error) {
    console.error(`\n❌ Minting failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CLI Setup
 */
program
  .name('multi-network-utils')
  .description('Multi-network utilities for Bitfinity EVM and Ethereum networks')
  .version('1.0.0')
  .requiredOption('-a, --address <address>', 'Target Ethereum address')
  .option('-m, --amount <amount>', 'Amount of tokens to mint (in decimal, for minting networks only)')
  .option('-n, --network <network>', 'Network to use (bitfinity_testnet|bitfinity_mainnet|sepolia|testnet|mainnet)', 'bitfinity_testnet')
  .option('--action <action>', 'Action to perform (mint|balance|faucet)', 'mint')
  .option('--dry-run', 'Show what would be done without actually executing')
  .action(async (options) => {
    const networkConfig = NETWORKS[options.network];

    if (!networkConfig) {
      console.error(`❌ Unsupported network: ${options.network}`);
      console.log(`   Supported networks: ${Object.keys(NETWORKS).join(', ')}`);
      process.exit(1);
    }

    if (options.dryRun) {
      console.log('🧪 Dry run mode - showing configuration:');
      console.log(`   Network: ${networkConfig.name} (${options.network})`);
      console.log(`   Address: ${options.address}`);
      console.log(`   Action: ${options.action}`);
      if (options.amount) {
        console.log(`   Amount: ${options.amount} ${networkConfig.currency}`);
        console.log(`   Hex Amount: ${toHexWei(options.amount)}`);
      }
      console.log(`   Supports Minting: ${networkConfig.supportsMinting}`);
      return;
    }

    switch (options.action) {
      case 'mint':
        if (!options.amount) {
          console.error('❌ Amount is required for minting action');
          process.exit(1);
        }
        await mintTokens(options);
        break;

      case 'balance':
        await getBalance(options.network, options.address);
        break;

      case 'faucet':
        if (networkConfig.supportsMinting) {
          console.log(`ℹ️  ${networkConfig.name} supports direct minting. Use --action mint instead.`);
        } else {
          displayFaucetInfo(options.network);
        }
        break;

      default:
        console.error(`❌ Unknown action: ${options.action}`);
        console.log(`   Supported actions: mint, balance, faucet`);
        process.exit(1);
    }
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
  mintTokens,
  getBalance,
  toHexWei,
  fromHexWei,
  isValidAddress,
  NETWORKS
};

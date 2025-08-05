#!/usr/bin/env node

/**
 * BFT Balance Checker Utility
 * 
 * Simple utility to check BFT token balances on Bitfinity EVM
 * 
 * Usage:
 *   node scripts/balance-checker.js --address 0x1234...
 *   node scripts/balance-checker.js --address 0x1234... --network testnet
 */

const { program } = require('commander');
const { getBalance, NETWORKS, isValidAddress } = require('./mint-bft-tokens');

async function checkBalance(options) {
  const { address, network } = options;
  
  console.log(`\n💰 BFT Balance Checker`);
  console.log(`========================`);
  console.log(`Network: ${NETWORKS[network].name}`);
  console.log(`Address: ${address}`);
  console.log(`========================\n`);

  try {
    // Validate address
    if (!isValidAddress(address)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Get balance
    const balance = await getBalance(network, address);
    
    console.log(`\n📊 Balance Information:`);
    console.log(`   Decimal: ${balance.decimal} ${NETWORKS[network].currency}`);
    console.log(`   Hex Wei: ${balance.hex}`);
    console.log(`   Explorer: ${NETWORKS[network].explorer}/address/${address}`);

  } catch (error) {
    console.error(`\n❌ Balance check failed: ${error.message}`);
    process.exit(1);
  }
}

program
  .name('balance-checker')
  .description('Check BFT token balance on Bitfinity EVM')
  .version('1.0.0')
  .requiredOption('-a, --address <address>', 'Ethereum address to check')
  .option('-n, --network <network>', 'Network to use (testnet|mainnet)', 'testnet')
  .action(checkBalance);

if (require.main === module) {
  program.parse();
}

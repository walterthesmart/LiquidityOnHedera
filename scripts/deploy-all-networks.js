#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const NETWORKS = [
  'bitfinity_testnet',
  'sepolia',
  'hedera'
];

async function deployToNetwork(network) {
  console.log(`\n🚀 Deploying to ${network}...`);
  
  try {
    const contractsDir = path.join(__dirname, '../contracts');
    process.chdir(contractsDir);
    
    // Deploy contracts
    execSync(`npm run deploy:${network.replace('_', ':')}`, { stdio: 'inherit' });
    
    // Verify contracts (if supported)
    if (network !== 'hedera') {
      try {
        execSync(`npm run verify:${network}`, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`⚠️  Verification failed for ${network}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully deployed to ${network}`);
  } catch (error) {
    console.error(`❌ Deployment failed for ${network}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🌐 Starting multi-network deployment...');
  
  for (const network of NETWORKS) {
    await deployToNetwork(network);
  }
  
  console.log('\n🎉 All deployments completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update frontend configuration with new contract addresses');
  console.log('2. Test contract interactions on each network');
  console.log('3. Update documentation with deployment details');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = { deployToNetwork, NETWORKS };

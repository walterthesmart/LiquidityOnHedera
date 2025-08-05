#!/usr/bin/env node

/**
 * Hedera Testnet Deployment Script
 * 
 * This script deploys the complete Nigerian Stock Trading System to Hedera Testnet
 * including all smart contracts, frontend configuration, and database setup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  log('\n🔍 Checking environment configuration...', 'cyan');
  
  const requiredEnvVars = [
    'HEDERA_PRIVATE_KEY',
    'HEDERA_TESTNET_RPC_URL'
  ];
  
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missingVars.forEach(varName => {
      log(`   - ${varName}`, 'red');
    });
    log('\nPlease set these environment variables before running the deployment.', 'yellow');
    log('You can create a .env file in the root directory with the following format:', 'yellow');
    log('\nHEDERA_PRIVATE_KEY=your_hedera_private_key_here', 'yellow');
    log('HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api', 'yellow');
    process.exit(1);
  }
  
  log('✅ Environment configuration looks good!', 'green');
}

function checkDependencies() {
  log('\n📦 Checking dependencies...', 'cyan');
  
  const backendDir = path.join(__dirname, 'backend');
  const frontendDir = path.join(__dirname, 'front-end');
  
  // Check if node_modules exist
  if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
    log('📥 Installing backend dependencies...', 'yellow');
    execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  }
  
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    log('📥 Installing frontend dependencies...', 'yellow');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  }
  
  log('✅ Dependencies are ready!', 'green');
}

function deployContracts() {
  log('\n🚀 Deploying smart contracts to Hedera Testnet...', 'cyan');
  
  const backendDir = path.join(__dirname, 'backend');
  
  try {
    // Compile contracts first
    log('🔨 Compiling contracts...', 'yellow');
    execSync('npx hardhat compile', { cwd: backendDir, stdio: 'inherit' });
    
    // Deploy to Hedera testnet
    log('🚀 Deploying to Hedera testnet...', 'yellow');
    execSync('npx hardhat run scripts/deploy-hedera-complete.ts --network hedera_testnet', { 
      cwd: backendDir, 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    log('✅ Smart contracts deployed successfully!', 'green');
    return true;
  } catch (error) {
    log('❌ Contract deployment failed:', 'red');
    log(error.message, 'red');
    return false;
  }
}

function updateFrontendConfig() {
  log('\n⚙️  Updating frontend configuration...', 'cyan');
  
  try {
    // Check if Hedera contracts config was generated
    const hederaConfigPath = path.join(__dirname, 'front-end/src/config/hedera-contracts.json');
    
    if (fs.existsSync(hederaConfigPath)) {
      const hederaConfig = JSON.parse(fs.readFileSync(hederaConfigPath, 'utf8'));
      
      // Update the main contracts configuration
      const contractsConfigPath = path.join(__dirname, 'front-end/src/config/contracts.ts');
      
      if (fs.existsSync(contractsConfigPath)) {
        let contractsConfig = fs.readFileSync(contractsConfigPath, 'utf8');
        
        // Update Hedera testnet configuration
        const hederaTestnetConfig = `  // Hedera Testnet (Target for deployment)
  296: {
    factoryAddress: "${hederaConfig.factoryAddress}",
    ngnStablecoin: "${hederaConfig.ngnStablecoin}",
    stockNGNDEX: "${hederaConfig.stockNGNDEX}",
    tradingPairManager: "${hederaConfig.tradingPairManager}",
    blockExplorer: "${hederaConfig.blockExplorer}",
    deployedAt: "${hederaConfig.deployedAt}",
    totalTokens: ${hederaConfig.totalTokens},
    tokens: ${JSON.stringify(hederaConfig.tokens, null, 6)}
  },`;
        
        // Replace the Hedera testnet section
        contractsConfig = contractsConfig.replace(
          /\/\/ Hedera Testnet \(Target for deployment\)[\s\S]*?},/,
          hederaTestnetConfig
        );
        
        fs.writeFileSync(contractsConfigPath, contractsConfig);
        log('✅ Frontend configuration updated!', 'green');
      }
    } else {
      log('⚠️  Hedera contracts config not found. Frontend may need manual configuration.', 'yellow');
    }
  } catch (error) {
    log('❌ Failed to update frontend configuration:', 'red');
    log(error.message, 'red');
  }
}

function setupDatabase() {
  log('\n🗄️  Setting up database...', 'cyan');
  
  try {
    const frontendDir = path.join(__dirname, 'front-end');
    
    // Run database migration script if it exists
    const migrationScript = path.join(frontendDir, 'scripts/migrate-deployed-stocks-turso.ts');
    
    if (fs.existsSync(migrationScript)) {
      log('📊 Running database migration...', 'yellow');
      execSync('npx tsx scripts/migrate-deployed-stocks-turso.ts', { 
        cwd: frontendDir, 
        stdio: 'inherit' 
      });
      log('✅ Database setup completed!', 'green');
    } else {
      log('⚠️  Database migration script not found. You may need to manually populate the database.', 'yellow');
    }
  } catch (error) {
    log('❌ Database setup failed:', 'red');
    log(error.message, 'red');
  }
}

function displaySummary() {
  log('\n🎉 Deployment Summary', 'green');
  log('=' .repeat(50), 'green');
  
  // Try to read deployment info
  const deploymentPath = path.join(__dirname, 'backend/deployments');
  
  if (fs.existsSync(deploymentPath)) {
    const files = fs.readdirSync(deploymentPath).filter(f => f.includes('hedera-testnet-complete'));
    
    if (files.length > 0) {
      const latestFile = files.sort().pop();
      const deploymentInfo = JSON.parse(fs.readFileSync(path.join(deploymentPath, latestFile), 'utf8'));
      
      log(`\n📋 Deployment Details:`, 'cyan');
      log(`   🌐 Network: ${deploymentInfo.network.name} (Chain ID: ${deploymentInfo.network.chainId})`, 'blue');
      log(`   👤 Deployer: ${deploymentInfo.deployer}`, 'blue');
      log(`   📅 Deployed: ${new Date(deploymentInfo.deployedAt).toLocaleString()}`, 'blue');
      log(`\n📄 Contract Addresses:`, 'cyan');
      log(`   🏭 Factory: ${deploymentInfo.factoryAddress}`, 'blue');
      log(`   💰 NGN Stablecoin: ${deploymentInfo.ngnStablecoin}`, 'blue');
      log(`   🔄 DEX: ${deploymentInfo.stockNGNDEX}`, 'blue');
      log(`   📊 Trading Manager: ${deploymentInfo.tradingPairManager}`, 'blue');
      log(`   🏢 Stock Tokens: ${deploymentInfo.totalTokens}`, 'blue');
      
      log(`\n🔗 Block Explorer:`, 'cyan');
      log(`   https://hashscan.io/testnet`, 'blue');
      
      log(`\n📁 Configuration Files:`, 'cyan');
      log(`   📄 Deployment: backend/deployments/${latestFile}`, 'blue');
      log(`   ⚙️  Frontend: front-end/src/config/hedera-contracts.json`, 'blue');
    }
  }
  
  log('\n🚀 Next Steps:', 'magenta');
  log('   1. Start the frontend: cd front-end && npm run dev', 'yellow');
  log('   2. Test the trading functionality', 'yellow');
  log('   3. Add liquidity to trading pairs', 'yellow');
  log('   4. Verify contracts on HashScan explorer', 'yellow');
}

async function main() {
  log('🌟 Hedera Testnet Deployment Script', 'bright');
  log('=' .repeat(50), 'bright');
  
  try {
    // Step 1: Check environment
    checkEnvironment();
    
    // Step 2: Check dependencies
    checkDependencies();
    
    // Step 3: Deploy contracts
    const deploymentSuccess = deployContracts();
    
    if (!deploymentSuccess) {
      log('\n❌ Deployment failed. Please check the errors above.', 'red');
      process.exit(1);
    }
    
    // Step 4: Update frontend configuration
    updateFrontendConfig();
    
    // Step 5: Setup database
    setupDatabase();
    
    // Step 6: Display summary
    displaySummary();
    
    log('\n✅ Deployment completed successfully!', 'green');
    
  } catch (error) {
    log('\n❌ Deployment failed with error:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Run the deployment
main().catch(console.error);

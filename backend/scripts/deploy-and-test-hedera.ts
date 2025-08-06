import dotenv from 'dotenv';
dotenv.config();

import { main as deployContracts } from './deploy-hedera-sdk.js';
import { runDeploymentTests } from './test-hedera-deployment.js';
import { Client, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';
import { execSync } from 'child_process';

// Color type for logging
type LogColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

// Utility functions
function log(message: string, color: LogColor = 'white'): void {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateEnvironment(): Promise<boolean> {
  log('🔍 Validating environment configuration...', 'cyan');
  
  const requiredEnvVars = [
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => 
    !process.env[varName] && !process.env[varName.replace('HEDERA_', 'OPERATOR_').replace('_ID', '_ID').replace('_KEY', '_PVKEY')]
  );
  
  if (missingVars.length > 0) {
    log(`❌ Missing required environment variables:`, 'red');
    missingVars.forEach(varName => {
      log(`   - ${varName}`, 'red');
    });
    log('\n💡 Please check your .env file and ensure all required variables are set.', 'yellow');
    log('   You can use .env.example as a template.', 'yellow');
    return false;
  }
  
  // Check if account ID format is valid
  const accountId = process.env.HEDERA_ACCOUNT_ID || process.env.OPERATOR_ID;
  if (!accountId || !accountId.match(/^0\.0\.\d+$/)) {
    log(`❌ Invalid Hedera account ID format: ${accountId}`, 'red');
    log('   Expected format: 0.0.xxxxxxx', 'yellow');
    return false;
  }
  
  log('✅ Environment validation passed!', 'green');
  return true;
}

async function checkAccountBalance(): Promise<boolean> {
  log('\n💰 Checking account balance...', 'cyan');
  
  try {
    const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || process.env.OPERATOR_ID || '');
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY || '');

    const client = Client.forTestnet().setOperator(operatorId, operatorKey);
    const balance = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client);
    
    log(`   Account: ${operatorId}`, 'blue');
    log(`   Balance: ${balance.hbars.toString()}`, 'blue');
    
    const minBalance = 100; // Minimum 100 HBAR recommended
    if (balance.hbars.toBigNumber().isLessThan(minBalance)) {
      log(`⚠️  Warning: Low HBAR balance. Recommended minimum: ${minBalance} HBAR`, 'yellow');
      log('   You may need more HBAR for deployment. Get testnet HBAR from:', 'yellow');
      log('   https://portal.hedera.com/register', 'yellow');
      return false;
    }
    
    log('✅ Account balance is sufficient!', 'green');
    return true;
  } catch (error: any) {
    log(`❌ Failed to check account balance: ${error.message}`, 'red');
    return false;
  }
}

async function compileContracts(): Promise<boolean> {
  log('\n🔨 Compiling smart contracts...', 'cyan');
  
  try {
    // Run Hardhat compilation
    execSync('npx hardhat compile', {
      cwd: `${__dirname}/..`,
      stdio: 'inherit'
    });
    
    log('✅ Contracts compiled successfully!', 'green');
    return true;
  } catch (error: any) {
    log(`❌ Contract compilation failed: ${error.message}`, 'red');
    return false;
  }
}

export async function deployAndTest(): Promise<boolean> {
  try {
    log('🚀 Starting complete Hedera deployment and testing process...', 'cyan');
    log('='.repeat(60), 'cyan');
    
    // Step 1: Validate environment
    const envValid = await validateEnvironment();
    if (!envValid) {
      throw new Error('Environment validation failed');
    }
    
    // Step 2: Check account balance
    const balanceOk = await checkAccountBalance();
    if (!balanceOk) {
      log('⚠️  Proceeding with deployment despite low balance warning...', 'yellow');
    }
    
    // Step 3: Compile contracts
    const compilationOk = await compileContracts();
    if (!compilationOk) {
      throw new Error('Contract compilation failed');
    }
    
    // Step 4: Deploy contracts
    log('\n🚀 Starting contract deployment...', 'cyan');
    const deploymentResult = await deployContracts();
    
    if (!deploymentResult) {
      throw new Error('Contract deployment failed');
    }
    
    log('\n✅ Contract deployment completed successfully!', 'green');
    
    // Step 5: Wait a bit for contracts to be available
    log('\n⏳ Waiting for contracts to be available for testing...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Step 6: Run tests
    log('\n🧪 Starting deployment verification tests...', 'cyan');
    const testsPass = await runDeploymentTests();
    
    if (!testsPass) {
      log('\n⚠️  Some tests failed, but deployment may still be functional.', 'yellow');
      log('   Check the test results for details.', 'yellow');
    }
    
    // Step 7: Summary
    log(`\n${'='.repeat(60)}`, 'cyan');
    log('📊 DEPLOYMENT SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    
    log('✅ Environment: Valid', 'green');
    log('✅ Compilation: Success', 'green');
    log('✅ Deployment: Success', 'green');
    log(`${testsPass ? '✅' : '⚠️ '} Tests: ${testsPass ? 'All Passed' : 'Some Failed'}`, testsPass ? 'green' : 'yellow');
    
    log('\n🎉 Hedera deployment process completed!', 'green');
    
    // Step 8: Next steps
    log('\n📋 NEXT STEPS:', 'cyan');
    log('1. Update your frontend configuration with the deployed contract addresses', 'blue');
    log('2. Test the frontend integration with the deployed contracts', 'blue');
    log('3. Verify contract functionality through the UI', 'blue');
    log('4. Consider running additional integration tests', 'blue');
    
    log('\n📄 Deployment files can be found in: backend/deployments/', 'blue');
    log('📄 Frontend config updated at: frontend/src/config/hedera-contracts.json', 'blue');
    
    return true;
    
  } catch (error: any) {
    log('\n❌ Deployment and testing process failed:', 'red');
    log(error.message, 'red');
    
    if (error.stack) {
      log('\nStack trace:', 'red');
      console.error(error.stack);
    }
    
    log('\n💡 Troubleshooting tips:', 'yellow');
    log('1. Check your .env file configuration', 'yellow');
    log('2. Ensure you have sufficient HBAR balance', 'yellow');
    log('3. Verify your Hedera account credentials', 'yellow');
    log('4. Check network connectivity to Hedera testnet', 'yellow');
    log('5. Review the error messages above for specific issues', 'yellow');
    
    return false;
  }
}

// Run deployment and testing if this file is executed directly
if (require.main === module) {
  deployAndTest().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

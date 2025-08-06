import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  AccountId,
  PrivateKey,
  ContractInfoQuery,
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId
} from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';

// Type definitions
interface DeploymentData {
  deployedAt: string;
  network: string;
  deployer: string;
  contracts: {
    ngnStablecoin?: {
      contractId: string;
      address: string;
    };
    factory?: {
      contractId: string;
      address: string;
    };
    stockNGNDEX?: {
      contractId: string;
      address: string;
    };
    tradingPairManager?: {
      contractId: string;
      address: string;
    };
    stockTokens?: Array<{
      symbol: string;
      name: string;
      contractId: string;
      address: string;
    }>;
  };
}

interface TestResults {
  contractInfo: Record<string, boolean>;
  functionality: Record<string, boolean>;
}

// Environment variables
const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || process.env.OPERATOR_ID || '');
const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY || '');

// Create Hedera client
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

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

async function loadDeploymentResults(): Promise<DeploymentData> {
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error('Deployments directory not found. Please run deployment first.');
  }
  
  // Find the most recent deployment file
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.startsWith('hedera-testnet-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (deploymentFiles.length === 0) {
    throw new Error('No deployment files found. Please run deployment first.');
  }
  
  const latestDeployment = deploymentFiles[0];
  const deploymentPath = path.join(deploymentsDir, latestDeployment);
  
  log(`📄 Loading deployment results from: ${latestDeployment}`, 'blue');
  
  return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function testContractInfo(contractId: string, contractName: string): Promise<boolean> {
  log(`\n🔍 Testing ${contractName} (${contractId})...`, 'cyan');
  
  try {
    const contractInfo = await new ContractInfoQuery()
      .setContractId(ContractId.fromString(contractId))
      .execute(client);
    
    log(`✅ Contract info retrieved successfully`, 'green');
    log(`   Contract ID: ${contractInfo.contractId}`, 'blue');
    log(`   Account ID: ${contractInfo.accountId}`, 'blue');
    log(`   Admin Key: ${contractInfo.adminKey ? 'Set' : 'Not set'}`, 'blue');
    log(`   Storage: ${contractInfo.storage} bytes`, 'blue');
    
    return true;
  } catch (error: any) {
    log(`❌ Failed to get contract info: ${error.message}`, 'red');
    return false;
  }
}

async function testContractCall(
  contractId: string,
  functionName: string,
  parameters: ContractFunctionParameters | null = null,
  contractName: string = ''
): Promise<any | null> {
  log(`\n📞 Testing ${contractName} ${functionName} call...`, 'cyan');
  
  try {
    let query = new ContractCallQuery()
      .setContractId(ContractId.fromString(contractId))
      .setGas(100000)
      .setFunction(functionName);

    if (parameters) {
      query = query.setFunctionParameters(parameters.encode());
    }
    
    const result = await query.execute(client);
    
    log(`✅ Contract call successful`, 'green');
    log(`   Gas used: ${result.gasUsed}`, 'blue');
    
    return result;
  } catch (error: any) {
    log(`❌ Contract call failed: ${error.message}`, 'red');
    return null;
  }
}

async function testNGNStablecoin(contractId: string): Promise<boolean> {
  log(`\n🪙 Testing NGN Stablecoin functionality...`, 'cyan');
  
  // Test name() function
  const nameResult = await testContractCall(contractId, 'name', null, 'NGN');
  
  // Test symbol() function
  const symbolResult = await testContractCall(contractId, 'symbol', null, 'NGN');
  
  // Test decimals() function
  const decimalsResult = await testContractCall(contractId, 'decimals', null, 'NGN');
  
  // Test totalSupply() function
  const totalSupplyResult = await testContractCall(contractId, 'totalSupply', null, 'NGN');
  
  return !!(nameResult && symbolResult && decimalsResult && totalSupplyResult);
}

async function testStockToken(contractId: string, symbol: string): Promise<boolean> {
  log(`\n📈 Testing ${symbol} Stock Token functionality...`, 'cyan');
  
  // Test name() function
  const nameResult = await testContractCall(contractId, 'name', null, symbol);
  
  // Test symbol() function
  const symbolResult = await testContractCall(contractId, 'symbol', null, symbol);
  
  // Test totalSupply() function
  const totalSupplyResult = await testContractCall(contractId, 'totalSupply', null, symbol);
  
  return !!(nameResult && symbolResult && totalSupplyResult);
}

async function testDEXContract(contractId: string): Promise<boolean> {
  log(`\n🔄 Testing StockNGNDEX functionality...`, 'cyan');
  
  // Test basic view functions
  const feeRateResult = await testContractCall(contractId, 'defaultFeeRate', null, 'DEX');
  
  return feeRateResult !== null;
}

export async function runDeploymentTests(): Promise<boolean> {
  try {
    log('🧪 Starting Hedera deployment verification tests...', 'cyan');
    
    // Load deployment results
    const deployment = await loadDeploymentResults();
    
    log(`\n📊 Testing deployment from: ${deployment.deployedAt}`, 'blue');
    log(`   Network: ${deployment.network}`, 'blue');
    log(`   Deployer: ${deployment.deployer}`, 'blue');
    
    let allTestsPassed = true;
    const testResults: TestResults = {
      contractInfo: {},
      functionality: {}
    };
    
    // Test contract info for all deployed contracts
    log('\n🔍 Testing contract information...', 'cyan');
    
    // Test NGN Stablecoin
    if (deployment.contracts.ngnStablecoin) {
      const contractId = deployment.contracts.ngnStablecoin.contractId;
      testResults.contractInfo.ngnStablecoin = await testContractInfo(contractId, 'NGN Stablecoin');
      allTestsPassed = allTestsPassed && testResults.contractInfo.ngnStablecoin;
      
      // Test functionality
      testResults.functionality.ngnStablecoin = await testNGNStablecoin(contractId);
      allTestsPassed = allTestsPassed && testResults.functionality.ngnStablecoin;
    }
    
    // Test Factory
    if (deployment.contracts.factory) {
      const contractId = deployment.contracts.factory.contractId;
      testResults.contractInfo.factory = await testContractInfo(contractId, 'Nigerian Stock Factory');
      allTestsPassed = allTestsPassed && testResults.contractInfo.factory;
    }
    
    // Test DEX
    if (deployment.contracts.stockNGNDEX) {
      const contractId = deployment.contracts.stockNGNDEX.contractId;
      testResults.contractInfo.stockNGNDEX = await testContractInfo(contractId, 'StockNGNDEX');
      allTestsPassed = allTestsPassed && testResults.contractInfo.stockNGNDEX;
      
      // Test functionality
      testResults.functionality.stockNGNDEX = await testDEXContract(contractId);
      allTestsPassed = allTestsPassed && testResults.functionality.stockNGNDEX;
    }
    
    // Test Trading Pair Manager
    if (deployment.contracts.tradingPairManager) {
      const contractId = deployment.contracts.tradingPairManager.contractId;
      testResults.contractInfo.tradingPairManager = await testContractInfo(contractId, 'Trading Pair Manager');
      allTestsPassed = allTestsPassed && testResults.contractInfo.tradingPairManager;
    }
    
    // Test Stock Tokens
    if (deployment.contracts.stockTokens && deployment.contracts.stockTokens.length > 0) {
      log('\n📈 Testing stock tokens...', 'cyan');
      
      for (const token of deployment.contracts.stockTokens) {
        const contractId = token.contractId;
        const symbol = token.symbol;
        
        testResults.contractInfo[symbol] = await testContractInfo(contractId, `${symbol} Token`);
        allTestsPassed = allTestsPassed && testResults.contractInfo[symbol];
        
        // Test functionality for first few tokens to avoid rate limits
        if (deployment.contracts.stockTokens.indexOf(token) < 3) {
          testResults.functionality[symbol] = await testStockToken(contractId, symbol);
          allTestsPassed = allTestsPassed && testResults.functionality[symbol];
        }
      }
    }
    
    // Summary
    log('\n📊 Test Results Summary:', 'cyan');
    log(`   Total contracts tested: ${Object.keys(testResults.contractInfo).length}`, 'blue');
    log(`   Contract info tests passed: ${Object.values(testResults.contractInfo).filter(Boolean).length}`, 'blue');
    log(`   Functionality tests passed: ${Object.values(testResults.functionality).filter(Boolean).length}`, 'blue');
    
    if (allTestsPassed) {
      log('\n🎉 All tests passed! Deployment is successful and functional.', 'green');
    } else {
      log('\n⚠️  Some tests failed. Please check the deployment.', 'yellow');
    }
    
    // Save test results
    const testResultsPath = path.join(__dirname, '../deployments', `test-results-${Date.now()}.json`);
    fs.writeFileSync(testResultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      deployment: deployment.deployedAt,
      allTestsPassed,
      testResults
    }, null, 2));
    
    log(`\n📄 Test results saved to: ${path.basename(testResultsPath)}`, 'blue');
    
    return allTestsPassed;
    
  } catch (error: any) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDeploymentTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

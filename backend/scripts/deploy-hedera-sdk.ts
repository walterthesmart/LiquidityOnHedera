import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractInfoQuery,
  Hbar,
  FileId,
  ContractId,
  AccountBalanceQuery
} from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import {
  GAS_LIMITS,
  TRANSACTION_FEES
} from './utils/hedera-gas-config.js';

// Type definitions
interface StockData {
  symbol: string;
  name: string;
  companyName: string;
  maxSupply: string;
}

interface ContractArtifact {
  bytecode: string;
  abi: any[];
}

interface DeploymentResult {
  contractId: ContractId;
  contractAddress: string;
}

interface StablecoinConfig {
  name: string;
  symbol: string;
  maxSupply: string;
  mintingCap: string;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  transfersEnabled: boolean;
}

interface DEXConfig {
  defaultFeeRate: number;
  maxPriceImpact: number;
  minLiquidity: string;
  swapDeadline: number;
  emergencyMode: boolean;
}

interface DeploymentResultData {
  network: string;
  deployer: string;
  deployedAt: string;
  contracts: {
    ngnStablecoin?: {
      contractId: string;
      address: string;
      config: StablecoinConfig;
    };
    factory?: {
      contractId: string;
      address: string;
    };
    stockNGNDEX?: {
      contractId: string;
      address: string;
      config: DEXConfig;
    };
    tradingPairManager?: {
      contractId: string;
      address: string;
    };
    stockTokens?: Array<{
      symbol: string;
      name: string;
      companyName: string;
      contractId: string;
      address: string;
      maxSupply: string;
    }>;
  };
  totalTokens?: number;
}

// Environment variables
const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || process.env.OPERATOR_ID || '');
const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY || '');

// Create Hedera client with optimized settings
const client = Client.forTestnet()
  .setOperator(operatorId, operatorKey)
  .setDefaultMaxTransactionFee(TRANSACTION_FEES.CONTRACT_CREATE)
  .setDefaultMaxQueryPayment(new Hbar(1));

// Nigerian stocks data
const NIGERIAN_STOCKS: StockData[] = [
  { symbol: 'DANGCEM', name: 'Dangote Cement', companyName: 'Dangote Cement Plc', maxSupply: '1000000' },
  { symbol: 'GTCO', name: 'Guaranty Trust Bank', companyName: 'Guaranty Trust Holding Company Plc', maxSupply: '2000000' },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa', companyName: 'Airtel Africa Plc', maxSupply: '1500000' },
  { symbol: 'BUACEMENT', name: 'BUA Cement', companyName: 'BUA Cement Plc', maxSupply: '800000' },
  { symbol: 'SEPLAT', name: 'Seplat Energy', companyName: 'Seplat Energy Plc', maxSupply: '600000' }
];

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

async function uploadContractBytecode(contractName: string, bytecode: string, operatorKey: PrivateKey): Promise<FileId> {
  log(`📤 Uploading ${contractName} bytecode to Hedera File Service...`, 'cyan');
  
  // Create file to store bytecode
  const fileCreateTx = new FileCreateTransaction()
    .setKeys([operatorKey.publicKey])
    .setMaxTransactionFee(TRANSACTION_FEES.FILE_CREATE);
    
  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  const bytecodeFileId = fileCreateRx.fileId;
  
  if (!bytecodeFileId) {
    throw new Error('Failed to create bytecode file');
  }
  
  log(`📁 Bytecode file created: ${bytecodeFileId}`, 'blue');
  
  // Use utility function to check if chunking is needed
  const bytecodeBuffer = Buffer.from(bytecode.replace('0x', ''), 'hex');
  
  if (bytecodeBuffer.length <= 4096) {
    // Small bytecode, append in one transaction
    const fileAppendTx = new FileAppendTransaction()
      .setFileId(bytecodeFileId)
      .setContents(bytecodeBuffer)
      .setMaxTransactionFee(TRANSACTION_FEES.FILE_APPEND);
      
    const fileAppendSign = await fileAppendTx.sign(operatorKey);
    const fileAppendSubmit = await fileAppendSign.execute(client);
    const fileAppendRx = await fileAppendSubmit.getReceipt(client);
    
    log(`✅ Bytecode uploaded: ${fileAppendRx.status}`, 'green');
  } else {
    // Large bytecode, chunk it
    const chunkSize = 4096;
    const totalChunks = Math.ceil(bytecodeBuffer.length / chunkSize);
    log(`📦 Large bytecode detected (${bytecodeBuffer.length} bytes), chunking into ${totalChunks} parts...`, 'yellow');
    
    for (let i = 0; i < bytecodeBuffer.length; i += chunkSize) {
      const chunk = bytecodeBuffer.subarray(i, i + chunkSize);
      const chunkNum = Math.floor(i / chunkSize) + 1;
      
      log(`   📤 Uploading chunk ${chunkNum}/${totalChunks}...`, 'blue');
      
      const fileAppendTx = new FileAppendTransaction()
        .setFileId(bytecodeFileId)
        .setContents(chunk)
        .setMaxTransactionFee(TRANSACTION_FEES.FILE_APPEND);
        
      const fileAppendSign = await fileAppendTx.sign(operatorKey);
      const fileAppendSubmit = await fileAppendSign.execute(client);
      const fileAppendRx = await fileAppendSubmit.getReceipt(client);
      
      if (fileAppendRx.status.toString() !== 'SUCCESS') {
        throw new Error(`Failed to upload chunk ${chunkNum}: ${fileAppendRx.status}`);
      }
    }
    
    log('✅ All chunks uploaded successfully', 'green');
  }
  
  return bytecodeFileId;
}

type ContractType = 'SIMPLE_CONTRACT' | 'TOKEN_CONTRACT' | 'COMPLEX_CONTRACT' | 'DEX_CONTRACT' | 'FACTORY_CONTRACT';

async function deployContract(
  contractName: string, 
  bytecodeFileId: FileId, 
  constructorParams: ContractFunctionParameters | null = null, 
  contractType: ContractType = 'SIMPLE_CONTRACT'
): Promise<DeploymentResult> {
  log(`🚀 Deploying ${contractName}...`, 'cyan');
  
  const gasLimit = GAS_LIMITS[contractType] || GAS_LIMITS.SIMPLE_CONTRACT;
  const maxFee = TRANSACTION_FEES.CONTRACT_CREATE;
  
  log(`   ⛽ Gas limit: ${gasLimit.toLocaleString()}`, 'blue');
  log(`   💰 Max fee: ${maxFee.toString()}`, 'blue');
  
  let contractCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(gasLimit)
    .setMaxTransactionFee(maxFee);
    
  if (constructorParams) {
    contractCreateTx = contractCreateTx.setConstructorParameters(constructorParams);
  }
  
  try {
    const contractCreateSubmit = await contractCreateTx.execute(client);
    const contractCreateRx = await contractCreateSubmit.getReceipt(client);
    const contractId = contractCreateRx.contractId;
    
    if (!contractId) {
      throw new Error('Contract deployment failed - no contract ID returned');
    }
    
    const contractAddress = contractId.toSolidityAddress();
    
    log(`✅ ${contractName} deployed!`, 'green');
    log(`   Contract ID: ${contractId}`, 'blue');
    log(`   Solidity Address: 0x${contractAddress}`, 'blue');
    
    // Verify deployment by querying contract info
    try {
      const contractInfo = await new ContractInfoQuery()
        .setContractId(contractId)
        .execute(client);
      
      log(`   📊 Contract size: ${contractInfo.contractMemo || 'N/A'}`, 'blue');
    } catch (infoError: any) {
      log(`   ⚠️  Could not query contract info: ${infoError.message}`, 'yellow');
    }
    
    return { contractId, contractAddress };
  } catch (error: any) {
    log(`❌ Failed to deploy ${contractName}: ${error.message}`, 'red');
    
    // Provide helpful error messages for common issues
    if (error.message.includes('INSUFFICIENT_GAS')) {
      log(`   💡 Try increasing gas limit (current: ${gasLimit})`, 'yellow');
    } else if (error.message.includes('INSUFFICIENT_PAYER_BALANCE')) {
      log('   💡 Insufficient HBAR balance for deployment', 'yellow');
    } else if (error.message.includes('CONTRACT_BYTECODE_EMPTY')) {
      log('   💡 Contract bytecode is empty or invalid', 'yellow');
    }
    
    throw error;
  }
}

async function readCompiledContract(contractName: string): Promise<ContractArtifact> {
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

async function updateFrontendConfig(deploymentResult: DeploymentResultData): Promise<void> {
  log('\n🔧 Updating frontend configuration...', 'cyan');

  const frontendConfigPath = path.join(__dirname, '../../frontend/src/config/hedera-contracts.json');
  const frontendConfigDir = path.dirname(frontendConfigPath);

  // Ensure frontend config directory exists
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  const frontendConfig = {
    network: 'hedera-testnet',
    lastUpdated: deploymentResult.deployedAt,
    contracts: {
      NGNStablecoin: deploymentResult.contracts.ngnStablecoin ? {
        address: deploymentResult.contracts.ngnStablecoin.address,
        contractId: deploymentResult.contracts.ngnStablecoin.contractId
      } : undefined,
      NigerianStockFactory: deploymentResult.contracts.factory ? {
        address: deploymentResult.contracts.factory.address,
        contractId: deploymentResult.contracts.factory.contractId
      } : undefined,
      StockNGNDEX: deploymentResult.contracts.stockNGNDEX ? {
        address: deploymentResult.contracts.stockNGNDEX.address,
        contractId: deploymentResult.contracts.stockNGNDEX.contractId
      } : undefined,
      TradingPairManager: deploymentResult.contracts.tradingPairManager ? {
        address: deploymentResult.contracts.tradingPairManager.address,
        contractId: deploymentResult.contracts.tradingPairManager.contractId
      } : undefined
    },
    stockTokens: deploymentResult.contracts.stockTokens?.reduce((acc: any, token) => {
      acc[token.symbol] = {
        address: token.address,
        contractId: token.contractId,
        name: token.name,
        companyName: token.companyName,
        maxSupply: token.maxSupply
      };
      return acc;
    }, {}) || {}
  };

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  log(`✅ Frontend configuration updated: ${frontendConfigPath}`, 'green');
}

export async function main(): Promise<DeploymentResultData | null> {
  try {
    log('🚀 Starting Hedera SDK-based deployment of Nigerian Stock Trading System...', 'cyan');
    log(`📝 Deploying with account: ${operatorId}`, 'blue');

    // Check account balance
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client);
    log(`💰 Account balance: ${accountBalance.hbars.toString()}`, 'blue');

    if (accountBalance.hbars.toBigNumber().isLessThan(50)) {
      log('⚠️  Warning: Low HBAR balance. You may need more HBAR for deployment.', 'yellow');
    }

    const deploymentResult: DeploymentResultData = {
      network: 'hedera-testnet',
      deployer: operatorId.toString(),
      deployedAt: new Date().toISOString(),
      contracts: {}
    };

    // Step 1: Deploy NGN Stablecoin
    log('\n📦 Step 1: Deploying NGN Stablecoin...', 'cyan');
    const ngnContract = await readCompiledContract('NGNStablecoin');
    const ngnBytecodeFileId = await uploadContractBytecode('NGNStablecoin', ngnContract.bytecode, operatorKey);

    // Constructor parameters for NGN Stablecoin
    const stablecoinConfig: StablecoinConfig = {
      name: 'Nigerian Naira Stablecoin',
      symbol: 'NGN',
      maxSupply: '1000000000000000000000000000', // 1 billion NGN (18 decimals)
      mintingCap: '10000000000000000000000000', // 10 million NGN daily cap
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true
    };

    const ngnConstructorParams = new ContractFunctionParameters()
      .addAddress(operatorId.toSolidityAddress()) // deployer as initial admin
      .addString(stablecoinConfig.name)
      .addString(stablecoinConfig.symbol)
      .addUint256(stablecoinConfig.maxSupply)
      .addUint256(stablecoinConfig.mintingCap)
      .addBool(stablecoinConfig.mintingEnabled)
      .addBool(stablecoinConfig.burningEnabled)
      .addBool(stablecoinConfig.transfersEnabled);

    const ngnDeployment = await deployContract('NGNStablecoin', ngnBytecodeFileId, ngnConstructorParams, 'TOKEN_CONTRACT');
    deploymentResult.contracts.ngnStablecoin = {
      contractId: ngnDeployment.contractId.toString(),
      address: `0x${ngnDeployment.contractAddress}`,
      config: stablecoinConfig
    };

    // Step 2: Deploy NigerianStockFactory
    log('\n📦 Step 2: Deploying NigerianStockFactory...', 'cyan');
    const factoryContract = await readCompiledContract('NigerianStockFactory');
    const factoryBytecodeFileId = await uploadContractBytecode('NigerianStockFactory', factoryContract.bytecode, operatorKey);
    const factoryDeployment = await deployContract('NigerianStockFactory', factoryBytecodeFileId, null, 'FACTORY_CONTRACT');

    deploymentResult.contracts.factory = {
      contractId: factoryDeployment.contractId.toString(),
      address: `0x${factoryDeployment.contractAddress}`
    };

    // Step 3: Deploy StockNGNDEX
    log('\n📦 Step 3: Deploying StockNGNDEX...', 'cyan');
    const dexContract = await readCompiledContract('StockNGNDEX');
    const dexBytecodeFileId = await uploadContractBytecode('StockNGNDEX', dexContract.bytecode, operatorKey);

    const dexConfig: DEXConfig = {
      defaultFeeRate: 30, // 0.3%
      maxPriceImpact: 1000, // 10%
      minLiquidity: '1000000000000000000000', // 1000 NGN minimum (18 decimals)
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false
    };

    const dexConstructorParams = new ContractFunctionParameters()
      .addAddress(ngnDeployment.contractAddress) // NGN stablecoin address
      .addUint256(dexConfig.defaultFeeRate)
      .addUint256(dexConfig.maxPriceImpact)
      .addUint256(dexConfig.minLiquidity)
      .addUint256(dexConfig.swapDeadline)
      .addBool(dexConfig.emergencyMode);

    const dexDeployment = await deployContract('StockNGNDEX', dexBytecodeFileId, dexConstructorParams, 'DEX_CONTRACT');
    deploymentResult.contracts.stockNGNDEX = {
      contractId: dexDeployment.contractId.toString(),
      address: `0x${dexDeployment.contractAddress}`,
      config: dexConfig
    };

    // Step 4: Deploy TradingPairManager
    log('\n📦 Step 4: Deploying TradingPairManager...', 'cyan');
    const pairManagerContract = await readCompiledContract('TradingPairManager');
    const pairManagerBytecodeFileId = await uploadContractBytecode('TradingPairManager', pairManagerContract.bytecode, operatorKey);

    const pairManagerConstructorParams = new ContractFunctionParameters()
      .addAddress(dexDeployment.contractAddress) // StockNGNDEX address
      .addAddress(ngnDeployment.contractAddress) // NGN stablecoin address
      .addAddress(factoryDeployment.contractAddress); // Factory address

    const pairManagerDeployment = await deployContract('TradingPairManager', pairManagerBytecodeFileId, pairManagerConstructorParams, 'COMPLEX_CONTRACT');
    deploymentResult.contracts.tradingPairManager = {
      contractId: pairManagerDeployment.contractId.toString(),
      address: `0x${pairManagerDeployment.contractAddress}`
    };

    log('\n🎉 Core contracts deployed successfully!', 'green');

    // Step 5: Deploy Stock Tokens
    log('\n📦 Step 5: Deploying Nigerian Stock Tokens...', 'cyan');
    const stockTokenContract = await readCompiledContract('NigerianStockToken');
    const stockTokenBytecodeFileId = await uploadContractBytecode('NigerianStockToken', stockTokenContract.bytecode, operatorKey);

    deploymentResult.contracts.stockTokens = [];

    for (let i = 0; i < NIGERIAN_STOCKS.length; i++) {
      const stock = NIGERIAN_STOCKS[i];
      log(`\n   📈 Deploying ${stock.symbol} (${stock.name})...`, 'yellow');

      const stockConstructorParams = new ContractFunctionParameters()
        .addString(stock.name)
        .addString(stock.symbol)
        .addString(stock.companyName)
        .addUint256(`${stock.maxSupply}000000000000000000`) // Convert to 18 decimals
        .addAddress(operatorId.toSolidityAddress()); // Initial owner

      const stockDeployment = await deployContract(`${stock.symbol}Token`, stockTokenBytecodeFileId, stockConstructorParams, 'TOKEN_CONTRACT');

      deploymentResult.contracts.stockTokens.push({
        symbol: stock.symbol,
        name: stock.name,
        companyName: stock.companyName,
        contractId: stockDeployment.contractId.toString(),
        address: `0x${stockDeployment.contractAddress}`,
        maxSupply: `${stock.maxSupply}000000000000000000`
      });

      log(`   ✅ ${stock.symbol} deployed: ${stockDeployment.contractId}`, 'green');
    }

    deploymentResult.totalTokens = NIGERIAN_STOCKS.length;

    // Save deployment results
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `hedera-testnet-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));

    // Update frontend configuration
    await updateFrontendConfig(deploymentResult);

    log(`\n📄 Deployment results saved to: ${deploymentFile}`, 'blue');
    log('\n✅ All contracts deployed successfully!', 'green');
    log('\n📊 Summary:', 'cyan');
    log(`   • NGN Stablecoin: ${deploymentResult.contracts.ngnStablecoin?.contractId}`, 'blue');
    log(`   • Stock Factory: ${deploymentResult.contracts.factory?.contractId}`, 'blue');
    log(`   • StockNGNDEX: ${deploymentResult.contracts.stockNGNDEX?.contractId}`, 'blue');
    log(`   • Trading Pair Manager: ${deploymentResult.contracts.tradingPairManager?.contractId}`, 'blue');
    log(`   • Stock Tokens: ${deploymentResult.totalTokens} deployed`, 'blue');

    return deploymentResult;

  } catch (error: any) {
    log(`\n❌ Deployment failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result ? 0 : 1);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

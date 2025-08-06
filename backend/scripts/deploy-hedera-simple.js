require('dotenv').config();

const {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractInfoQuery,
  Hbar,
  AccountBalanceQuery
} = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');

// Environment variables
const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || process.env.OPERATOR_PVKEY);

// Create Hedera client
const client = Client.forTestnet()
  .setOperator(operatorId, operatorKey)
  .setDefaultMaxTransactionFee(new Hbar(30))
  .setDefaultMaxQueryPayment(new Hbar(1));

// Nigerian stocks data
const NIGERIAN_STOCKS = [
  { symbol: 'DANGCEM', name: 'Dangote Cement', companyName: 'Dangote Cement Plc', maxSupply: '1000000' },
  { symbol: 'GTCO', name: 'Guaranty Trust Bank', companyName: 'Guaranty Trust Holding Company Plc', maxSupply: '2000000' },
  { symbol: 'AIRTELAFRI', name: 'Airtel Africa', companyName: 'Airtel Africa Plc', maxSupply: '1500000' },
  { symbol: 'BUACEMENT', name: 'BUA Cement', companyName: 'BUA Cement Plc', maxSupply: '800000' },
  { symbol: 'SEPLAT', name: 'Seplat Energy', companyName: 'Seplat Energy Plc', maxSupply: '600000' }
];

// Gas limits
const GAS_LIMITS = {
  SIMPLE_CONTRACT: 2000000,
  TOKEN_CONTRACT: 3500000,
  DEX_CONTRACT: 5000000,
  FACTORY_CONTRACT: 3000000,
  COMPLEX_CONTRACT: 4000000
};

// Utility functions
function log(message, color = 'white') {
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

async function uploadContractBytecode(contractName, bytecode, operatorKey) {
  log(`📤 Uploading ${contractName} bytecode to Hedera File Service...`, 'cyan');
  
  // Create file to store bytecode
  const fileCreateTx = new FileCreateTransaction()
    .setKeys([operatorKey.publicKey])
    .setMaxTransactionFee(new Hbar(5));
    
  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  const bytecodeFileId = fileCreateRx.fileId;
  
  log(`📁 Bytecode file created: ${bytecodeFileId}`, 'blue');
  
  // Upload bytecode
  const bytecodeBuffer = Buffer.from(bytecode.replace('0x', ''), 'hex');
  
  if (bytecodeBuffer.length <= 4096) {
    // Small bytecode, append in one transaction
    const fileAppendTx = new FileAppendTransaction()
      .setFileId(bytecodeFileId)
      .setContents(bytecodeBuffer)
      .setMaxTransactionFee(new Hbar(5));
      
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
        .setMaxTransactionFee(new Hbar(5));
        
      const fileAppendSign = await fileAppendTx.sign(operatorKey);
      const fileAppendSubmit = await fileAppendSign.execute(client);
      const fileAppendRx = await fileAppendSubmit.getReceipt(client);
      
      if (fileAppendRx.status.toString() !== 'SUCCESS') {
        throw new Error(`Failed to upload chunk ${chunkNum}: ${fileAppendRx.status}`);
      }
    }
    
    log(`✅ All chunks uploaded successfully`, 'green');
  }
  
  return bytecodeFileId;
}

async function deployContract(contractName, bytecodeFileId, constructorParams = null, contractType = 'SIMPLE_CONTRACT') {
  log(`🚀 Deploying ${contractName}...`, 'cyan');
  
  const gasLimit = GAS_LIMITS[contractType] || GAS_LIMITS.SIMPLE_CONTRACT;
  const maxFee = new Hbar(30);
  
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
    const contractAddress = contractId.toSolidityAddress();
    
    log(`✅ ${contractName} deployed!`, 'green');
    log(`   Contract ID: ${contractId}`, 'blue');
    log(`   Solidity Address: 0x${contractAddress}`, 'blue');
    
    return { contractId, contractAddress };
  } catch (error) {
    log(`❌ Failed to deploy ${contractName}: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🚀 Starting Hedera deployment of Nigerian Stock Trading System...', 'cyan');
    log(`📝 Deploying with account: ${operatorId}`, 'blue');
    
    // Check account balance
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client);
    log(`💰 Account balance: ${accountBalance.hbars.toString()}`, 'blue');
    
    if (accountBalance.hbars.toBigNumber().isLessThan(50)) {
      log('⚠️  Warning: Low HBAR balance. You may need more HBAR for deployment.', 'yellow');
    }
    
    const deploymentResult = {
      network: 'hedera-testnet',
      deployer: operatorId.toString(),
      deployedAt: new Date().toISOString(),
      contracts: {}
    };
    
    // Step 1: Deploy NGN Stablecoin
    log('\n📦 Step 1: Deploying NGN Stablecoin...', 'cyan');
    const ngnContract = await readCompiledContract('NGNStablecoin');
    const ngnBytecodeFileId = await uploadContractBytecode('NGNStablecoin', ngnContract.bytecode, operatorKey);
    
    const stablecoinConfig = {
      name: 'Nigerian Naira Stablecoin',
      symbol: 'NGN',
      maxSupply: '1000000000000000000000000000', // 1 billion NGN (18 decimals)
      mintingCap: '10000000000000000000000000', // 10 million NGN daily cap
      mintingEnabled: true,
      burningEnabled: true,
      transfersEnabled: true
    };
    
    const ngnConstructorParams = new ContractFunctionParameters()
      .addAddress(operatorId.toSolidityAddress())
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
    
    const dexConfig = {
      defaultFeeRate: 30, // 0.3%
      maxPriceImpact: 1000, // 10%
      minLiquidity: '1000000000000000000000', // 1000 NGN minimum (18 decimals)
      swapDeadline: 1800, // 30 minutes
      emergencyMode: false
    };
    
    const dexConstructorParams = new ContractFunctionParameters()
      .addAddress(ngnDeployment.contractAddress)
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
    
    log('\n🎉 Core contracts deployed successfully!', 'green');
    
    // Save deployment results
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `hedera-testnet-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
    
    log(`\n📄 Deployment results saved to: ${deploymentFile}`, 'blue');
    log('\n✅ Deployment completed successfully!', 'green');
    log(`\n📊 Summary:`, 'cyan');
    log(`   • NGN Stablecoin: ${deploymentResult.contracts.ngnStablecoin.contractId}`, 'blue');
    log(`   • Stock Factory: ${deploymentResult.contracts.factory.contractId}`, 'blue');
    log(`   • StockNGNDEX: ${deploymentResult.contracts.stockNGNDEX.contractId}`, 'blue');
    
    return deploymentResult;
    
  } catch (error) {
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

module.exports = { main };

import { Hbar } from '@hashgraph/sdk';

/**
 * Optimized gas configurations for Hedera deployment
 * Based on testing and Hedera network requirements
 */

// Contract type definitions
export type ContractType = 'SIMPLE_CONTRACT' | 'COMPLEX_CONTRACT' | 'TOKEN_CONTRACT' | 'DEX_CONTRACT' | 'FACTORY_CONTRACT';

// Gas limits for different contract types (in gas units)
export const GAS_LIMITS: Record<ContractType | 'MAX_GAS_LIMIT', number> = {
  // Simple contracts (basic tokens, simple logic)
  SIMPLE_CONTRACT: 2000000,
  
  // Complex contracts (DEX, advanced logic)
  COMPLEX_CONTRACT: 4000000,
  
  // Token contracts (ERC20, custom tokens)
  TOKEN_CONTRACT: 3500000,
  
  // DEX contracts (swapping, liquidity)
  DEX_CONTRACT: 5000000,
  
  // Factory contracts (token creation)
  FACTORY_CONTRACT: 3000000,
  
  // Maximum safe gas limit for Hedera
  MAX_GAS_LIMIT: 15000000
};

// Transaction fee types
export type TransactionFeeType = 'CONTRACT_CREATE' | 'FILE_CREATE' | 'FILE_APPEND' | 'CONTRACT_EXECUTE' | 'QUERY_PAYMENT';

// Transaction fees in HBAR for different operations
export const TRANSACTION_FEES: Record<TransactionFeeType, Hbar> = {
  // Contract deployment
  CONTRACT_CREATE: new Hbar(30),
  
  // File operations
  FILE_CREATE: new Hbar(5),
  FILE_APPEND: new Hbar(5),
  
  // Contract execution
  CONTRACT_EXECUTE: new Hbar(10),
  
  // Query operations
  QUERY_PAYMENT: new Hbar(1)
};

// Hedera-specific configuration
export const HEDERA_CONFIG = {
  // File chunk size for large bytecode (4KB is optimal)
  CHUNK_SIZE: 4096,
  
  // Maximum retries for failed transactions
  MAX_RETRIES: 3,
  
  // Timeout for deployment operations (5 minutes)
  DEPLOYMENT_TIMEOUT: 300000,
  
  // Minimum gas price for Hedera (370 gwei)
  MIN_GAS_PRICE: 370000000000,
  
  // Block gas limit
  BLOCK_GAS_LIMIT: 15000000
} as const;

/**
 * Get gas limit for a specific contract type
 * @param contractType - Type of contract (SIMPLE_CONTRACT, TOKEN_CONTRACT, etc.)
 * @returns Gas limit
 */
export function getGasLimit(contractType: ContractType): number {
  return GAS_LIMITS[contractType] || GAS_LIMITS.SIMPLE_CONTRACT;
}

/**
 * Get transaction fee for a specific operation
 * @param operationType - Type of operation (CONTRACT_CREATE, FILE_CREATE, etc.)
 * @returns Transaction fee
 */
export function getTransactionFee(operationType: TransactionFeeType): Hbar {
  return TRANSACTION_FEES[operationType] || TRANSACTION_FEES.CONTRACT_CREATE;
}

/**
 * Get optimized gas settings for Hardhat deployment
 * @returns Gas configuration for Hardhat
 */
export function getHardhatGasConfig(): {
  gasPrice: number;
  gas: number;
  blockGasLimit: number;
  allowUnlimitedContractSize: boolean;
  timeout: number;
} {
  return {
    gasPrice: HEDERA_CONFIG.MIN_GAS_PRICE,
    gas: HEDERA_CONFIG.BLOCK_GAS_LIMIT,
    blockGasLimit: HEDERA_CONFIG.BLOCK_GAS_LIMIT,
    allowUnlimitedContractSize: true,
    timeout: HEDERA_CONFIG.DEPLOYMENT_TIMEOUT
  };
}

/**
 * Estimate gas for contract deployment based on bytecode size
 * @param bytecode - Contract bytecode
 * @param contractType - Type of contract
 * @returns Estimated gas limit
 */
export function estimateGasForDeployment(bytecode: string, contractType: ContractType = 'SIMPLE_CONTRACT'): number {
  const baseGas = getGasLimit(contractType);
  const bytecodeSize = bytecode.replace('0x', '').length / 2; // Convert hex to bytes
  
  // Add extra gas based on bytecode size (rough estimation)
  const extraGas = Math.floor(bytecodeSize * 10); // 10 gas per byte
  
  const totalGas = baseGas + extraGas;
  
  // Ensure we don't exceed maximum gas limit
  return Math.min(totalGas, GAS_LIMITS.MAX_GAS_LIMIT);
}

/**
 * Check if bytecode needs to be chunked for Hedera file service
 * @param bytecode - Contract bytecode
 * @returns True if chunking is needed
 */
export function needsChunking(bytecode: string): boolean {
  const bytecodeBuffer = Buffer.from(bytecode.replace('0x', ''), 'hex');
  return bytecodeBuffer.length > HEDERA_CONFIG.CHUNK_SIZE;
}

/**
 * Calculate number of chunks needed for bytecode
 * @param bytecode - Contract bytecode
 * @returns Number of chunks
 */
export function calculateChunks(bytecode: string): number {
  const bytecodeBuffer = Buffer.from(bytecode.replace('0x', ''), 'hex');
  return Math.ceil(bytecodeBuffer.length / HEDERA_CONFIG.CHUNK_SIZE);
}

/**
 * Get retry configuration for failed transactions
 * @returns Retry configuration
 */
export function getRetryConfig(): {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
} {
  return {
    maxRetries: HEDERA_CONFIG.MAX_RETRIES,
    retryDelay: 2000, // 2 seconds between retries
    backoffMultiplier: 1.5 // Exponential backoff
  };
}

/**
 * Validate gas configuration
 * @param gasLimit - Gas limit to validate
 * @throws Error if gas limit is invalid
 */
export function validateGasLimit(gasLimit: number): void {
  if (gasLimit <= 0) {
    throw new Error('Gas limit must be positive');
  }

  if (gasLimit > GAS_LIMITS.MAX_GAS_LIMIT) {
    throw new Error(`Gas limit ${gasLimit} exceeds maximum ${GAS_LIMITS.MAX_GAS_LIMIT}`);
  }
}

/**
 * Get recommended gas settings for a specific contract
 * @param contractName - Name of the contract
 * @param bytecode - Contract bytecode
 * @returns Recommended gas settings
 */
export function getRecommendedGasSettings(contractName: string, bytecode: string): {
  contractType: ContractType;
  gasLimit: number;
  transactionFee: Hbar;
  needsChunking: boolean;
  chunks: number;
} {
  let contractType: ContractType = 'SIMPLE_CONTRACT';
  
  // Determine contract type based on name
  if (contractName.toLowerCase().includes('token')) {
    contractType = 'TOKEN_CONTRACT';
  } else if (contractName.toLowerCase().includes('dex') || contractName.toLowerCase().includes('swap')) {
    contractType = 'DEX_CONTRACT';
  } else if (contractName.toLowerCase().includes('factory')) {
    contractType = 'FACTORY_CONTRACT';
  } else if (contractName.toLowerCase().includes('manager') || contractName.toLowerCase().includes('pair')) {
    contractType = 'COMPLEX_CONTRACT';
  }
  
  const gasLimit = estimateGasForDeployment(bytecode, contractType);
  const transactionFee = getTransactionFee('CONTRACT_CREATE');
  
  return {
    contractType,
    gasLimit,
    transactionFee,
    needsChunking: needsChunking(bytecode),
    chunks: calculateChunks(bytecode)
  };
}

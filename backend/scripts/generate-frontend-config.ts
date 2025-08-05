import hre from "hardhat";
// @ts-ignore - Hardhat runtime environment extension
const ethers = hre.ethers;
import * as fs from "fs";
import * as path from "path";

/**
 * Generate frontend configuration files with deployed contract addresses
 */
async function generateFrontendConfig() {
  console.log("🔧 Generating frontend configuration files...");
  
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  // Read deployment file
  const deploymentFile = path.join(__dirname, `../deployments/nigerian-stocks-${chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please deploy contracts first using: npm run deploy:all-stocks");
    return;
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  // Generate contract addresses configuration
  const contractAddresses = {
    [chainId]: {
      factoryAddress: deploymentData.factoryAddress,
      tokens: deploymentData.tokens.reduce((acc: any, token: any) => {
        acc[token.symbol] = token.address;
        return acc;
      }, {}),
    },
  };
  
  // Update bitfinity-config.ts
  const frontendConfigPath = path.join(__dirname, "../../front-end/src/lib/bitfinity-config.ts");
  
  if (fs.existsSync(frontendConfigPath)) {
    let configContent = fs.readFileSync(frontendConfigPath, 'utf8');
    
    // Replace the CONTRACT_ADDRESSES export
    const contractAddressesRegex = /export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = \{[\s\S]*?\};/;
    const newContractAddresses = `export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = ${JSON.stringify(contractAddresses, null, 2)};`;
    
    if (contractAddressesRegex.test(configContent)) {
      configContent = configContent.replace(contractAddressesRegex, newContractAddresses);
    } else {
      console.warn("⚠️  Could not find CONTRACT_ADDRESSES in bitfinity-config.ts");
    }
    
    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("✅ Updated bitfinity-config.ts with contract addresses");
  }
  
  // Generate TypeScript types for contracts
  const contractTypesPath = path.join(__dirname, "../../front-end/src/types/contracts.ts");
  const contractTypes = `// Auto-generated contract types
// Generated on: ${new Date().toISOString()}
// Network: ${network.name} (Chain ID: ${chainId})

export interface DeployedContract {
  address: string;
  symbol: string;
  name: string;
  companyName: string;
  maxSupply: string;
}

export interface ContractDeployment {
  network: {
    name: string;
    chainId: string;
  };
  deployer: string;
  factoryAddress: string;
  deployedAt: string;
  totalTokens: number;
  tokens: DeployedContract[];
}

// Deployed contracts for ${network.name}
export const DEPLOYED_CONTRACTS: ContractDeployment = ${JSON.stringify(deploymentData, null, 2)};

// Contract addresses by symbol
export const TOKEN_ADDRESSES: Record<string, string> = {
${deploymentData.tokens.map((token: any) => `  "${token.symbol}": "${token.address}",`).join('\n')}
};

// Factory contract address
export const FACTORY_ADDRESS = "${deploymentData.factoryAddress}";

// Network information
export const DEPLOYMENT_NETWORK = {
  name: "${network.name}",
  chainId: "${chainId}",
};
`;
  
  fs.writeFileSync(contractTypesPath, contractTypes);
  console.log("✅ Generated contract types at:", contractTypesPath);
  
  // Generate environment variables for frontend
  const envPath = path.join(__dirname, "../../front-end/.env.local");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add contract addresses
  const envUpdates = [
    `NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=${deploymentData.factoryAddress}`,
    `NEXT_PUBLIC_BITFINITY_NETWORK=${network.name === 'localhost' ? 'testnet' : network.name}`,
    `NEXT_PUBLIC_CHAIN_ID=${chainId}`,
  ];
  
  // Add some popular token addresses
  const popularTokens = ['DANGCEM', 'MTNN', 'ZENITHBANK', 'GTCO', 'ACCESS'];
  popularTokens.forEach(symbol => {
    const token = deploymentData.tokens.find((t: any) => t.symbol === symbol);
    if (token) {
      envUpdates.push(`NEXT_PUBLIC_${symbol}_TOKEN_ADDRESS=${token.address}`);
    }
  });
  
  envUpdates.forEach(update => {
    const [key, value] = update.split('=');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, update);
    } else {
      envContent += `\n${update}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log("✅ Updated frontend environment variables");
  
  // Generate contract ABIs for frontend
  const abiPath = path.join(__dirname, "../../front-end/src/contracts");
  if (!fs.existsSync(abiPath)) {
    fs.mkdirSync(abiPath, { recursive: true });
  }
  
  // Copy contract ABIs
  const artifactsPath = path.join(__dirname, "../artifacts/contracts");
  
  if (fs.existsSync(artifactsPath)) {
    const contracts = ['NigerianStockToken.sol', 'NigerianStockFactory.sol'];
    
    contracts.forEach(contractFile => {
      const contractName = contractFile.replace('.sol', '');
      const artifactPath = path.join(artifactsPath, contractFile, `${contractName}.json`);
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const abiFile = path.join(abiPath, `${contractName}.json`);
        
        fs.writeFileSync(abiFile, JSON.stringify({
          contractName,
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          deployedBytecode: artifact.deployedBytecode,
        }, null, 2));
        
        console.log(`✅ Generated ABI for ${contractName}`);
      }
    });
  }
  
  console.log("\n🎉 Frontend configuration generated successfully!");
  console.log(`📍 Factory Address: ${deploymentData.factoryAddress}`);
  console.log(`🪙 Total Tokens: ${deploymentData.totalTokens}`);
  console.log(`🌐 Network: ${network.name} (${chainId})`);
  console.log(`📅 Deployed: ${deploymentData.deployedAt}`);
  
  return {
    factoryAddress: deploymentData.factoryAddress,
    totalTokens: deploymentData.totalTokens,
    network: network.name,
    chainId,
  };
}

if (require.main === module) {
  generateFrontendConfig()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default generateFrontendConfig;

import * as fs from 'fs';
import * as path from 'path';
import {
  TokenCreationResult,
  TokenMetadata,
  FrontendConfig,
  FrontendTokenConfig
} from '../types';

export class FrontendIntegrationService {
  private outputDir: string;

  constructor(outputDir: string = './exports') {
    this.outputDir = outputDir;
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate token metadata files
   */
  generateTokenMetadata(tokens: TokenCreationResult[], network: string): string[] {
    this.ensureOutputDir();
    
    const metadataDir = path.join(this.outputDir, 'metadata');
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }

    const exportedPaths: string[] = [];
    const timestamp = new Date().toISOString();

    tokens.forEach(token => {
      const metadata: TokenMetadata = {
        tokenId: token.tokenId,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        treasuryAccountId: token.treasuryAccountId,
        memo: token.memo,
        network,
        createdAt: timestamp,
        transactionId: token.transactionId,
        explorerUrl: token.explorerUrl
      };

      const metadataPath = path.join(metadataDir, `${token.symbol}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      exportedPaths.push(metadataPath);
    });

    return exportedPaths;
  }

  /**
   * Generate TypeScript type definitions
   */
  generateTypeDefinitions(tokens: TokenCreationResult[]): string {
    this.ensureOutputDir();
    
    const typesDir = path.join(this.outputDir, 'types');
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }

    const typeDefinitions = `/**
 * Auto-generated TypeScript definitions for Nigerian Stock Tokens
 * Generated at: ${new Date().toISOString()}
 */

export interface TokenInfo {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  explorerUrl: string;
}

export const NIGERIAN_STOCK_TOKENS: Record<string, TokenInfo> = {
${tokens.map(token => `  ${token.symbol}: {
    tokenId: "${token.tokenId}",
    symbol: "${token.symbol}",
    name: "${token.name}",
    decimals: ${token.decimals},
    network: "${token.explorerUrl.includes('testnet') ? 'testnet' : 'mainnet'}",
    explorerUrl: "${token.explorerUrl}"
  }`).join(',\n')}
};

export const TOKEN_SYMBOLS = [
${tokens.map(token => `  "${token.symbol}"`).join(',\n')}
] as const;

export type TokenSymbol = typeof TOKEN_SYMBOLS[number];

export const getTokenBySymbol = (symbol: TokenSymbol): TokenInfo | undefined => {
  return NIGERIAN_STOCK_TOKENS[symbol];
};

export const getAllTokens = (): TokenInfo[] => {
  return Object.values(NIGERIAN_STOCK_TOKENS);
};
`;

    const typesPath = path.join(typesDir, 'nigerian-stock-tokens.ts');
    fs.writeFileSync(typesPath, typeDefinitions);
    
    console.log(`📄 TypeScript definitions exported: ${typesPath}`);
    return typesPath;
  }

  /**
   * Generate frontend configuration file
   */
  generateFrontendConfig(tokens: TokenCreationResult[], network: string): string {
    this.ensureOutputDir();

    const frontendTokens: FrontendTokenConfig[] = tokens.map(token => ({
      tokenId: token.tokenId,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      network,
      explorerUrl: token.explorerUrl
    }));

    const config: FrontendConfig = {
      network,
      tokens: frontendTokens,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const configPath = path.join(this.outputDir, 'frontend-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`⚙️  Frontend configuration exported: ${configPath}`);
    return configPath;
  }

  /**
   * Generate React hooks for token interaction
   */
  generateReactHooks(tokens: TokenCreationResult[], network: string): string {
    this.ensureOutputDir();
    
    const hooksDir = path.join(this.outputDir, 'frontend');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const hooksContent = `/**
 * Auto-generated React hooks for Nigerian Stock Tokens
 * Generated at: ${new Date().toISOString()}
 */

import { useState, useEffect, useMemo } from 'react';
import { NIGERIAN_STOCK_TOKENS, TokenInfo, TokenSymbol } from '../types/nigerian-stock-tokens';

export interface UseTokenReturn {
  token: TokenInfo | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get token information by symbol
 */
export const useToken = (symbol: TokenSymbol): UseTokenReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => {
    try {
      return NIGERIAN_STOCK_TOKENS[symbol] || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [symbol]);

  useEffect(() => {
    setLoading(false);
  }, [token]);

  return { token, loading, error };
};

/**
 * Hook to get all available tokens
 */
export const useAllTokens = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokens = useMemo(() => {
    try {
      return Object.values(NIGERIAN_STOCK_TOKENS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [tokens]);

  return { tokens, loading, error };
};

/**
 * Hook to search tokens by name or symbol
 */
export const useTokenSearch = (query: string) => {
  const { tokens } = useAllTokens();
  
  const filteredTokens = useMemo(() => {
    if (!query.trim()) return tokens;
    
    const lowercaseQuery = query.toLowerCase();
    return tokens.filter(token => 
      token.name.toLowerCase().includes(lowercaseQuery) ||
      token.symbol.toLowerCase().includes(lowercaseQuery)
    );
  }, [tokens, query]);

  return { tokens: filteredTokens };
};

/**
 * Network configuration
 */
export const NETWORK_CONFIG = {
  network: '${network}',
  explorerBaseUrl: '${network === 'mainnet' ? 'https://hashscan.io/mainnet' : 'https://hashscan.io/testnet'}'
};
`;

    const hooksPath = path.join(hooksDir, 'hooks.ts');
    fs.writeFileSync(hooksPath, hooksContent);
    
    console.log(`🪝 React hooks exported: ${hooksPath}`);
    return hooksPath;
  }

  /**
   * Generate environment template
   */
  generateEnvTemplate(network: string): string {
    this.ensureOutputDir();
    
    const frontendDir = path.join(this.outputDir, 'frontend');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }

    const envContent = `# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=${network}
NEXT_PUBLIC_HEDERA_EXPLORER_URL=${network === 'mainnet' ? 'https://hashscan.io/mainnet' : 'https://hashscan.io/testnet'}

# Optional: If you need to interact with tokens programmatically
HEDERA_OPERATOR_ACCOUNT_ID=your_account_id_here
HEDERA_OPERATOR_PRIVATE_KEY=your_private_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME="Nigerian Stock Exchange"
NEXT_PUBLIC_APP_VERSION="1.0.0"
`;

    const envPath = path.join(frontendDir, '.env.example');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`🔧 Environment template exported: ${envPath}`);
    return envPath;
  }

  /**
   * Generate README for integration
   */
  generateIntegrationReadme(tokens: TokenCreationResult[], network: string): string {
    this.ensureOutputDir();

    const readmeContent = `# Nigerian Stock Tokens - Frontend Integration

This directory contains all the necessary files for integrating the deployed Hedera native tokens into your frontend application.

## Generated Files

### Core Configuration
- \`frontend-config.json\` - Main configuration file with all token data
- \`frontend/.env.example\` - Environment variables template
- \`frontend/hooks.ts\` - React hooks for token interaction

### Token Data
- \`metadata/\` - Individual token metadata files
- \`types/\` - TypeScript type definitions

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your values:

\`\`\`bash
cp frontend/.env.example .env.local
\`\`\`

### 2. Install Dependencies

Make sure you have the Hedera SDK installed:

\`\`\`bash
npm install @hashgraph/sdk
\`\`\`

### 3. Import Types and Hooks

\`\`\`typescript
import { useToken, useAllTokens } from './exports/frontend/hooks';
import { NIGERIAN_STOCK_TOKENS } from './exports/types/nigerian-stock-tokens';

// Use in your React components
const { token } = useToken('DANGCEM');
const { tokens } = useAllTokens();
\`\`\`

## Available Tokens

${tokens.map(token => `- **${token.symbol}** (${token.name})
  - Token ID: \`${token.tokenId}\`
  - Decimals: ${token.decimals}
  - Explorer: [View on HashScan](${token.explorerUrl})`).join('\n')}

## Network Information

- **Network**: ${network}
- **Explorer**: ${network === 'mainnet' ? 'https://hashscan.io/mainnet' : 'https://hashscan.io/testnet'}
- **Generated**: ${new Date().toISOString()}

## Integration Examples

### Basic Token Display

\`\`\`typescript
import { useToken } from './exports/frontend/hooks';

function TokenDisplay({ symbol }: { symbol: string }) {
  const { token, loading, error } = useToken(symbol);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!token) return <div>Token not found</div>;
  
  return (
    <div>
      <h3>{token.name} ({token.symbol})</h3>
      <p>Token ID: {token.tokenId}</p>
      <p>Decimals: {token.decimals}</p>
      <a href={token.explorerUrl} target="_blank">View on Explorer</a>
    </div>
  );
}
\`\`\`

### Token List

\`\`\`typescript
import { useAllTokens } from './exports/frontend/hooks';

function TokenList() {
  const { tokens, loading, error } = useAllTokens();
  
  if (loading) return <div>Loading tokens...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {tokens.map(token => (
        <div key={token.tokenId}>
          <h4>{token.name} ({token.symbol})</h4>
          <p>ID: {token.tokenId}</p>
        </div>
      ))}
    </div>
  );
}
\`\`\`

## Support

For questions about integration or token functionality, please refer to the Hedera documentation:
- [Hedera SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis)
- [Token Service Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service)
`;

    const readmePath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log(`📖 Integration README exported: ${readmePath}`);
    return readmePath;
  }

  /**
   * Generate all frontend integration files
   */
  generateAllIntegrationFiles(tokens: TokenCreationResult[], network: string): {
    metadataFiles: string[];
    typesFile: string;
    configFile: string;
    hooksFile: string;
    envFile: string;
    readmeFile: string;
  } {
    console.log('\n📦 Generating frontend integration files...');
    
    const metadataFiles = this.generateTokenMetadata(tokens, network);
    const typesFile = this.generateTypeDefinitions(tokens);
    const configFile = this.generateFrontendConfig(tokens, network);
    const hooksFile = this.generateReactHooks(tokens, network);
    const envFile = this.generateEnvTemplate(network);
    const readmeFile = this.generateIntegrationReadme(tokens, network);

    console.log('✅ All frontend integration files generated successfully!');

    return {
      metadataFiles,
      typesFile,
      configFile,
      hooksFile,
      envFile,
      readmeFile
    };
  }
}

# Hedera Native Token Service

A TypeScript service for creating Nigerian Stock Exchange tokens natively on Hedera using the Hedera SDK. This replaces the previous Solidity-based approach with a cleaner, more efficient native implementation.

## 🚀 Features

- **Native Hedera Token Creation**: Uses Hedera SDK directly, no smart contracts needed
- **Nigerian Stock Exchange Tokens**: Pre-configured with real NGX blue-chip stocks
- **Frontend Integration**: Auto-generates TypeScript types, React hooks, and configuration files
- **Multi-Network Support**: Works with testnet, mainnet, and previewnet
- **Type Safety**: Full TypeScript support with strict typing
- **Error Handling**: Comprehensive error handling and logging
- **Cost Tracking**: Tracks HBAR costs for token creation

## 📦 Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the contracts/hedera directory:

```bash
# For Testnet
TESTNET_OPERATOR_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
TESTNET_OPERATOR_PRIVATE_KEY=your_private_key_here

# For Mainnet
MAINNET_OPERATOR_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
MAINNET_OPERATOR_PRIVATE_KEY=your_private_key_here

# Optional: Set default network
HEDERA_NETWORK=testnet
```

### Getting Hedera Credentials

1. **Testnet**: Create a free account at [Hedera Portal](https://portal.hedera.com/)
2. **Mainnet**: Use your production Hedera account credentials

## 🎯 Usage

### Quick Start

```bash
# Create tokens on testnet (default)
npm run create-tokens

# Create tokens on mainnet
npm run create-tokens:mainnet

# Create tokens without frontend files
npm run create-tokens:no-frontend

# Show help
npm run help
```

### Advanced Usage

```bash
# Create tokens with custom options
npm run create-tokens -- --network testnet --output-dir ./my-exports

# Only create tokens (no file generation)
npm run create-tokens:tokens-only

# Use legacy SDK-only script
npm run create-tokens-sdk
```

## 📊 Available Tokens

The service creates tokens for these Nigerian Stock Exchange blue-chip stocks:

| Symbol | Company Name | Shares | Sector |
|--------|-------------|--------|---------|
| DANGCEM | Dangote Cement Plc | 17.04B | Industrial |
| MTNN | MTN Nigeria Communications Plc | 20.35B | Telecom |
| ZENITHBANK | Zenith Bank Plc | 31.40B | Banking |
| GTCO | Guaranty Trust Holding Company Plc | 29.43B | Banking |
| NB | Nigerian Breweries Plc | 8.02B | Consumer Goods |
| ACCESS | Access Holdings Plc | 35.69B | Banking |
| BUACEMENT | BUA Cement Plc | 16.00B | Industrial |
| AIRTELAFRI | Airtel Africa Plc | 3.70B | Telecom |
| FBNH | FBN Holdings Plc | 35.90B | Banking |
| UBA | United Bank for Africa Plc | 35.13B | Banking |

All tokens are created with:
- **Decimals**: 18 (for fractional shares)
- **Supply Type**: Finite
- **Token Type**: Fungible Common
- **Freeze Default**: False

## 📁 Generated Files

When you run the token creation service, it generates:

```
exports/
├── README.md                    # Integration guide
├── frontend-config.json         # Main frontend configuration
├── metadata/                    # Individual token metadata
│   ├── DANGCEM.json
│   ├── MTNN.json
│   └── ...
├── types/                       # TypeScript definitions
│   └── nigerian-stock-tokens.ts
└── frontend/                    # Frontend integration
    ├── hooks.ts                 # React hooks
    └── .env.example            # Environment template
```

## 🔗 Frontend Integration

### React Hooks

```typescript
import { useToken, useAllTokens } from './exports/frontend/hooks';

// Get specific token
function TokenDisplay({ symbol }: { symbol: string }) {
  const { token, loading, error } = useToken(symbol);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>{token?.name} ({token?.symbol})</h3>
      <p>Token ID: {token?.tokenId}</p>
    </div>
  );
}

// Get all tokens
function TokenList() {
  const { tokens, loading } = useAllTokens();
  
  return (
    <div>
      {tokens.map(token => (
        <div key={token.tokenId}>{token.name}</div>
      ))}
    </div>
  );
}
```

### TypeScript Types

```typescript
import { NIGERIAN_STOCK_TOKENS, getTokenBySymbol } from './exports/types/nigerian-stock-tokens';

// Get token info
const dangcemToken = getTokenBySymbol('DANGCEM');
console.log(dangcemToken?.tokenId);

// All tokens
const allTokens = Object.values(NIGERIAN_STOCK_TOKENS);
```

## 🛠️ Development

### Project Structure

```
src/
├── constants/           # Token data and configuration
├── services/           # Core services
│   ├── token-service.ts        # Main token creation
│   └── frontend-integration.ts # File generation
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── index.ts           # Main entry point

scripts/               # Utility scripts
├── create-tokens-native.ts
├── create-tokens-sdk-only.ts
└── verify-tokens.ts
```

### Building

```bash
# Build TypeScript
npm run build

# Watch mode
npm run build:watch

# Clean build artifacts
npm run clean
```

## 🔍 Verification

After creating tokens, verify them on Hedera explorers:

- **Testnet**: https://hashscan.io/testnet
- **Mainnet**: https://hashscan.io/mainnet

## 📋 Scripts Reference

| Script | Description |
|--------|-------------|
| `create-tokens` | Create tokens on testnet with frontend files |
| `create-tokens:mainnet` | Create tokens on mainnet |
| `create-tokens:no-frontend` | Create tokens without frontend files |
| `create-tokens:tokens-only` | Only create tokens, no file generation |
| `verify-tokens` | Verify existing tokens |
| `verify-env` | Check environment configuration |
| `build` | Build TypeScript project |
| `clean` | Clean build artifacts and exports |
| `help` | Show detailed help |

## 🚨 Migration from Solidity

This service replaces the previous Solidity-based token creation. Key differences:

### Before (Solidity)
- Required smart contract deployment
- Used Hardhat for compilation and deployment
- Complex ABI management
- Higher gas costs
- More complex integration

### After (Native Hedera)
- Direct Hedera SDK usage
- No smart contracts needed
- Simpler TypeScript integration
- Lower transaction costs
- Cleaner architecture

## 🔧 Troubleshooting

### Common Issues

1. **Insufficient HBAR Balance**
   ```
   Solution: Add more HBAR to your operator account
   Recommended: 50+ HBAR for creating all tokens
   ```

2. **Invalid Credentials**
   ```
   Solution: Verify your account ID and private key
   Check: Environment variables are correctly set
   ```

3. **Network Connectivity**
   ```
   Solution: Check internet connection
   Try: Different Hedera network (testnet/mainnet)
   ```

4. **Rate Limiting**
   ```
   Solution: The service includes automatic delays
   Note: 5-second delays between token creations
   ```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the [Hedera Documentation](https://docs.hedera.com/)
- Review the generated README.md in exports/
- Open an issue in the repository

# NGN Stablecoin & DEX System

A comprehensive decentralized exchange system for trading Nigerian stocks with NGN stablecoin, built for multi-EVM compatibility with a focus on Bitfinity EVM and Ethereum Sepolia.

## 🌟 Overview

This system provides a complete infrastructure for tokenized asset trading, featuring:

- **NGN Stablecoin**: A compliant, feature-rich stablecoin pegged to the Nigerian Naira
- **StockNGNDEX**: An automated market maker (AMM) for stock-to-NGN trading
- **TradingPairManager**: Unified management interface for multiple trading pairs
- **Frontend Integration**: React components for seamless user interaction
- **Multi-EVM Support**: Compatible with Bitfinity EVM, Ethereum Sepolia, and other EVMs

## 🏗️ Architecture

### Smart Contracts

#### 1. NGNStablecoin.sol
A comprehensive ERC-20 stablecoin with advanced features:

**Key Features:**
- ✅ Minting with daily caps and role-based access
- ✅ Burning capabilities for supply management
- ✅ Transfer limits and compliance controls
- ✅ Blacklist/whitelist functionality
- ✅ DEX integration with special transfer limits
- ✅ Pausable operations for emergency control
- ✅ Comprehensive admin controls

**Security Features:**
- Role-based access control (RBAC)
- Reentrancy protection
- Transfer validation and compliance checks
- Emergency pause functionality
- Daily minting and transfer limits

#### 2. StockNGNDEX.sol
An automated market maker for stock-NGN trading pairs:

**Key Features:**
- ✅ Constant product AMM formula (x * y = k)
- ✅ Bidirectional swapping (NGN ↔ Stock tokens)
- ✅ Liquidity pool management
- ✅ Fee collection and distribution
- ✅ Price impact protection
- ✅ Slippage tolerance controls
- ✅ Real-time price tracking and history

**Trading Features:**
- Multiple trading pairs support
- Configurable fee rates per pair
- Price impact limits
- Deadline protection for transactions
- Comprehensive swap quotes

#### 3. TradingPairManager.sol
Unified management interface for multiple trading pairs:

**Key Features:**
- ✅ Batch trading pair creation
- ✅ Automated liquidity rebalancing
- ✅ Cross-network configuration
- ✅ Centralized pair management
- ✅ Network-specific settings
- ✅ Emergency controls

## 🚀 Deployment

### Prerequisites

```bash
# Install dependencies
cd contracts
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

### Network Deployment

#### 1. Deploy to Bitfinity Testnet
```bash
npm run deploy:ngn-dex:testnet
```

#### 2. Deploy to Ethereum Sepolia
```bash
npm run deploy:ngn-dex:sepolia
```

#### 3. Deploy to Local Network
```bash
npm run deploy:ngn-dex:local
```

### Create Trading Pairs

After deployment, create trading pairs with existing stock tokens:

```bash
# Create pairs on Sepolia (with existing stock tokens)
npm run create-pairs:sepolia

# Create pairs on Bitfinity Testnet
npm run create-pairs:testnet
```

### Test the System

Run comprehensive system tests:

```bash
# Test NGN stablecoin functionality
npm run test:ngn-dex:sepolia

# Test on local network
npm run test:ngn-dex:local
```

## 🎯 Usage Examples

### NGN Stablecoin Operations

```solidity
// Mint NGN tokens (requires MINTER_ROLE)
ngnStablecoin.mint(userAddress, parseEther("1000"));

// Transfer NGN tokens
ngnStablecoin.transfer(recipientAddress, parseEther("500"));

// Check transfer eligibility
(bool canTransfer, string memory reason) = ngnStablecoin.canTransfer(
    fromAddress, 
    toAddress, 
    parseEther("100")
);
```

### DEX Trading Operations

```solidity
// Get swap quote
(uint256 stockAmountOut, uint256 fee, uint256 priceImpact) = 
    stockNGNDEX.getQuoteNGNToStock(stockTokenAddress, parseEther("1000"));

// Execute swap (NGN → Stock)
uint256 deadline = block.timestamp + 1800; // 30 minutes
stockNGNDEX.swapNGNForStock(
    stockTokenAddress,
    parseEther("1000"),    // NGN amount in
    minStockAmountOut,     // Minimum stock tokens out
    deadline
);

// Add liquidity
stockNGNDEX.addLiquidity(
    stockTokenAddress,
    parseEther("10000"),   // NGN amount
    parseEther("200"),     // Stock amount
    minLiquidityOut        // Minimum liquidity tokens
);
```

### Trading Pair Management

```solidity
// Create managed trading pair
tradingPairManager.createManagedPair(
    stockTokenAddress,
    parseEther("50000"),   // Initial NGN liquidity
    parseEther("1000"),    // Initial stock liquidity
    30,                    // 0.3% fee rate
    parseEther("100000")   // Target liquidity
);

// Batch create multiple pairs
tradingPairManager.batchCreatePairs(
    stockTokenAddresses,
    ngnAmounts,
    stockAmounts,
    feeRates,
    targetLiquidities
);
```

## 🖥️ Frontend Integration

### React Components

The system includes comprehensive React components:

#### NGNWallet Component
```tsx
import { NGNWallet } from '../components/NGNStablecoin';

<NGNWallet className="w-full max-w-md" />
```

#### StockNGNTrader Component
```tsx
import { StockNGNTrader } from '../components/DEX';

<StockNGNTrader className="w-full" />
```

#### DEXDashboard Component
```tsx
import { DEXDashboard } from '../components/DEX';

<DEXDashboard className="w-full" />
```

### Key Features

- **Wallet Integration**: Seamless Web3 wallet connectivity
- **Real-time Updates**: Live balance and price updates
- **Transaction Management**: Approval and execution flows
- **Error Handling**: Comprehensive error states and messages
- **Responsive Design**: Mobile-friendly interface
- **Multi-network Support**: Automatic network detection

## 🔧 Configuration

### Contract Addresses

Update contract addresses in `front-end/src/abis/index.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  11155111: { // Sepolia
    factoryAddress: "0xF1098eDaaB7a7D7b3bD42e7DeD9554781dfA625A",
    ngnStablecoin: "YOUR_NGN_ADDRESS",
    stockNGNDEX: "YOUR_DEX_ADDRESS",
    tradingPairManager: "YOUR_MANAGER_ADDRESS",
  },
  355113: { // Bitfinity Testnet
    factoryAddress: "YOUR_FACTORY_ADDRESS",
    ngnStablecoin: "YOUR_NGN_ADDRESS",
    stockNGNDEX: "YOUR_DEX_ADDRESS",
    tradingPairManager: "YOUR_MANAGER_ADDRESS",
  }
};
```

### Environment Variables

```bash
# Deployment
PRIVATE_KEY=your_private_key
BITFINITY_TESTNET_RPC_URL=https://testnet.bitfinity.network
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

## 🧪 Testing

### Contract Tests

Comprehensive test suites cover:

- ✅ NGN Stablecoin functionality (35+ tests)
- ✅ DEX trading operations (25+ tests)
- ✅ Trading pair management (20+ tests)
- ✅ Access control and security
- ✅ Edge cases and error conditions

### Test Coverage

```bash
# Run all tests
npm test

# Run specific test files
npx hardhat test test/NGNStablecoin.test.ts
npx hardhat test test/StockNGNDEX.test.ts
npx hardhat test test/TradingPairManager.test.ts

# Run with coverage
npm run test:coverage
```

## 🔒 Security

### Security Features

1. **Access Control**: Role-based permissions for all critical functions
2. **Reentrancy Protection**: Guards against reentrancy attacks
3. **Input Validation**: Comprehensive parameter validation
4. **Emergency Controls**: Pause functionality for critical situations
5. **Transfer Limits**: Daily and per-transaction limits
6. **Compliance**: Blacklist/whitelist functionality

### Audit Considerations

- All contracts use OpenZeppelin's battle-tested libraries
- Comprehensive test coverage (>95%)
- Gas optimization without compromising security
- Clear separation of concerns
- Extensive documentation and comments

## 📊 Monitoring & Analytics

### Key Metrics

- Total NGN supply and circulation
- Trading volume across all pairs
- Liquidity pool sizes and utilization
- Fee collection and distribution
- Price movements and volatility
- User adoption and transaction counts

### Integration Points

- DEX statistics dashboard
- Real-time price feeds
- Transaction history tracking
- Liquidity provider rewards
- Cross-network analytics

## 🛣️ Roadmap

### Phase 1: Core Infrastructure ✅
- NGN Stablecoin deployment
- Basic DEX functionality
- Frontend integration
- Multi-network support

### Phase 2: Advanced Features 🚧
- Liquidity mining rewards
- Governance token integration
- Advanced trading features
- Mobile app development

### Phase 3: Ecosystem Expansion 📋
- Additional stock token integrations
- Cross-chain bridge development
- Institutional trading features
- Regulatory compliance tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

### Development Guidelines

- Follow Solidity best practices
- Maintain test coverage >95%
- Use TypeScript for frontend
- Follow existing code style
- Document all public functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Link to docs]
- **Discord**: [Community link]
- **GitHub Issues**: [Issues page]
- **Email**: support@example.com

---

**Built with ❤️ for the Nigerian financial ecosystem**

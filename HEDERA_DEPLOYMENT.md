# Hedera Deployment Guide

This guide explains how to deploy the Nigerian Stock Trading System to Hedera Testnet using the official Hedera SDK.

## Prerequisites

### 1. Hedera Testnet Account
- Create a Hedera testnet account at [Hedera Portal](https://portal.hedera.com/register)
- Fund your account with testnet HBAR (minimum 100 HBAR recommended)
- Note down your Account ID (format: 0.0.xxxxxxx) and Private Key

### 2. Environment Setup
1. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the `.env` file with your Hedera credentials:
   ```env
   # Hedera Account Configuration
   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_PRIVATE_KEY=your_hedera_private_key_here
   
   # Alternative naming for compatibility
   OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
   OPERATOR_PVKEY=your_hedera_private_key_here
   ```

### 3. Dependencies
Install all required dependencies:
```bash
npm run install:all
```

## Deployment Options

### Option 1: Complete Deployment with Testing (Recommended)
This option deploys all contracts and runs comprehensive tests:

```bash
npm run deploy:hedera-complete
```

This script will:
1. ✅ Validate environment configuration
2. 💰 Check account balance
3. 🔨 Compile smart contracts
4. 🚀 Deploy all contracts using Hedera SDK
5. 🧪 Run deployment verification tests
6. 📄 Generate deployment reports

### Option 2: Deploy Only
If you want to deploy without running tests:

```bash
npm run deploy:hedera-sdk
```

### Option 3: Test Existing Deployment
To test an already deployed system:

```bash
npm run test:hedera
```

## Deployed Contracts

The deployment includes the following contracts:

### Core Contracts
1. **NGN Stablecoin** - Nigerian Naira stablecoin for trading
2. **NigerianStockFactory** - Factory for creating stock tokens
3. **StockNGNDEX** - Decentralized exchange for stock/NGN trading
4. **TradingPairManager** - Manages trading pairs and liquidity

### Stock Tokens
The system deploys tokens for major Nigerian stocks:
- **DANGCEM** - Dangote Cement Plc
- **GTCO** - Guaranty Trust Holding Company Plc
- **AIRTELAFRI** - Airtel Africa Plc
- **BUACEMENT** - BUA Cement Plc
- **SEPLAT** - Seplat Energy Plc

## Gas Optimization

The deployment uses optimized gas settings for Hedera:

- **Simple Contracts**: 2,000,000 gas
- **Token Contracts**: 3,500,000 gas
- **Complex Contracts**: 4,000,000 gas
- **DEX Contracts**: 5,000,000 gas
- **Factory Contracts**: 3,000,000 gas

Transaction fees are set to:
- **Contract Creation**: 30 HBAR
- **File Operations**: 5 HBAR each

## Deployment Output

### Files Generated
1. **Deployment Results**: `backend/deployments/hedera-testnet-[timestamp].json`
2. **Frontend Config**: `frontend/src/config/hedera-contracts.json`
3. **Test Results**: `backend/deployments/test-results-[timestamp].json`

### Frontend Configuration
The deployment automatically updates the frontend configuration with:
- Contract addresses
- Contract IDs
- Network information
- Stock token details

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance
```
Error: INSUFFICIENT_PAYER_BALANCE
```
**Solution**: Add more HBAR to your testnet account

#### 2. Invalid Account Format
```
Error: Invalid Hedera account ID format
```
**Solution**: Ensure account ID follows format `0.0.xxxxxxx`

#### 3. Gas Limit Exceeded
```
Error: INSUFFICIENT_GAS
```
**Solution**: The deployment script automatically uses optimized gas limits

#### 4. Network Connectivity
```
Error: Failed to connect to Hedera network
```
**Solution**: Check internet connection and Hedera network status

### Getting Help

1. **Check Logs**: Review the detailed deployment logs for specific error messages
2. **Verify Environment**: Ensure all environment variables are correctly set
3. **Account Status**: Verify your Hedera account is active and funded
4. **Network Status**: Check [Hedera Status Page](https://status.hedera.com/)

## Project Structure

After refactoring, the project follows this structure:

```
LiquidityOnHedera/
├── frontend/                 # Frontend application
│   ├── src/
│   │   └── config/
│   │       └── hedera-contracts.json
│   └── package.json
├── backend/                  # Smart contracts and deployment
│   ├── contracts/           # Solidity contracts
│   ├── scripts/            # Deployment scripts
│   │   ├── deploy-hedera-sdk.js
│   │   ├── test-hedera-deployment.js
│   │   └── deploy-and-test-hedera.js
│   ├── deployments/        # Deployment results
│   └── package.json
└── package.json            # Root package.json
```

## Next Steps

After successful deployment:

1. **Frontend Integration**: The frontend configuration is automatically updated
2. **UI Testing**: Test the application through the web interface
3. **Contract Verification**: Verify contracts on Hedera network explorers
4. **Production Deployment**: For mainnet deployment, update network configuration

## Security Notes

- ⚠️ Never commit private keys to version control
- 🔒 Use environment variables for sensitive configuration
- 🛡️ Test thoroughly on testnet before mainnet deployment
- 📋 Keep deployment records for audit purposes

## Support

For additional support:
- Review the deployment logs for detailed error information
- Check the Hedera documentation: [docs.hedera.com](https://docs.hedera.com)
- Verify network status: [status.hedera.com](https://status.hedera.com)

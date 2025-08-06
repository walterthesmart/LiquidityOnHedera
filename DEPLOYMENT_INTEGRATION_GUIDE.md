# Hedera Deployment & Frontend Integration Guide

This guide explains how to deploy the Nigerian Stock Trading System contracts to Hedera Testnet and integrate them with the frontend.

## 🎉 Current Status

✅ **Frontend Database Populated** - Nigerian stocks data has been successfully populated in the frontend
✅ **UI Components Created** - Complete dashboard for viewing and trading Nigerian stocks
✅ **Mock Data Integration** - Frontend is displaying 5 Nigerian stocks with trading capabilities
✅ **Deployment Scripts Ready** - Multiple deployment options available

## 📊 What's Been Accomplished

### 1. Frontend Database Population
- **5 Nigerian Stocks** added to the database:
  - DANGCEM (Dangote Cement Plc)
  - GTCO (Guaranty Trust Holding Company Plc)
  - AIRTELAFRI (Airtel Africa Plc)
  - BUACEMENT (BUA Cement Plc)
  - SEPLAT (Seplat Energy Plc)

### 2. Data Files Created
- `frontend/src/config/hedera-contracts.json` - Contract configuration
- `frontend/src/data/nigerian-stocks.json` - Stock data with prices and details
- `frontend/src/data/trading-pairs.json` - Trading pairs (Stock/NGN)
- `frontend/src/data/market-data.json` - Market overview data

### 3. UI Components
- **NigerianStocksDashboard** - Main dashboard component
- **DeploymentStatus** - Shows deployment status and instructions
- **Updated Sidebar** - Added navigation to Nigerian Stocks and Deployment pages

### 4. New Pages
- `/nigerian-stocks` - View and trade Nigerian stocks
- `/deployment` - Monitor deployment status and get deployment instructions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Frontend (with Mock Data)
```bash
npm run dev:frontend
```

Visit `http://localhost:3000/nigerian-stocks` to see the Nigerian stocks dashboard.

## 📋 Available Scripts

### Frontend Scripts
```bash
# Populate frontend database with Nigerian stocks
npm run populate:frontend

# Start frontend development server
npm run dev:frontend
```

### Backend Scripts
```bash
# Deploy using Hardhat (recommended)
npm run deploy:hedera-hardhat

# Deploy using Hedera SDK (if dependencies work)
npm run deploy:hedera-sdk

# Test deployment
npm run test:hedera
```

### Combined Scripts
```bash
# Complete setup (install + populate frontend)
npm run setup:complete

# Build everything
npm run build:all
```

## 🔧 Deployment Options

### Option 1: Hardhat Deployment (Recommended)
```bash
cd backend
cp .env.example .env
# Edit .env with your Hedera credentials
npm run deploy:hedera-hardhat
```

### Option 2: Hedera SDK Deployment
```bash
cd backend
npm run deploy:hedera-sdk
```

### Option 3: Manual Contract Deployment
Use the deployment status page in the frontend for step-by-step instructions.

## 📱 Frontend Features

### Nigerian Stocks Dashboard
- **Market Overview** - Total market cap, volume, active stocks
- **Stock Cards** - Individual stock information with trading buttons
- **Top Movers** - Gainers, losers, and most active stocks
- **Trading Pairs** - Available trading pairs
- **Real-time Data** - Mock data with realistic Nigerian stock information

### Deployment Status Page
- **Contract Addresses** - View all deployed contract addresses
- **Deployment Instructions** - Step-by-step deployment guide
- **Hedera Account Setup** - Links to get testnet accounts
- **Status Monitoring** - Live vs mock data indicators

## 🏗️ Architecture

### Frontend Structure
```
frontend/src/
├── components/
│   ├── NigerianStocksDashboard.tsx
│   ├── DeploymentStatus.tsx
│   └── ui/ (UI components)
├── data/
│   ├── nigerian-stocks.json
│   ├── trading-pairs.json
│   └── market-data.json
├── config/
│   └── hedera-contracts.json
├── hooks/
│   └── use-nigerian-stocks.ts
└── app/(platform)/
    ├── nigerian-stocks/
    └── deployment/
```

### Backend Structure
```
backend/
├── contracts/ (Solidity contracts)
├── scripts/
│   ├── deploy-hedera-sdk.ts
│   ├── deploy-hardhat-hedera.js
│   └── utils/hedera-gas-config.ts
└── deployments/ (Deployment results)
```

## 🔗 Contract Integration

### Current Status
- **Mock Data**: Frontend uses placeholder contract addresses
- **Live Integration**: Ready for real contract addresses after deployment

### After Deployment
1. Contract addresses will be automatically updated in `hedera-contracts.json`
2. Frontend will switch from mock to live data
3. Trading functionality will connect to actual Hedera contracts

## 🌐 Hedera Network Details

### Testnet Configuration
- **Network**: Hedera Testnet
- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet

### Required HBAR Balance
- **Minimum**: 100 HBAR for deployment
- **Recommended**: 200+ HBAR for testing

## 📊 Nigerian Stocks Data

### Included Stocks
1. **DANGCEM** - Dangote Cement Plc (Industrial Goods)
2. **GTCO** - Guaranty Trust Holding Company Plc (Banking)
3. **AIRTELAFRI** - Airtel Africa Plc (Telecommunications)
4. **BUACEMENT** - BUA Cement Plc (Industrial Goods)
5. **SEPLAT** - Seplat Energy Plc (Oil & Gas)

### Data Features
- Real Nigerian company information
- Realistic price data and market caps
- Sector classifications
- Trading volumes and price changes
- Contract addresses (placeholder/live)

## 🔄 Next Steps

### For Development
1. ✅ Frontend populated with Nigerian stocks
2. ✅ UI components created and functional
3. ⏳ Deploy contracts to Hedera Testnet
4. ⏳ Update contract addresses in frontend
5. ⏳ Test live trading functionality

### For Production
1. Deploy to Hedera Mainnet
2. Integrate real-time price feeds
3. Add more Nigerian stocks
4. Implement advanced trading features
5. Add user authentication and portfolios

## 🆘 Troubleshooting

### Common Issues
1. **Hedera SDK Dependencies**: Use Hardhat deployment if SDK has issues
2. **Low HBAR Balance**: Get more testnet HBAR from Hedera portal
3. **Network Connectivity**: Check Hedera network status
4. **Contract Compilation**: Ensure all dependencies are installed

### Getting Help
- Check deployment logs for specific errors
- Visit the deployment status page for instructions
- Ensure environment variables are correctly set
- Verify Hedera account credentials

## 📞 Support

For deployment issues or questions:
1. Check the deployment status page in the frontend
2. Review the console logs for specific errors
3. Ensure all prerequisites are met
4. Try the Hardhat deployment option if SDK fails

---

**Status**: ✅ Frontend Ready | ⏳ Awaiting Contract Deployment
**Last Updated**: January 2025

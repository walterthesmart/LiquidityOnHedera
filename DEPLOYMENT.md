# Liquidity Nigerian Stock Trading Platform - Deployment Guide

This guide covers the complete deployment process for the Liquidity Nigerian Stock Trading Platform, from development to production on Hedera Hashgraph.

## 🚀 Pre-Deployment Checklist

### 1. Hedera Account Setup
- [ ] Create Hedera Testnet account at [portal.hedera.com](https://portal.hedera.com)
- [ ] Fund account with sufficient HBAR (minimum 100 HBAR recommended)
- [ ] Generate and securely store private keys
- [ ] Set up Hedera Mainnet account for production

### 2. Nigerian Payment Integration
- [ ] Create Paystack account at [paystack.com](https://paystack.com)
- [ ] Complete KYC verification for Nigerian business
- [ ] Obtain test and live API keys
- [ ] Configure webhook endpoints
- [ ] Test payment flows with Nigerian banks

### 3. Database Setup
- [ ] Set up MongoDB instance (Atlas recommended for production)
- [ ] Configure database security and access controls
- [ ] Set up backup and monitoring
- [ ] Run migration scripts for Nigerian stock data

### 4. External Services
- [ ] Set up Clerk authentication
- [ ] Configure WhatsApp Business API (optional)
- [ ] Set up monitoring and logging services
- [ ] Configure domain and SSL certificates

## 🏗️ Development Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/Liquidity.git
cd Liquidity

# Install frontend dependencies
cd site
npm install

# Install contract dependencies
cd ../contracts/hedera
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cd ../../site
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 3. Database Migration

```bash
# Run Nigerian stock data migration
npm run migrate:nigerian-stocks

# Verify migration
npm run verify:database
```

### 4. Smart Contract Deployment (Testnet)

```bash
cd ../contracts/hedera

# Compile contracts
npm run compile

# Deploy to Hedera Testnet
npm run deploy:testnet

# Verify deployment
npm run verify:testnet
```

### 5. Start Development Server

```bash
cd ../../site
npm run dev
```

## 🌐 Production Deployment

### Phase 1: Smart Contract Deployment

#### 1. Deploy to Hedera Mainnet

```bash
cd contracts/hedera

# Set production environment
export HEDERA_NETWORK=mainnet
export HEDERA_OPERATOR_ID=0.0.YOUR_MAINNET_ACCOUNT
export HEDERA_OPERATOR_KEY=your_mainnet_private_key

# Deploy contracts
npm run deploy:mainnet

# Verify deployment
npm run verify:mainnet

# Create stock tokens for Nigerian companies
npm run create-tokens:mainnet
```

#### 2. Contract Verification

```bash
# Verify contract on Hedera Explorer
npm run verify-contract --network mainnet --address 0.0.CONTRACT_ID

# Test contract functions
npm run test:mainnet-integration
```

### Phase 2: Frontend Deployment

#### 1. Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd site
vercel --prod
```

#### 2. Environment Variables Setup

In Vercel Dashboard, set the following environment variables:

```env
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_HEDERA_CONTRACT_ID=0.0.YOUR_CONTRACT_ID
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
CONN_STRING=mongodb+srv://user:pass@cluster.mongodb.net/Liquidity

# Hedera Configuration
NEXT_PUBLIC_HEDERA_OPERATOR_ID=0.0.YOUR_MAINNET_ACCOUNT
HEDERA_OPERATOR_KEY=your_mainnet_private_key

# Paystack (Live Keys)
LIVE_PAYSTACK_SECRET_KEY=sk_live_your_live_key
PAYSTACK_URL=https://api.paystack.co

# Other production configurations...
```

#### 3. Domain Configuration

```bash
# Add custom domain in Vercel
vercel domains add your-domain.com

# Configure DNS records
# A record: @ -> 76.76.19.61
# CNAME record: www -> cname.vercel-dns.com
```

### Phase 3: Database Production Setup

#### 1. MongoDB Atlas Configuration

```bash
# Create production cluster
# Configure IP whitelist
# Set up database users with appropriate permissions
# Enable backup and monitoring
```

#### 2. Data Migration

```bash
# Export development data
mongodump --uri="mongodb://localhost:27017/Liquidity_dev"

# Import to production
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/Liquidity"

# Run production migration
npm run migrate:production
```

### Phase 4: Nigerian Payment Integration

#### 1. Paystack Live Configuration

```bash
# Switch to live API keys
# Configure webhook endpoints
# Test with real Nigerian bank accounts
# Set up payment monitoring
```

#### 2. Nigerian Bank Integration Testing

```bash
# Test major Nigerian banks
npm run test:nigerian-banks

# Verify USSD codes
npm run test:ussd-payments

# Test mobile money integration
npm run test:mobile-money
```

## 🔧 Configuration Management

### 1. Environment-Specific Configurations

#### Development
```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NODE_ENV=development
LOG_LEVEL=debug
```

#### Staging
```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NODE_ENV=staging
LOG_LEVEL=info
```

#### Production
```env
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NODE_ENV=production
LOG_LEVEL=error
```

### 2. Security Configuration

```bash
# Set up SSL certificates
# Configure CORS policies
# Enable rate limiting
# Set up firewall rules
# Configure monitoring and alerting
```

## 📊 Monitoring and Maintenance

### 1. Application Monitoring

```bash
# Set up Sentry for error tracking
# Configure New Relic for performance monitoring
# Set up uptime monitoring
# Configure log aggregation
```

### 2. Blockchain Monitoring

```bash
# Monitor Hedera transaction status
# Track contract interactions
# Monitor HBAR balance
# Set up alerts for failed transactions
```

### 3. Payment Monitoring

```bash
# Monitor Paystack webhook status
# Track payment success rates
# Monitor Nigerian bank integration
# Set up fraud detection alerts
```

## 🔄 Continuous Deployment

### 1. GitHub Actions Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Automated Testing

```bash
# Set up automated testing pipeline
# Run contract tests
# Test Nigerian payment integration
# Verify Hedera connectivity
```

## 🚨 Disaster Recovery

### 1. Backup Strategy

```bash
# Database backups (daily)
# Smart contract state backup
# Configuration backup
# Private key secure storage
```

### 2. Recovery Procedures

```bash
# Database recovery process
# Smart contract redeployment
# Service restoration checklist
# Communication plan
```

## 📋 Post-Deployment Checklist

### 1. Functional Testing
- [ ] Test wallet connections (HashPack, Blade, Kabila, MetaMask)
- [ ] Verify stock price updates
- [ ] Test stock purchase flow
- [ ] Test stock sale flow
- [ ] Verify Nigerian payment methods
- [ ] Test portfolio management

### 2. Performance Testing
- [ ] Load testing with concurrent users
- [ ] Database performance optimization
- [ ] CDN configuration
- [ ] API response time optimization

### 3. Security Testing
- [ ] Penetration testing
- [ ] Smart contract audit
- [ ] Payment security verification
- [ ] Data encryption verification

### 4. Compliance Verification
- [ ] Nigerian SEC compliance check
- [ ] Data protection compliance
- [ ] Financial regulations compliance
- [ ] KYC/AML procedures

## 🆘 Troubleshooting

### Common Issues

1. **Hedera Connection Issues**
   - Check network configuration
   - Verify account balance
   - Validate private keys

2. **Payment Integration Issues**
   - Verify Paystack webhook configuration
   - Check Nigerian bank codes
   - Validate API keys

3. **Database Connection Issues**
   - Check MongoDB Atlas configuration
   - Verify IP whitelist
   - Check connection string

### Support Contacts

- Hedera Support: [help.hedera.com](https://help.hedera.com)
- Paystack Support: [support.paystack.com](https://support.paystack.com)
- MongoDB Support: [support.mongodb.com](https://support.mongodb.com)

## 📞 Emergency Procedures

### 1. Emergency Contacts
- Technical Lead: +234-XXX-XXX-XXXX
- DevOps Engineer: +234-XXX-XXX-XXXX
- Business Owner: +234-XXX-XXX-XXXX

### 2. Emergency Actions
- Smart contract pause procedure
- Payment system shutdown
- Database backup and restore
- Communication to users

---

**Deployment completed successfully! 🎉**

For ongoing support and maintenance, refer to the [MAINTENANCE.md](MAINTENANCE.md) guide.

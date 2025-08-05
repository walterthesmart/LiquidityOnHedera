# BFT Testnet Token Minting Utilities

This directory contains comprehensive utilities for minting BFT (Bitfinity Token) testnet tokens using the Bitfinity EVM JSON-RPC API. The utilities support the `ic_mintNativeToken` method with proper error handling, balance verification, and hexadecimal conversion.

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** (for JavaScript utilities)
- **curl, jq, bc** (for shell script utilities)
- Access to Bitfinity testnet

### Installation

```bash
# Navigate to scripts directory
cd scripts

# Install Node.js dependencies
npm install

# Make shell script executable (Linux/macOS)
chmod +x mint-bft-curl.sh
```

## 📋 Available Tools

### 1. Node.js Minting Utility (`mint-bft-tokens.js`)

**Primary tool with comprehensive features:**

```bash
# Basic usage
node mint-bft-tokens.js --address 0x1234567890123456789012345678901234567890 --amount 10

# Specify network (default: testnet)
node mint-bft-tokens.js --address 0x1234... --amount 10 --network testnet

# Dry run (test without minting)
node mint-bft-tokens.js --address 0x1234... --amount 10 --dry-run

# Help
node mint-bft-tokens.js --help
```

**Features:**
- ✅ Comprehensive error handling
- ✅ Balance verification (before/after)
- ✅ Transaction confirmation waiting
- ✅ Hexadecimal conversion utilities
- ✅ Network configuration management
- ✅ Explorer links for transactions

### 2. Balance Checker (`balance-checker.js`)

**Quick balance verification:**

```bash
# Check balance
node balance-checker.js --address 0x1234567890123456789012345678901234567890

# Specify network
node balance-checker.js --address 0x1234... --network testnet
```

### 3. Curl-based Script (`mint-bft-curl.sh`)

**Shell script alternative using curl:**

```bash
# Basic usage
./mint-bft-curl.sh 0x1234567890123456789012345678901234567890 10

# Specify network
./mint-bft-curl.sh 0x1234... 10 testnet

# For mainnet (use with caution)
./mint-bft-curl.sh 0x1234... 10 mainnet
```

**Requirements:**
- `curl` - HTTP client
- `jq` - JSON processor
- `bc` - Calculator for decimal arithmetic

### 4. Test Suite (`test-minting.js`)

**Validate utilities functionality:**

```bash
node test-minting.js
```

## 🌐 Network Configuration

### Bitfinity Testnet
- **Chain ID**: 355113
- **RPC URL**: https://testnet.bitfinity.network
- **Explorer**: https://explorer.testnet.bitfinity.network
- **Currency**: BTF

### Bitfinity Mainnet
- **Chain ID**: 355110
- **RPC URL**: https://mainnet.bitfinity.network
- **Explorer**: https://explorer.bitfinity.network
- **Currency**: BTF

## 🔧 Technical Details

### JSON-RPC Methods Used

#### 1. `ic_mint_native_token`
Mints native BFT tokens to a specified address.

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "ic_mint_native_token",
  "params": [
    "0x1234567890123456789012345678901234567890",  // target address
    "0xde0b6b3a7640000"                            // amount in hex wei
  ],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": "0xabcdef1234567890...",  // transaction hash
  "id": 1
}
```

#### 2. `eth_getBalance`
Retrieves the current balance of an address.

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": [
    "0x1234567890123456789012345678901234567890",  // address
    "latest"                                       // block parameter
  ],
  "id": 1
}
```

### Hexadecimal Amount Format

BFT tokens use 18 decimal places (like ETH). Amounts must be converted to wei and then to hexadecimal:

**Conversion Examples:**
- `1 BTF` = `1000000000000000000 wei` = `0xde0b6b3a7640000`
- `10 BTF` = `10000000000000000000 wei` = `0x8ac7230489e80000`
- `0.1 BTF` = `100000000000000000 wei` = `0x16345785d8a0000`

**JavaScript Conversion:**
```javascript
// Decimal to hex wei
function toHexWei(amount) {
  const wei = BigInt(Math.floor(parseFloat(amount) * 1e18));
  return '0x' + wei.toString(16);
}

// Hex wei to decimal
function fromHexWei(hexWei) {
  const wei = BigInt(hexWei);
  return (Number(wei) / 1e18).toFixed(6);
}
```

**Shell Conversion:**
```bash
# Decimal to hex wei
decimal_to_hex_wei() {
    local amount=$1
    local wei=$(echo "$amount * 1000000000000000000" | bc)
    printf "0x%x" $wei
}
```

## 📝 Usage Examples

### Example 1: Mint 10 BTF Tokens

```bash
# Using Node.js utility
node mint-bft-tokens.js \
  --address 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 \
  --amount 10 \
  --network testnet

# Using curl script
./mint-bft-curl.sh 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 10 testnet
```

**Expected Output:**
```
🚀 BFT Token Minting Utility
=====================================
Network: Bitfinity Testnet
RPC URL: https://testnet.bitfinity.network
Target Address: 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87
Amount: 10 BTF
=====================================

📊 Checking balance for 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87...
   Current balance: 5.000000 BTF

🪙 Minting 10 BTF to 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87...
   Amount in hex wei: 0x8ac7230489e80000
   ✅ Minting successful!
   Transaction hash: 0xabc123...

📈 Minting Summary:
   Initial Balance: 5.000000 BTF
   Final Balance: 15.000000 BTF
   Balance Increase: 10.000000 BTF
   Transaction: https://explorer.testnet.bitfinity.network/tx/0xabc123...
   ✅ Minting verified successfully!
```

### Example 2: Check Balance Only

```bash
node balance-checker.js --address 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87
```

### Example 3: Dry Run (Test Configuration)

```bash
node mint-bft-tokens.js \
  --address 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 \
  --amount 10 \
  --dry-run
```

## 🛡️ Error Handling

The utilities include comprehensive error handling for common issues:

### Address Validation
- Invalid format detection
- Checksum validation
- Empty address handling

### Network Issues
- Connection timeouts
- Invalid responses
- Network unavailability

### Transaction Errors
- Insufficient permissions
- Invalid parameters
- Gas estimation failures

### Example Error Output
```
❌ Minting failed: JSON-RPC Error: insufficient funds for gas * price + value (Code: -32000)
```

## 🧪 Testing

Run the test suite to validate functionality:

```bash
node test-minting.js
```

**Test Coverage:**
- ✅ Hexadecimal conversion functions
- ✅ Address validation
- ✅ Network configuration
- ✅ Edge cases (small/large amounts)
- ✅ Utility functions

## 🔒 Security Considerations

### Testnet Only
- These utilities are designed for **testnet use only**
- Exercise extreme caution when using with mainnet
- Always verify network configuration before minting

### Address Verification
- Always double-check target addresses
- Use checksummed addresses when possible
- Verify ownership of target addresses

### Amount Validation
- Start with small test amounts
- Verify decimal/hex conversions
- Monitor balance changes

## 📚 Integration with Your Project

### Using in Hardhat Scripts

```javascript
const { mintTokens, getBalance } = require('./scripts/mint-bft-tokens');

// In your deployment script
async function setupTestEnvironment() {
  const [deployer] = await ethers.getSigners();
  
  // Mint test tokens
  await mintTokens({
    address: deployer.address,
    amount: '100',
    network: 'testnet'
  });
}
```

### Using in Frontend Applications

```javascript
import { toHexWei, fromHexWei } from './scripts/mint-bft-tokens';

// Convert user input to hex wei for transactions
const userAmount = '10.5';
const hexAmount = toHexWei(userAmount);

// Display balance in readable format
const balanceHex = '0x8ac7230489e80000';
const balanceDecimal = fromHexWei(balanceHex);
```

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid address format"**
   - Ensure address starts with `0x`
   - Verify address is exactly 42 characters
   - Check for typos in the address

2. **"Network connection failed"**
   - Verify internet connectivity
   - Check if Bitfinity testnet is accessible
   - Try again after a few moments

3. **"Minting failed: insufficient permissions"**
   - This method may require special permissions
   - Contact Bitfinity support for testnet access

4. **"jq: command not found" (curl script)**
   - Install jq: `sudo apt-get install jq` (Ubuntu/Debian)
   - Or use the Node.js version instead

## 📞 Support

For issues related to:
- **Utilities**: Check the test suite and error messages
- **Bitfinity Network**: Visit https://docs.bitfinity.network/
- **JSON-RPC API**: Refer to Bitfinity documentation

## 🎯 Quick Reference

### Essential Commands

```bash
# Install dependencies
cd scripts && npm install

# Test utilities
node test-minting.js

# Mint tokens (replace with your address)
node mint-bft-tokens.js --address 0xYourAddress --amount 10

# Check balance
node balance-checker.js --address 0xYourAddress

# Dry run (test configuration)
node mint-bft-tokens.js --address 0xYourAddress --amount 10 --dry-run
```

### Key Conversion Examples

| Decimal Amount | Hex Wei Value | Use Case |
|----------------|---------------|----------|
| 1 BTF | 0xde0b6b3a7640000 | Basic testing |
| 10 BTF | 0x8ac7230489e80000 | Standard testing |
| 100 BTF | 0x56bc75e2d63100000 | Heavy testing |
| 0.1 BTF | 0x16345785d8a0000 | Micro transactions |
| 0.001 BTF | 0x38d7ea4c68000 | Minimal amounts |

## 📄 License

MIT License - See project root for details.

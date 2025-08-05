# Send & Receive Tokens Component

## Overview

The `SendReceiveTokens` component is a comprehensive UI for transferring NGN stablecoin and Nigerian stock tokens between users. It provides an intuitive interface for sending tokens, receiving tokens via QR codes, and viewing transaction history.

## Features

### 🚀 **Send Functionality**
- **Token Selection**: Choose between NGN stablecoin and various Nigerian stock tokens (DANGCEM, MTNN, etc.)
- **Address Validation**: Real-time validation of Ethereum addresses with visual feedback
- **Amount Input**: Numeric input with MAX button for quick balance selection
- **Balance Display**: Shows available balance for selected token
- **Transaction Execution**: Secure contract interaction with loading states

### 📥 **Receive Functionality**
- **Wallet Address Display**: Shows user's wallet address with copy-to-clipboard
- **QR Code Generation**: Real-time QR code generation for easy address sharing
- **Visual Feedback**: Copy confirmation with success indicators

### 📊 **Transaction History**
- **Recent Transactions**: Display of sent/received transactions
- **Status Tracking**: Visual status indicators (pending, confirmed, failed)
- **Explorer Links**: Direct links to blockchain explorers for transaction details
- **Formatted Addresses**: Truncated addresses for better readability

### 🔄 **Balance Management**
- **Real-time Balances**: Automatic fetching of token balances
- **Refresh Functionality**: Manual refresh button for balance updates
- **Multi-token Support**: Support for NGN and multiple stock tokens

## Technical Implementation

### **Components Used**
- `Card` - Main container with header and content
- `Tabs` - Navigation between Send, Receive, and History
- `Select` - Token selection dropdown
- `Input` - Address and amount inputs with validation
- `Button` - Action buttons with loading states
- `Badge` - Token type and status indicators
- `QRCode` - Custom QR code component using qrcode library

### **Hooks & State Management**
- `useTokenBalances` - Custom hook for fetching and managing token balances
- `useAccount` - Wagmi hook for wallet connection
- `useWriteContract` - Wagmi hook for contract interactions
- `useState` - Local state for form inputs and UI state

### **Contract Integration**
- **NGN Stablecoin**: ERC20 transfer functionality
- **Stock Tokens**: ERC20 transfer for Nigerian stock tokens
- **Multi-network Support**: Works on Sepolia and Bitfinity networks
- **Gas Estimation**: Automatic gas estimation for transactions

## Usage

### **Installation**
The component is already integrated into the dashboard. Dependencies include:
```bash
npm install qrcode @types/qrcode
```

### **Integration**
```tsx
import { SendReceiveTokens } from "./components/send-receive-tokens";

// In your dashboard component
<SendReceiveTokens />
```

### **Required Context**
- Wallet connection (via Wagmi/RainbowKit)
- Contract addresses configuration
- Network switching capability

## Security Features

### **Input Validation**
- Ethereum address format validation
- Amount validation (positive numbers only)
- Balance checking before transactions
- Real-time error feedback

### **Transaction Safety**
- Transaction confirmation before execution
- Clear transaction details display
- Error handling with user-friendly messages
- Network-specific explorer links

### **Access Control**
- Wallet connection requirement
- Contract-level access controls
- Secure contract interactions

## Styling & UX

### **Design System**
- Consistent with existing platform aesthetic
- Mobile-responsive layout
- Clean, modern interface
- Intuitive navigation

### **Visual Feedback**
- Loading states for all async operations
- Success/error toast notifications
- Status indicators for transactions
- Copy confirmation animations

### **Accessibility**
- Keyboard navigation support
- Screen reader friendly
- High contrast status indicators
- Clear error messages

## Network Support

### **Supported Networks**
- **Sepolia Testnet** (Chain ID: 11155111)
- **Bitfinity Testnet** (Chain ID: 355113)
- **Bitfinity Mainnet** (Chain ID: 355110)

### **Explorer Integration**
- Automatic explorer URL generation
- Network-specific transaction links
- Address and token links

## Error Handling

### **Common Errors**
- Invalid recipient address
- Insufficient balance
- Network connection issues
- Transaction failures

### **User Feedback**
- Toast notifications for all operations
- Inline validation messages
- Clear error descriptions
- Recovery suggestions

## Future Enhancements

### **Planned Features**
- Transaction fee estimation
- Batch transfers
- Address book functionality
- Transaction notes/memos
- Advanced filtering for history

### **Performance Optimizations**
- Balance caching
- Transaction history pagination
- Optimistic UI updates
- Background refresh

## File Structure

```
components/
├── send-receive-tokens.tsx     # Main component
├── ui/
│   ├── qr-code.tsx            # QR code generation
│   └── transaction-status.tsx  # Status indicators
hooks/
├── use-token-balances.ts      # Balance management
lib/
├── explorer-utils.ts          # Network utilities
```

## Dependencies

- **React 18+**
- **Wagmi** - Ethereum interactions
- **Ethers.js** - Utility functions
- **QRCode** - QR code generation
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Radix UI** - Base components

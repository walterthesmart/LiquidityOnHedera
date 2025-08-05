/**
 * Utility functions for blockchain explorer links
 */

export const getExplorerUrl = (chainId: number): string => {
  switch (chainId) {
    case 11155111: // Sepolia
      return "https://sepolia.etherscan.io";
    case 355113: // Bitfinity Testnet
      return "https://explorer.bitfinity.network";
    case 355110: // Bitfinity Mainnet
      return "https://explorer.bitfinity.network";
    case 1: // Ethereum Mainnet
      return "https://etherscan.io";
    default:
      return "https://etherscan.io";
  }
};

export const getTransactionUrl = (chainId: number, txHash: string): string => {
  const baseUrl = getExplorerUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
};

export const getAddressUrl = (chainId: number, address: string): string => {
  const baseUrl = getExplorerUrl(chainId);
  return `${baseUrl}/address/${address}`;
};

export const getTokenUrl = (chainId: number, tokenAddress: string): string => {
  const baseUrl = getExplorerUrl(chainId);
  return `${baseUrl}/token/${tokenAddress}`;
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 11155111:
      return "Sepolia Testnet";
    case 355113:
      return "Bitfinity Testnet";
    case 355110:
      return "Bitfinity Mainnet";
    case 1:
      return "Ethereum Mainnet";
    default:
      return "Unknown Network";
  }
};

export const isTestnet = (chainId: number): boolean => {
  return [11155111, 355113].includes(chainId);
};

export const formatAddress = (address: string, length: number = 6): string => {
  if (!address) return "";
  if (address.length <= length * 2 + 2) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

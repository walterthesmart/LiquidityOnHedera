/**
 * Network Switcher Hook
 *
 * Provides utilities for detecting current network, switching between networks,
 * and managing network-specific configurations for the liquidity project.
 * Supports Bitfinity EVM and Ethereum Sepolia networks.
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  getNetworkByChainId,
  getContractAddresses,
  isTestnet,
  formatNetworkName,
  getSupportedChainIds,
} from "@/lib/bitfinity-config";
import { getFactoryAddress, getTokenAddress, getAvailableTokens } from "@/abis";
import { toast } from "@/hooks/use-toast";

export interface NetworkInfo {
  chainId: number;
  name: string;
  isSupported: boolean;
  isTestnet: boolean;
  hasContracts: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  rpcUrl: string;
}

export interface NetworkSwitcherState {
  currentNetwork: NetworkInfo | null;
  supportedNetworks: NetworkInfo[];
  isConnected: boolean;
  isSwitching: boolean;
  error: string | null;
}

/**
 * Hook for network detection and switching
 */
export function useNetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();

  const [state, setState] = useState<NetworkSwitcherState>({
    currentNetwork: null,
    supportedNetworks: [],
    isConnected: false,
    isSwitching: false,
    error: null,
  });

  // Get network information by chain ID
  const getNetworkInfo = useCallback((chainId: number): NetworkInfo => {
    const networkConfig = getNetworkByChainId(chainId);
    const contractAddresses = getContractAddresses(chainId);
    const supportedChainIds = getSupportedChainIds();

    return {
      chainId,
      name: formatNetworkName(chainId),
      isSupported: supportedChainIds.includes(chainId),
      isTestnet: isTestnet(chainId),
      hasContracts: !!contractAddresses?.factoryAddress,
      nativeCurrency: networkConfig?.nativeCurrency || {
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
      },
      blockExplorer: networkConfig?.blockExplorer || "",
      rpcUrl: networkConfig?.rpcUrl || "",
    };
  }, []);

  // Get all supported networks
  const getSupportedNetworksInfo = useCallback((): NetworkInfo[] => {
    return getSupportedChainIds().map((chainId) => getNetworkInfo(chainId));
  }, [getNetworkInfo]);

  // Switch to a specific network
  const switchToNetwork = useCallback(
    async (targetChainId: number) => {
      if (!isConnected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet first.",
          variant: "destructive",
        });
        return false;
      }

      if (chainId === targetChainId) {
        toast({
          title: "Already Connected",
          description: `You're already connected to ${formatNetworkName(targetChainId)}.`,
        });
        return true;
      }

      setState((prev) => ({ ...prev, isSwitching: true, error: null }));

      try {
        await switchChain({ chainId: targetChainId });

        toast({
          title: "Network Switched",
          description: `Successfully switched to ${formatNetworkName(targetChainId)}.`,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to switch network";

        setState((prev) => ({ ...prev, error: errorMessage }));

        toast({
          title: "Network Switch Failed",
          description: errorMessage,
          variant: "destructive",
        });

        return false;
      } finally {
        setState((prev) => ({ ...prev, isSwitching: false }));
      }
    },
    [isConnected, chainId, switchChain],
  );

  // Switch to Bitfinity Testnet
  const switchToBitfinityTestnet = useCallback(() => {
    return switchToNetwork(355113);
  }, [switchToNetwork]);

  // Switch to Sepolia
  const switchToSepolia = useCallback(() => {
    return switchToNetwork(11155111);
  }, [switchToNetwork]);

  // Switch to local development network
  const switchToLocalhost = useCallback(() => {
    return switchToNetwork(31337);
  }, [switchToNetwork]);

  // Check if current network is supported
  const isCurrentNetworkSupported = useCallback(() => {
    return getSupportedChainIds().includes(chainId);
  }, [chainId]);

  // Check if current network has deployed contracts
  const hasDeployedContracts = useCallback(() => {
    const contractAddresses = getContractAddresses(chainId);
    return !!contractAddresses?.factoryAddress;
  }, [chainId]);

  // Get recommended network for new users
  const getRecommendedNetwork = useCallback((): NetworkInfo => {
    // Recommend Bitfinity Testnet for new users
    return getNetworkInfo(355113);
  }, [getNetworkInfo]);

  // Update state when network or connection changes
  useEffect(() => {
    const currentNetwork = chainId ? getNetworkInfo(chainId) : null;
    const supportedNetworks = getSupportedNetworksInfo();

    setState((prev) => ({
      ...prev,
      currentNetwork,
      supportedNetworks,
      isConnected,
      isSwitching: isSwitchPending,
    }));
  }, [
    chainId,
    isConnected,
    isSwitchPending,
    getNetworkInfo,
    getSupportedNetworksInfo,
  ]);

  // Clear error when network changes successfully
  useEffect(() => {
    if (chainId && state.error) {
      setState((prev) => ({ ...prev, error: null }));
    }
  }, [chainId, state.error]);

  return {
    // State
    ...state,

    // Network info
    currentChainId: chainId,
    isCurrentNetworkSupported: isCurrentNetworkSupported(),
    hasDeployedContracts: hasDeployedContracts(),

    // Actions
    switchToNetwork,
    switchToBitfinityTestnet,
    switchToSepolia,
    switchToLocalhost,

    // Utilities
    getNetworkInfo,
    getRecommendedNetwork,
    formatNetworkName: (chainId: number) => formatNetworkName(chainId),
  };
}

/**
 * Hook for network-specific contract addresses
 */
export function useNetworkContracts() {
  const chainId = useChainId();

  const contractAddresses = getContractAddresses(chainId);
  const factoryAddress = getFactoryAddress(chainId);
  const hasContracts = !!factoryAddress;

  return {
    chainId,
    contractAddresses,
    hasContracts,
    factoryAddress,
    tokenAddresses: contractAddresses?.tokens || {},
  };
}

/**
 * Hook for network-aware token operations
 */
export function useNetworkAwareTokens() {
  const { hasContracts, chainId } = useNetworkContracts();
  const { currentNetwork } = useNetworkSwitcher();

  // Get available tokens for current network
  const getNetworkAvailableTokens = useCallback(() => {
    if (!hasContracts) {
      return [];
    }

    const availableTokenSymbols = getAvailableTokens(chainId);
    return availableTokenSymbols.map((symbol) => ({
      symbol,
      address: getTokenAddress(chainId, symbol),
      chainId,
      networkName: currentNetwork?.name || "Unknown",
    }));
  }, [hasContracts, chainId, currentNetwork]);

  // Check if a specific token is available on current network
  const isTokenAvailable = useCallback(
    (symbol: string) => {
      return getAvailableTokens(chainId).includes(symbol);
    },
    [chainId],
  );

  // Get token address by symbol
  const getNetworkTokenAddress = useCallback(
    (symbol: string) => {
      return getTokenAddress(chainId, symbol);
    },
    [chainId],
  );

  return {
    availableTokens: getNetworkAvailableTokens(),
    isTokenAvailable,
    getTokenAddress: getNetworkTokenAddress,
    hasContracts,
    chainId,
  };
}

/**
 * Hook for faucet information based on current network
 */
export function useNetworkFaucets() {
  const chainId = useChainId();
  const { currentNetwork } = useNetworkSwitcher();

  const getFaucetInfo = useCallback(() => {
    if (!currentNetwork?.isTestnet) {
      return [];
    }

    switch (chainId) {
      case 11155111: // Sepolia
        return [
          {
            name: "Sepolia Faucet",
            url: "https://sepoliafaucet.com/",
            description: "Official Sepolia faucet - requires Alchemy account",
          },
          {
            name: "Infura Sepolia Faucet",
            url: "https://www.infura.io/faucet/sepolia",
            description: "Infura Sepolia faucet - requires Infura account",
          },
          {
            name: "QuickNode Sepolia Faucet",
            url: "https://faucet.quicknode.com/ethereum/sepolia",
            description: "QuickNode Sepolia faucet - no account required",
          },
        ];

      case 355113: // Bitfinity Testnet
        return [
          {
            name: "Bitfinity Testnet Faucet",
            url: "https://faucet.testnet.bitfinity.network/",
            description: "Official Bitfinity testnet faucet",
          },
        ];

      default:
        return [];
    }
  }, [chainId, currentNetwork]);

  return {
    faucets: getFaucetInfo(),
    isTestnet: currentNetwork?.isTestnet || false,
    nativeCurrency: currentNetwork?.nativeCurrency?.symbol || "ETH",
  };
}

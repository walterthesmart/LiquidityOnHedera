"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { formatEther } from "ethers";
import {
  NGNStablecoinABI,
  NigerianStockTokenABI,
  CONTRACT_ADDRESSES,
} from "@/abis";

export interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  name: string;
  decimals: number;
  isStablecoin: boolean;
}

export const useTokenBalances = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  // Get contract addresses for current network
  const contractAddresses = chainId ? CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] : null;

  // NGN Stablecoin balance with error handling and retry logic
  const { data: ngnBalance, refetch: refetchNGN } = useReadContract({
    address: contractAddresses?.ngnStablecoin as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!contractAddresses?.ngnStablecoin,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  // Popular stock tokens to check balances for
  const popularTokens = useMemo(() => [
    { symbol: "DANGCEM", name: "Dangote Cement" },
    { symbol: "MTNN", name: "MTN Nigeria" },
    { symbol: "ZENITHBANK", name: "Zenith Bank" },
    { symbol: "GTCO", name: "Guaranty Trust Bank" },
    { symbol: "ACCESS", name: "Access Bank" },
    { symbol: "FBNH", name: "FBN Holdings" },
    { symbol: "UBA", name: "United Bank for Africa" },
    { symbol: "NESTLE", name: "Nestle Nigeria" },
    { symbol: "BUACEMENT", name: "BUA Cement" },
    { symbol: "AIRTELAFRI", name: "Airtel Africa" },
  ], []);

  // Type-safe access to token addresses
  const tokens = contractAddresses?.tokens as Record<string, string> | undefined;

  // Individual stock token balance hooks with error handling and retry logic
  const dangcemBalance = useReadContract({
    address: tokens?.DANGCEM as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.DANGCEM,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  const mtnnBalance = useReadContract({
    address: tokens?.MTNN as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.MTNN,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const zenithbankBalance = useReadContract({
    address: tokens?.ZENITHBANK as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.ZENITHBANK,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const gtcoBalance = useReadContract({
    address: tokens?.GTCO as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.GTCO,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const accessBalance = useReadContract({
    address: tokens?.ACCESS as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.ACCESS,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const fbnhBalance = useReadContract({
    address: tokens?.FBNH as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.FBNH,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const ubaBalance = useReadContract({
    address: tokens?.UBA as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.UBA,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const nestleBalance = useReadContract({
    address: tokens?.NESTLE as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.NESTLE,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const buacementBalance = useReadContract({
    address: tokens?.BUACEMENT as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.BUACEMENT,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const airtelafriBalance = useReadContract({
    address: tokens?.AIRTELAFRI as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!tokens?.AIRTELAFRI,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  });

  // Map of token balances for easy access
  const tokenBalanceMap = useMemo(() => ({
    DANGCEM: dangcemBalance,
    MTNN: mtnnBalance,
    ZENITHBANK: zenithbankBalance,
    GTCO: gtcoBalance,
    ACCESS: accessBalance,
    FBNH: fbnhBalance,
    UBA: ubaBalance,
    NESTLE: nestleBalance,
    BUACEMENT: buacementBalance,
    AIRTELAFRI: airtelafriBalance,
  }), [
    dangcemBalance,
    mtnnBalance,
    zenithbankBalance,
    gtcoBalance,
    accessBalance,
    fbnhBalance,
    ubaBalance,
    nestleBalance,
    buacementBalance,
    airtelafriBalance,
  ]);

  // Load all token balances - using useMemo to prevent infinite loops
  const loadedTokenBalances = useMemo(() => {
    if (!address || !contractAddresses) {
      return [];
    }

    const balances: TokenBalance[] = [];

    // Add NGN Stablecoin
    if (ngnBalance) {
      balances.push({
        symbol: "NGN",
        balance: formatEther(ngnBalance.toString()),
        address: contractAddresses.ngnStablecoin,
        name: "Nigerian Naira Stablecoin",
        decimals: 18,
        isStablecoin: true,
      });
    }

    // Add stock tokens using individual balance hooks
    for (const token of popularTokens) {
      const tokenAddress = tokens?.[token.symbol];
      const balanceHook = tokenBalanceMap[token.symbol as keyof typeof tokenBalanceMap];

      if (tokenAddress && balanceHook?.data) {
        balances.push({
          symbol: token.symbol,
          balance: formatEther(balanceHook.data.toString()),
          address: tokenAddress,
          name: token.name,
          decimals: 18,
          isStablecoin: false,
        });
      } else if (tokenAddress) {
        // Include token even if balance is 0 or not loaded yet
        balances.push({
          symbol: token.symbol,
          balance: "0",
          address: tokenAddress,
          name: token.name,
          decimals: 18,
          isStablecoin: false,
        });
      }
    }

    return balances;
  }, [address, contractAddresses, ngnBalance, popularTokens, tokens, tokenBalanceMap]);

  // Calculate loading state based on individual hook states
  const isLoading = useMemo(() => {
    return (
      dangcemBalance.isLoading ||
      mtnnBalance.isLoading ||
      zenithbankBalance.isLoading ||
      gtcoBalance.isLoading ||
      accessBalance.isLoading ||
      fbnhBalance.isLoading ||
      ubaBalance.isLoading ||
      nestleBalance.isLoading ||
      buacementBalance.isLoading ||
      airtelafriBalance.isLoading
    );
  }, [
    dangcemBalance.isLoading,
    mtnnBalance.isLoading,
    zenithbankBalance.isLoading,
    gtcoBalance.isLoading,
    accessBalance.isLoading,
    fbnhBalance.isLoading,
    ubaBalance.isLoading,
    nestleBalance.isLoading,
    buacementBalance.isLoading,
    airtelafriBalance.isLoading,
  ]);

  // Calculate error state
  const error = useMemo(() => {
    const errors = [
      dangcemBalance.error,
      mtnnBalance.error,
      zenithbankBalance.error,
      gtcoBalance.error,
      accessBalance.error,
      fbnhBalance.error,
      ubaBalance.error,
      nestleBalance.error,
      buacementBalance.error,
      airtelafriBalance.error,
    ].filter(Boolean);

    return errors.length > 0 ? `Failed to load some token balances: ${errors.length} errors` : null;
  }, [
    dangcemBalance.error,
    mtnnBalance.error,
    zenithbankBalance.error,
    gtcoBalance.error,
    accessBalance.error,
    fbnhBalance.error,
    ubaBalance.error,
    nestleBalance.error,
    buacementBalance.error,
    airtelafriBalance.error,
  ]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    await refetchNGN();
    // Refetch all token balances
    await Promise.all([
      dangcemBalance.refetch(),
      mtnnBalance.refetch(),
      zenithbankBalance.refetch(),
      gtcoBalance.refetch(),
      accessBalance.refetch(),
      fbnhBalance.refetch(),
      ubaBalance.refetch(),
      nestleBalance.refetch(),
      buacementBalance.refetch(),
      airtelafriBalance.refetch(),
    ]);
  }, [
    refetchNGN,
    dangcemBalance,
    mtnnBalance,
    zenithbankBalance,
    gtcoBalance,
    accessBalance,
    fbnhBalance,
    ubaBalance,
    nestleBalance,
    buacementBalance,
    airtelafriBalance,
  ]);

  // Get balance for specific token
  const getTokenBalance = useCallback((symbol: string) => {
    return loadedTokenBalances.find((token: TokenBalance) => token.symbol === symbol);
  }, [loadedTokenBalances]);

  // Get total portfolio value (in NGN)
  const getTotalValue = useCallback(() => {
    const ngnBalance = getTokenBalance("NGN");
    const ngnValue = ngnBalance ? parseFloat(ngnBalance.balance) : 0;

    // For stock tokens, we'd need current prices to calculate total value
    // For now, just return NGN balance
    return ngnValue;
  }, [getTokenBalance]);

  return {
    tokenBalances: loadedTokenBalances,
    isLoading,
    error,
    refreshBalances,
    getTokenBalance,
    getTotalValue,
    hasBalances: loadedTokenBalances.length > 0,
  };
};

export default useTokenBalances;

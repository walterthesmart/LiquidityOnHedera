/**
 * React hooks for Bitfinity EVM token integration
 * Provides easy access to deployed Nigerian stock tokens on Bitfinity EVM
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { bitfinityEVM, formatTokenAmount } from "@/lib/bitfinity-evm";
import { getStockBySymbol, NigerianStockData } from "@/lib/bitfinity-config";

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  companyName: string;
  totalSupply: string;
  maxSupply: string;
  decimals: number;
  balance?: string;
  formattedBalance?: string;
  stockData?: NigerianStockData;
}

export interface UseBitfinityTokenReturn {
  token: TokenInfo | null;
  loading: boolean;
  error: string | null;
  isDeployed: boolean;
  explorerUrl: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get information about a specific Nigerian stock token
 */
export function useBitfinityToken(symbol: string): UseBitfinityTokenReturn {
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address: userAddress } = useAccount();

  const fetchTokenInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenInfo = await bitfinityEVM.getTokenInfo(symbol);
      if (
        !tokenInfo ||
        tokenInfo.tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        setToken(null);
        return;
      }

      let balance = "0";
      if (userAddress) {
        balance = await bitfinityEVM.getTokenBalance(
          tokenInfo.tokenAddress as Address,
          userAddress,
        );
      }

      const stockData = getStockBySymbol(symbol);

      setToken({
        address: tokenInfo.tokenAddress as Address,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        companyName: tokenInfo.companyName,
        totalSupply: tokenInfo.totalSupply,
        maxSupply: tokenInfo.maxSupply,
        decimals: tokenInfo.decimals,
        balance,
        formattedBalance: formatTokenAmount(balance),
        stockData,
      });
    } catch (err) {
      console.error("Error fetching token info:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch token info",
      );
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, userAddress]);

  useEffect(() => {
    if (symbol) {
      fetchTokenInfo();
    }
  }, [symbol, fetchTokenInfo]);

  const isDeployed = token !== null;
  const explorerUrl = token ? bitfinityEVM.getTokenUrl(token.address) : null;

  return {
    token,
    loading,
    error,
    isDeployed,
    explorerUrl,
    refetch: fetchTokenInfo,
  };
}

/**
 * Hook to get all deployed Nigerian stock tokens
 */
export function useAllBitfinityTokens() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address: userAddress } = useAccount();

  const fetchAllTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenAddresses = await bitfinityEVM.getAllTokens();
      const tokenInfos: TokenInfo[] = [];

      for (const address of tokenAddresses) {
        try {
          // Get token info from contract
          const tokenInfo = await bitfinityEVM.getTokenInfo(""); // We'll need to modify this
          if (tokenInfo) {
            let balance = "0";
            if (userAddress) {
              balance = await bitfinityEVM.getTokenBalance(
                address,
                userAddress,
              );
            }

            const stockData = getStockBySymbol(tokenInfo.symbol);

            tokenInfos.push({
              address,
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              companyName: tokenInfo.companyName,
              totalSupply: tokenInfo.totalSupply,
              maxSupply: tokenInfo.maxSupply,
              decimals: tokenInfo.decimals,
              balance,
              formattedBalance: formatTokenAmount(balance),
              stockData,
            });
          }
        } catch (err) {
          console.error(`Error fetching info for token ${address}:`, err);
        }
      }

      setTokens(tokenInfos);
    } catch (err) {
      console.error("Error fetching all tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchAllTokens();
  }, [fetchAllTokens]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchAllTokens,
  };
}

/**
 * Hook to get user's token balances
 */
export function useTokenBalances(symbols: string[]) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address: userAddress } = useAccount();

  const fetchBalances = useCallback(async () => {
    if (!userAddress || symbols.length === 0) {
      setBalances({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const balancePromises = symbols.map(async (symbol) => {
        try {
          const tokenAddress = bitfinityEVM.getTokenAddress(symbol);
          if (tokenAddress) {
            const balance = await bitfinityEVM.getTokenBalance(
              tokenAddress as `0x${string}`,
              userAddress,
            );
            return { symbol, balance };
          }
          return { symbol, balance: "0" };
        } catch (err) {
          console.error(`Error fetching balance for ${symbol}:`, err);
          return { symbol, balance: "0" };
        }
      });

      const results = await Promise.all(balancePromises);
      const balanceMap = results.reduce(
        (acc, { symbol, balance }) => {
          acc[symbol] = balance;
          return acc;
        },
        {} as Record<string, string>,
      );

      setBalances(balanceMap);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [userAddress, symbols]);

  // Extract complex expression to separate variable for static checking
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances, symbolsKey]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
}

/**
 * Hook to get tokens by sector
 */
export function useTokensBySector(sector: string) {
  const { tokens, loading, error, refetch } = useAllBitfinityTokens();

  const sectorTokens = useMemo(() => {
    return tokens.filter((token) => token.stockData?.sector === sector);
  }, [tokens, sector]);

  return {
    tokens: sectorTokens,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to search tokens
 */
export function useTokenSearch(query: string) {
  const { tokens, loading, error, refetch } = useAllBitfinityTokens();

  const searchResults = useMemo(() => {
    if (!query.trim()) return tokens;

    const lowercaseQuery = query.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(lowercaseQuery) ||
        token.name.toLowerCase().includes(lowercaseQuery) ||
        token.companyName.toLowerCase().includes(lowercaseQuery) ||
        token.stockData?.sector.toLowerCase().includes(lowercaseQuery),
    );
  }, [tokens, query]);

  return {
    tokens: searchResults,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get network information
 */
export function useBitfinityNetwork() {
  const networkConfig = bitfinityEVM.getNetworkConfig();

  return {
    network: networkConfig,
    explorerUrl: networkConfig.blockExplorer,
    chainId: networkConfig.chainId,
    nativeCurrency: networkConfig.nativeCurrency,
  };
}

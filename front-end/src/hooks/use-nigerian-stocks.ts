import { useQuery } from '@tanstack/react-query';
import { useContractConfig } from './use-contract-config';

export function useNigerianStocks() {
  const { chainId, hasContracts, networkStatus } = useContractConfig();

  return useQuery({
    queryKey: ['nigerian-stocks', chainId],
    queryFn: async () => {
      const response = await fetch(`/api/nigerian-stocks?action=stocks&chainId=${chainId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Nigerian stocks');
      }
      const data = await response.json();

      // Add network information to the response
      return {
        ...data,
        networkInfo: {
          chainId,
          hasContracts,
          networkStatus,
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: hasContracts, // Only fetch if we have deployed contracts
  });
}

export function useStockPrice(symbol: string) {
  const { chainId, hasContracts } = useContractConfig();

  return useQuery({
    queryKey: ['stock-price', symbol, chainId],
    queryFn: async () => {
      const response = await fetch(`/api/nigerian-stocks?action=prices&symbol=${symbol}&chainId=${chainId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${symbol}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // 15 seconds
    enabled: hasContracts && !!symbol,
  });
}

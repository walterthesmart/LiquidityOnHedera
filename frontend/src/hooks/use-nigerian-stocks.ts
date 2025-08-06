import { useQuery } from '@tanstack/react-query';
import { useContractConfig } from './use-contract-config';

// Import the local data files with live contract addresses
import stocksData from '../data/nigerian-stocks.json';
import tradingPairs from '../data/trading-pairs.json';
import marketData from '../data/market-data.json';
import contractsConfig from '../config/hedera-contracts.json';

export function useNigerianStocks() {
  const { chainId, hasContracts, networkStatus } = useContractConfig();

  return useQuery({
    queryKey: ['nigerian-stocks', chainId],
    queryFn: async () => {
      // Use local data for now, can be switched to API later
      const data = {
        stocks: stocksData.stocks,
        totalStocks: stocksData.totalStocks,
        lastUpdated: stocksData.lastUpdated,
        contracts: contractsConfig.contracts,
        stockTokens: contractsConfig.stockTokens,
        networkInfo: {
          chainId,
          hasContracts,
          networkStatus,
          network: contractsConfig.network
        }
      };

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: true, // Always enabled since we're using local data
  });
}

export function useStockPrice(symbol: string) {
  const { chainId, hasContracts } = useContractConfig();

  return useQuery({
    queryKey: ['stock-price', symbol, chainId],
    queryFn: async () => {
      // Find the stock in our local data
      const stock = stocksData.stocks.find(s => s.symbol === symbol);
      if (!stock) {
        throw new Error(`Stock ${symbol} not found`);
      }

      return {
        symbol: stock.symbol,
        price: stock.price,
        change: stock.change,
        volume: stock.volume,
        marketCap: stock.marketCap,
        lastUpdated: new Date().toISOString()
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // 15 seconds
    enabled: !!symbol,
  });
}

export function useTradingPairs() {
  const { chainId } = useContractConfig();

  return useQuery({
    queryKey: ['trading-pairs', chainId],
    queryFn: async () => {
      return {
        pairs: tradingPairs.pairs,
        totalPairs: tradingPairs.totalPairs,
        lastUpdated: tradingPairs.lastUpdated
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: true,
  });
}

export function useMarketData() {
  const { chainId } = useContractConfig();

  return useQuery({
    queryKey: ['market-data', chainId],
    queryFn: async () => {
      return {
        ...marketData,
        lastUpdated: new Date().toISOString()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: true,
  });
}

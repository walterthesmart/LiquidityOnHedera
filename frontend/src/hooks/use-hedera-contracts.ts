import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hederaContractService } from '@/lib/hedera-contract-service';

export function useHederaContracts() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await hederaContractService.connect(window.ethereum);
        if (signer) {
          const address = await signer.getAddress();
          setUserAddress(address);
          setIsConnected(true);
          return address;
        }
      }
      throw new Error('No wallet found');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, []);

  // Get NGN balance
  const { data: ngnBalance, refetch: refetchNGNBalance } = useQuery({
    queryKey: ['ngnBalance', userAddress],
    queryFn: () => userAddress ? hederaContractService.getNGNBalance(userAddress) : '0',
    enabled: !!userAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get stock balances
  const useStockBalance = (symbol: string) => {
    return useQuery({
      queryKey: ['stockBalance', symbol, userAddress],
      queryFn: () => userAddress ? hederaContractService.getStockBalance(symbol, userAddress) : '0',
      enabled: !!userAddress && !!symbol,
      refetchInterval: 30000,
    });
  };

  // Get stock info
  const useStockInfo = (symbol: string) => {
    return useQuery({
      queryKey: ['stockInfo', symbol],
      queryFn: () => hederaContractService.getStockInfo(symbol),
      enabled: !!symbol,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get stock price
  const useStockPrice = (symbol: string) => {
    return useQuery({
      queryKey: ['stockPrice', symbol],
      queryFn: () => hederaContractService.getStockPrice(symbol),
      enabled: !!symbol,
      refetchInterval: 15000, // Refetch every 15 seconds
    });
  };

  // Mint NGN mutation
  const mintNGNMutation = useMutation({
    mutationFn: ({ to, amount }: { to: string; amount: string }) =>
      hederaContractService.mintNGN(to, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngnBalance'] });
    },
  });

  // Swap NGN for Stock mutation
  const swapNGNForStockMutation = useMutation({
    mutationFn: ({ 
      stockSymbol, 
      ngnAmount, 
      minStockAmount 
    }: { 
      stockSymbol: string; 
      ngnAmount: string; 
      minStockAmount: string; 
    }) =>
      hederaContractService.swapNGNForStock(stockSymbol, ngnAmount, minStockAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngnBalance'] });
      queryClient.invalidateQueries({ queryKey: ['stockBalance'] });
    },
  });

  // Swap Stock for NGN mutation
  const swapStockForNGNMutation = useMutation({
    mutationFn: ({ 
      stockSymbol, 
      stockAmount, 
      minNGNAmount 
    }: { 
      stockSymbol: string; 
      stockAmount: string; 
      minNGNAmount: string; 
    }) =>
      hederaContractService.swapStockForNGN(stockSymbol, stockAmount, minNGNAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngnBalance'] });
      queryClient.invalidateQueries({ queryKey: ['stockBalance'] });
    },
  });

  // Get deployed contracts info
  const { data: contractsInfo } = useQuery({
    queryKey: ['contractsInfo'],
    queryFn: () => hederaContractService.getDeployedContracts(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Check deployment status
  const isFullyDeployed = hederaContractService.isFullyDeployed();
  const availableStocks = hederaContractService.getAvailableStocks();

  return {
    // Connection state
    isConnected,
    userAddress,
    connectWallet,

    // Balances
    ngnBalance: ngnBalance || '0',
    refetchNGNBalance,
    useStockBalance,

    // Contract info
    useStockInfo,
    useStockPrice,
    contractsInfo,
    isFullyDeployed,
    availableStocks,

    // Mutations
    mintNGN: mintNGNMutation.mutate,
    mintNGNStatus: mintNGNMutation.status,
    mintNGNError: mintNGNMutation.error,

    swapNGNForStock: swapNGNForStockMutation.mutate,
    swapNGNForStockStatus: swapNGNForStockMutation.status,
    swapNGNForStockError: swapNGNForStockMutation.error,

    swapStockForNGN: swapStockForNGNMutation.mutate,
    swapStockForNGNStatus: swapStockForNGNMutation.status,
    swapStockForNGNError: swapStockForNGNMutation.error,

    // Utility functions
    getExplorerUrl: hederaContractService.getExplorerUrl,
    getContractExplorerUrl: hederaContractService.getContractExplorerUrl,
    getStockConfig: hederaContractService.getStockConfig,
  };
}

// Hook for individual stock operations
export function useStock(symbol: string) {
  const contracts = useHederaContracts();
  const stockBalance = contracts.useStockBalance(symbol);
  const stockInfo = contracts.useStockInfo(symbol);
  const stockPrice = contracts.useStockPrice(symbol);

  return {
    symbol,
    balance: stockBalance.data || '0',
    info: stockInfo.data,
    price: stockPrice.data || '0',
    isLoading: stockBalance.isLoading || stockInfo.isLoading || stockPrice.isLoading,
    error: stockBalance.error || stockInfo.error || stockPrice.error,
    refetch: () => {
      stockBalance.refetch();
      stockInfo.refetch();
      stockPrice.refetch();
    },
    config: contracts.getStockConfig(symbol),
  };
}

// Hook for portfolio overview
export function usePortfolio() {
  const contracts = useHederaContracts();
  const { availableStocks, userAddress } = contracts;

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;

      const portfolio = await Promise.all(
        availableStocks.map(async (symbol) => {
          const [balance, info, price] = await Promise.all([
            hederaContractService.getStockBalance(symbol, userAddress),
            hederaContractService.getStockInfo(symbol),
            hederaContractService.getStockPrice(symbol),
          ]);

          const balanceNum = parseFloat(balance);
          const priceNum = parseFloat(price);
          const value = balanceNum * priceNum;

          return {
            symbol,
            balance,
            price,
            value: value.toString(),
            info,
            config: hederaContractService.getStockConfig(symbol),
          };
        })
      );

      const totalValue = portfolio.reduce((sum, stock) => sum + parseFloat(stock.value), 0);

      return {
        stocks: portfolio.filter(stock => parseFloat(stock.balance) > 0),
        totalValue: totalValue.toString(),
        ngnBalance: contracts.ngnBalance,
      };
    },
    enabled: !!userAddress && availableStocks.length > 0,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    portfolio: portfolioQuery.data,
    isLoading: portfolioQuery.isLoading,
    error: portfolioQuery.error,
    refetch: portfolioQuery.refetch,
  };
}

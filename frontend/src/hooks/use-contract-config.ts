import { useChainId, useAccount } from 'wagmi';
import { getContractConfig, getTokenAddress, getAvailableTokens, PRIMARY_CHAIN_ID } from '@/config/contracts';

export function useContractConfig() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Use primary network (Sepolia) if not connected or no contracts on current network
  const effectiveChainId = isConnected ? chainId : PRIMARY_CHAIN_ID;
  const contractConfig = getContractConfig(effectiveChainId);
  
  // Fallback to primary network if current network has no contracts
  const finalChainId = contractConfig && contractConfig.totalTokens > 0 ? effectiveChainId : PRIMARY_CHAIN_ID;
  const finalConfig = getContractConfig(finalChainId);

  return {
    chainId: finalChainId,
    config: finalConfig,
    factoryAddress: finalConfig?.factoryAddress || '',
    tokens: finalConfig?.tokens || {},
    totalTokens: finalConfig?.totalTokens || 0,
    blockExplorer: finalConfig?.blockExplorer || '',
    hasContracts: (finalConfig?.totalTokens || 0) > 0,
    isPrimaryNetwork: finalChainId === PRIMARY_CHAIN_ID,
    isConnectedToSupportedNetwork: isConnected && contractConfig && contractConfig.totalTokens > 0,
    
    // Helper functions
    getTokenAddress: (symbol: string) => getTokenAddress(finalChainId, symbol),
    getAvailableTokens: () => getAvailableTokens(finalChainId),
    
    // Network status
    networkStatus: {
      isConnected,
      currentChainId: chainId,
      effectiveChainId: finalChainId,
      needsNetworkSwitch: isConnected && chainId !== finalChainId,
      recommendedNetwork: 'Ethereum Sepolia',
    }
  };
}

export default useContractConfig;

'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { hederaTestnet, hederaMainnet, bitfinityTestnet, bitfinityMainnet } from '@/config';
import { getContractConfig } from '@/config/contracts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

const SUPPORTED_CHAIN_IDS = [
  hederaTestnet.id, // Primary - has deployed contracts
  hederaMainnet.id,
  bitfinityTestnet.id,
  bitfinityMainnet.id,
];

const CHAIN_NAMES = {
  [hederaTestnet.id]: 'Hedera Testnet',
  [hederaMainnet.id]: 'Hedera Mainnet',
  [bitfinityTestnet.id]: 'Bitfinity EVM Testnet',
  [bitfinityMainnet.id]: 'Bitfinity EVM Mainnet',
};

const CHAIN_ICONS = {
  [hederaTestnet.id]: '🌐',
  [hederaMainnet.id]: '🌐',
  [bitfinityTestnet.id]: '🔥',
  [bitfinityMainnet.id]: '🔥',
};

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Get contract configuration for current network
  const contractConfig = getContractConfig(chainId);
  const hasContracts = contractConfig && contractConfig.totalTokens > 0;

  // Default to Hedera Testnet if not connected or on unsupported network
  const currentChainId = isConnected && SUPPORTED_CHAIN_IDS.includes(chainId as typeof SUPPORTED_CHAIN_IDS[number]) ? chainId : hederaTestnet.id;
  const currentChainName = CHAIN_NAMES[currentChainId as keyof typeof CHAIN_NAMES] || 'Unknown Network';
  const currentChainIcon = CHAIN_ICONS[currentChainId as keyof typeof CHAIN_ICONS] || '❓';

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (targetChainId === chainId) return;
    
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <span className="text-lg">{currentChainIcon}</span>
        <span>{currentChainName}</span>
        <span className="text-xs">(Default)</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={isPending}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentChainIcon}</span>
            <span className="truncate">{currentChainName}</span>
            {hasContracts && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {!hasContracts && currentChainId !== hederaTestnet.id && (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[250px]">
        {SUPPORTED_CHAIN_IDS.map((supportedChainId) => {
          const chainName = CHAIN_NAMES[supportedChainId];
          const chainIcon = CHAIN_ICONS[supportedChainId];
          const config = getContractConfig(supportedChainId);
          const hasDeployedContracts = config && config.totalTokens > 0;
          const isCurrentChain = supportedChainId === chainId;
          const isPrimary = supportedChainId === hederaTestnet.id;

          return (
            <DropdownMenuItem
              key={supportedChainId}
              onClick={() => handleNetworkSwitch(supportedChainId)}
              className={`flex items-center justify-between cursor-pointer ${
                isCurrentChain ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{chainIcon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{chainName}</span>
                  {isPrimary && (
                    <span className="text-xs text-green-600">Primary Network</span>
                  )}
                  {hasDeployedContracts && (
                    <span className="text-xs text-muted-foreground">
                      {config.totalTokens} tokens deployed
                    </span>
                  )}
                  {!hasDeployedContracts && !isPrimary && (
                    <span className="text-xs text-yellow-600">No contracts</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isCurrentChain && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {hasDeployedContracts && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {!hasDeployedContracts && !isPrimary && (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1">
          <p>💡 Hedera Testnet has all 12 Nigerian stocks deployed</p>
          <p>🚀 Other networks coming soon</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NetworkSwitcher;

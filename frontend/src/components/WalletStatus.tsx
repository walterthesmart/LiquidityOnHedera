"use client";

import React from "react";
import { useAccount, useChainId, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatNetworkName } from "@/lib/bitfinity-config";

export const WalletStatus: React.FC = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address: address,
  });

  if (isConnecting) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Connecting wallet...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600 mb-4">
            Connect your wallet to access the Nigerian Stock Exchange DEX
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Wallet Connected</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Connected</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Address:</span>
            <span className="font-mono text-sm">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Network:</span>
            <span className="text-sm">
              {chainId ? formatNetworkName(chainId) : "Unknown"}
            </span>
          </div>

          {balance && (
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="text-sm">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
};

export default WalletStatus;

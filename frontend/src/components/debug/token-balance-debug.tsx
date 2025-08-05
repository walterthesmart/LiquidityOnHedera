"use client";

import React from "react";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle, CheckCircle } from "lucide-react";

/**
 * Debug component to test and display token balance fetching
 * This component helps verify that the useTokenBalances hook is working correctly
 */
export const TokenBalanceDebug: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { 
    tokenBalances, 
    isLoading, 
    error, 
    refreshBalances, 
    hasBalances 
  } = useTokenBalances();

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Token Balance Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Please connect your wallet to test token balances.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Token Balance Debug
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Wallet Address:</p>
            <p className="text-xs font-mono text-gray-600 break-all">{address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Chain ID:</p>
            <p className="text-sm text-gray-600">{chainId}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <Badge variant={isLoading ? "secondary" : "default"}>
            {isLoading ? "Loading..." : "Ready"}
          </Badge>
          <Badge variant={hasBalances ? "default" : "secondary"}>
            {hasBalances ? `${tokenBalances.length} tokens` : "No balances"}
          </Badge>
          {error && (
            <Badge variant="destructive">
              Error: {error}
            </Badge>
          )}
        </div>

        {/* Token Balances */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Token Balances</h3>
          {tokenBalances.length === 0 ? (
            <p className="text-gray-500 italic">No token balances loaded yet.</p>
          ) : (
            <div className="grid gap-2">
              {tokenBalances.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={token.isStablecoin ? "default" : "outline"}>
                      {token.isStablecoin ? "Stablecoin" : "Stock"}
                    </Badge>
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-sm text-gray-600">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg">
                      {parseFloat(token.balance).toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Raw Data (for debugging) */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Raw Debug Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
            {JSON.stringify(
              {
                address,
                chainId,
                isConnected,
                isLoading,
                error,
                hasBalances,
                tokenCount: tokenBalances.length,
                tokenBalances: tokenBalances.map(token => ({
                  symbol: token.symbol,
                  balance: token.balance,
                  address: token.address,
                  isStablecoin: token.isStablecoin
                }))
              },
              null,
              2
            )}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default TokenBalanceDebug;

'use client';

import React from 'react';
import { useHederaContracts, usePortfolio } from '@/hooks/use-hedera-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, TrendingUp, RefreshCw, ExternalLink, PieChart, DollarSign } from 'lucide-react';

export default function PortfolioDashboard() {
  const contracts = useHederaContracts();
  const { portfolio, isLoading, error, refetch } = usePortfolio();

  const handleConnectWallet = async () => {
    try {
      await contracts.connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!contracts.isFullyDeployed) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <AlertDescription>
            Portfolio tracking is only available when contracts are fully deployed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!contracts.isConnected) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Connect Wallet</span>
            </CardTitle>
            <CardDescription>
              Connect your wallet to view your Nigerian stock portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnectWallet} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <AlertDescription>
            Error loading portfolio: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalValue = portfolio ? parseFloat(portfolio.totalValue) + parseFloat(portfolio.ngnBalance) : 0;
  const hasHoldings = portfolio && portfolio.stocks.length > 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Portfolio
            </h1>
            <p className="text-gray-600">
              Your Nigerian stock holdings on Hedera Testnet
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {contracts.userAddress?.slice(0, 6)}...{contracts.userAddress?.slice(-4)}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Including NGN balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NGN Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{parseFloat(contracts.ngnBalance).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Holdings</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio?.stocks.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Different stocks owned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      {hasHoldings ? (
        <Card>
          <CardHeader>
            <CardTitle>Stock Holdings</CardTitle>
            <CardDescription>
              Your current stock positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.stocks.map((holding) => (
                <div
                  key={holding.symbol}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{holding.symbol}</h3>
                      <p className="text-sm text-gray-500">{holding.info?.name}</p>
                    </div>
                    <Badge variant="outline">{holding.config?.sector}</Badge>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className="font-semibold">{parseFloat(holding.balance).toFixed(4)} {holding.symbol}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-semibold">₦{parseFloat(holding.price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-semibold">₦{parseFloat(holding.value).toFixed(2)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(contracts.getContractExplorerUrl(holding.config?.address || ''), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Holdings</CardTitle>
            <CardDescription>
              You don&apos;t have any stock holdings yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Start trading Nigerian stocks to build your portfolio
              </p>
              <Button onClick={() => window.location.href = '/nigerian-stocks'}>
                Start Trading
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Core Contracts</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>NGN Stablecoin:</span>
                  <span className="font-mono text-xs">{contracts.contractsInfo?.contracts.NGNStablecoin.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>DEX:</span>
                  <span className="font-mono text-xs">{contracts.contractsInfo?.contracts.StockNGNDEX.address}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Network</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>Hedera Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span>Chain ID:</span>
                  <span>296</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

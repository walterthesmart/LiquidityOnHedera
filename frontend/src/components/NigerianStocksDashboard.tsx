'use client';

import React, { useState } from 'react';
import { useNigerianStocks, useMarketData, useTradingPairs } from '@/hooks/use-nigerian-stocks';
import { useHederaContracts } from '@/hooks/use-hedera-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Users, ExternalLink, Zap } from 'lucide-react';
import LiveTradingInterface from './LiveTradingInterface';

interface StockCardProps {
  stock: {
    symbol: string;
    name: string;
    companyName: string;
    price: string;
    change: string;
    volume: string;
    marketCap: string;
    sector: string;
    description: string;
    contractAddress: string;
    contractId: string;
  };
}

function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change.startsWith('+');
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const contracts = useHederaContracts();

  const isLiveContract = stock.contractAddress && !stock.contractAddress.startsWith('0x0000000000000000000000000000000000000000');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
            <CardDescription className="text-sm">{stock.name}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {stock.sector}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">₦{stock.price}</span>
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">{stock.change}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Volume</span>
              <p className="font-medium">{stock.volume}</p>
            </div>
            <div>
              <span className="text-gray-500">Market Cap</span>
              <p className="font-medium">{stock.marketCap}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2">{stock.description}</p>
          
          <div className="space-y-1 text-xs text-gray-500">
            <p>Contract: {stock.contractId}</p>
            <p className="truncate">Address: {stock.contractAddress}</p>
          </div>
          
          <div className="flex space-x-2">
            {isLiveContract ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1">
                    <Zap className="h-4 w-4 mr-1" />
                    Live Trade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Trade {stock.symbol}</DialogTitle>
                    <DialogDescription>
                      Live trading interface for {stock.name} on Hedera Testnet
                    </DialogDescription>
                  </DialogHeader>
                  <LiveTradingInterface stockSymbol={stock.symbol} />
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" className="flex-1" disabled>
                Trade (Coming Soon)
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.open(contracts.getContractExplorerUrl(stock.contractAddress), '_blank')}
              disabled={!isLiveContract}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Explorer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketOverview() {
  const { data: marketData, isLoading } = useMarketData();

  if (isLoading) {
    return <div className="animate-pulse">Loading market data...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{marketData?.totalMarketCap}</div>
          <p className="text-xs text-muted-foreground">Nigerian Stock Market</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{marketData?.totalVolume}</div>
          <p className="text-xs text-muted-foreground">24h trading volume</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Stocks</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{marketData?.activeStocks}</div>
          <p className="text-xs text-muted-foreground">Available for trading</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Hedera</div>
          <p className="text-xs text-muted-foreground">Testnet</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TopMovers() {
  const { data: marketData, isLoading } = useMarketData();

  if (isLoading) {
    return <div className="animate-pulse">Loading top movers...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {marketData?.topGainers?.map((stock: any) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{stock.price}</p>
                  <p className="text-sm text-green-600">{stock.change}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
            Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {marketData?.topLosers?.map((stock: any) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{stock.price}</p>
                  <p className="text-sm text-red-600">{stock.change}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="h-5 w-5 text-blue-600 mr-2" />
            Most Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {marketData?.mostActive?.map((stock: any) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{stock.price}</p>
                  <p className="text-sm text-blue-600">{stock.volume}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NigerianStocksDashboard() {
  const { data: stocksData, isLoading, error } = useNigerianStocks();
  const contracts = useHederaContracts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading Nigerian stocks: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nigerian Stock Exchange
            </h1>
            <p className="text-gray-600">
              Trade Nigerian stocks on Hedera Testnet • {stocksData?.totalStocks} stocks available
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={contracts.isFullyDeployed ? "default" : "secondary"}>
              {contracts.isFullyDeployed ? "Live Contracts" : "Mock Data"}
            </Badge>
            {contracts.isConnected && (
              <Badge variant="outline">
                Wallet Connected
              </Badge>
            )}
          </div>
        </div>

        {contracts.isFullyDeployed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Live Trading Available!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              All contracts are deployed on Hedera Testnet. You can now trade with real smart contracts.
            </p>
          </div>
        )}
      </div>

      <MarketOverview />

      <Tabs defaultValue="stocks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stocks">All Stocks</TabsTrigger>
          <TabsTrigger value="movers">Top Movers</TabsTrigger>
          <TabsTrigger value="pairs">Trading Pairs</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocksData?.stocks?.map((stock: any) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movers" className="space-y-6">
          <TopMovers />
        </TabsContent>

        <TabsContent value="pairs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Pairs</CardTitle>
              <CardDescription>
                Available trading pairs on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Trading pairs component coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

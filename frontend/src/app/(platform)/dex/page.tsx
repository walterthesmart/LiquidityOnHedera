/**
 * NGN-DEX Trading Interface
 *
 * Comprehensive decentralized exchange interface for trading Nigerian stocks
 * with NGN stablecoin. Features real-time price feeds, order placement,
 * liquidity management, and transaction tracking.
 *
 * @author Augment Agent
 */

"use client";

import React, { useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Wallet,
  RefreshCw,
  Info
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { DEXDashboard, EnhancedTradingInterface, OrderBook, TradeHistory } from "@/components/DEX";
import { WalletStatus } from "@/components/WalletStatus";

// Loading components
const LoadingCard = ({ title }: { title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </CardContent>
  </Card>
);

export default function DEXPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("trade");

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              NGN-DEX Trading
            </h1>
            <p className="text-gray-600">
              Trade Nigerian stocks with NGN stablecoin on decentralized exchange
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Network Status */}
            <Badge variant={chainId ? "default" : "destructive"} className="px-3 py-1">
              {chainId === 11155111 ? "Sepolia" : chainId === 355113 ? "Bitfinity Testnet" : "Unknown Network"}
            </Badge>

            {/* Wallet Status */}
            <WalletStatus />
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <h3 className="font-medium text-amber-800">Wallet Connection Required</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Please connect your wallet to access trading features and view your portfolio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Trading Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="trade" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trade</span>
          </TabsTrigger>
          <TabsTrigger value="markets" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Markets</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trade" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Enhanced Trading Interface */}
            <div className="xl:col-span-5">
              <Suspense fallback={<LoadingCard title="Loading Trading Interface..." />}>
                <EnhancedTradingInterface className="h-full" />
              </Suspense>
            </div>

            {/* Order Book */}
            <div className="xl:col-span-4">
              <Suspense fallback={<LoadingCard title="Loading Order Book..." />}>
                <OrderBook stockToken="" className="h-full" />
              </Suspense>
            </div>

            {/* Trade History & Quick Stats */}
            <div className="xl:col-span-3 space-y-6">
              <Suspense fallback={<LoadingCard title="Loading Trade History..." />}>
                <TradeHistory className="h-full" />
              </Suspense>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Volume (24h)</span>
                      <span className="font-medium">₦2,450,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Pairs</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Liquidity</span>
                      <span className="font-medium">₦15,680,000</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Network Fee</span>
                      <span className="font-medium text-green-600">0.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Markets Tab */}
        <TabsContent value="markets" className="space-y-6">
          <Suspense fallback={<LoadingCard title="Loading Market Data..." />}>
            <DEXDashboard className="w-full" />
          </Suspense>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Portfolio data will be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Connect wallet to view portfolio</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent transactions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Price Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Price charts coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Volume Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Volume analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

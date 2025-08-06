"use client";

/**
 * Order Book Component
 *
 * Displays real-time order book data with buy/sell orders,
 * price levels, and market depth visualization.
 *
 * @author Augment Agent
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  BarChart3,
  Activity
} from "lucide-react";
import { useReadContract, useChainId } from "wagmi";
import { StockNGNDEXABI, getStockNGNDEXAddress } from "../../abis";
import { formatEther } from "ethers";

interface OrderBookProps {
  stockToken: string;
  className?: string;
}

interface OrderLevel {
  price: number;
  amount: number;
  total: number;
  percentage: number;
}

// Mock data for demonstration - in production this would come from smart contracts or indexer
const generateMockOrderBook = (currentPrice: number): { bids: OrderLevel[], asks: OrderLevel[] } => {
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];
  
  // Generate bid orders (buy orders) below current price
  let totalBidAmount = 0;
  for (let i = 0; i < 10; i++) {
    const price = currentPrice * (0.995 - i * 0.002);
    const amount = Math.random() * 1000 + 100;
    totalBidAmount += amount;
    bids.push({
      price,
      amount,
      total: totalBidAmount,
      percentage: 0, // Will be calculated after all orders are generated
    });
  }

  // Generate ask orders (sell orders) above current price
  let totalAskAmount = 0;
  for (let i = 0; i < 10; i++) {
    const price = currentPrice * (1.005 + i * 0.002);
    const amount = Math.random() * 1000 + 100;
    totalAskAmount += amount;
    asks.push({
      price,
      amount,
      total: totalAskAmount,
      percentage: 0, // Will be calculated after all orders are generated
    });
  }

  // Calculate percentages for depth visualization
  const maxBidTotal = Math.max(...bids.map(b => b.total));
  const maxAskTotal = Math.max(...asks.map(a => a.total));
  
  bids.forEach(bid => {
    bid.percentage = (bid.total / maxBidTotal) * 100;
  });
  
  asks.forEach(ask => {
    ask.percentage = (ask.total / maxAskTotal) * 100;
  });

  return { bids, asks };
};

export default function OrderBook({ stockToken, className = "" }: OrderBookProps) {
  const chainId = useChainId();
  const [orderBook, setOrderBook] = useState<{ bids: OrderLevel[], asks: OrderLevel[] }>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(false);

  const dexAddress = chainId ? getStockNGNDEXAddress(chainId) : "";

  // Get current price for the stock
  const { data: currentPrice, refetch: refetchPrice } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getCurrentPrice",
    args: [stockToken],
    query: {
      enabled: !!stockToken && !!dexAddress,
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Generate mock order book data based on current price
  useEffect(() => {
    if (currentPrice) {
      const price = currentPrice ? Number(formatEther(currentPrice as bigint)) : 0;
      const mockData = generateMockOrderBook(price);
      setOrderBook(mockData);
    }
  }, [currentPrice]);

  const refreshOrderBook = async () => {
    setIsLoading(true);
    await refetchPrice();
    setTimeout(() => setIsLoading(false), 500); // Small delay for UX
  };

  const formatPrice = (price: number) => `₦${price.toFixed(4)}`;
  const formatAmount = (amount: number) => amount.toFixed(2);

  if (!stockToken) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Order Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a stock to view order book</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Order Book
          </div>
          <Button variant="outline" size="sm" onClick={refreshOrderBook} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-2 bg-gray-50 border-b">
          <div className="grid grid-cols-3 text-xs font-medium text-gray-600">
            <span>Price (NGN)</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Ask Orders (Sell Orders) - Red */}
          <div className="px-4 py-2">
            <div className="flex items-center mb-2">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm font-medium text-red-600">Sell Orders</span>
            </div>
            <div className="space-y-1">
              {orderBook.asks.slice().reverse().map((ask, index) => (
                <div key={index} className="relative">
                  {/* Depth bar */}
                  <div 
                    className="absolute inset-0 bg-red-50 opacity-60"
                    style={{ width: `${ask.percentage}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-xs py-1 hover:bg-red-50 cursor-pointer">
                    <span className="text-red-600 font-medium">{formatPrice(ask.price)}</span>
                    <span className="text-right">{formatAmount(ask.amount)}</span>
                    <span className="text-right text-gray-600">{formatAmount(ask.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Price */}
          <div className="px-4 py-3 bg-gray-100 border-y">
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-lg font-bold">
                {currentPrice ? formatPrice(Number(formatEther(currentPrice as bigint))) : "Loading..."}
              </Badge>
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">
              Current Market Price
            </div>
          </div>

          {/* Bid Orders (Buy Orders) - Green */}
          <div className="px-4 py-2">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">Buy Orders</span>
            </div>
            <div className="space-y-1">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="relative">
                  {/* Depth bar */}
                  <div 
                    className="absolute inset-0 bg-green-50 opacity-60"
                    style={{ width: `${bid.percentage}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-xs py-1 hover:bg-green-50 cursor-pointer">
                    <span className="text-green-600 font-medium">{formatPrice(bid.price)}</span>
                    <span className="text-right">{formatAmount(bid.amount)}</span>
                    <span className="text-right text-gray-600">{formatAmount(bid.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <Separator />
        <div className="px-4 py-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Bid Total:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatAmount(orderBook.bids.reduce((sum, bid) => sum + bid.amount, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Ask Total:</span>
              <span className="ml-2 font-medium text-red-600">
                {formatAmount(orderBook.asks.reduce((sum, ask) => sum + ask.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

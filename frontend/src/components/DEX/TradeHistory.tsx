"use client";

/**
 * Trade History Component
 *
 * Displays recent trades, transaction history, and trade analytics
 * with real-time updates and filtering capabilities.
 *
 * @author Augment Agent
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Activity,
  ExternalLink
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";

interface TradeHistoryProps {
  stockToken?: string;
  className?: string;
}

interface Trade {
  id: string;
  timestamp: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  value: number;
  txHash: string;
  user: string;
}

interface UserTransaction {
  id: string;
  timestamp: number;
  type: "swap" | "liquidity_add" | "liquidity_remove";
  status: "pending" | "confirmed" | "failed";
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  txHash: string;
  gasUsed?: number;
}

// Mock data for demonstration
const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 20; i++) {
    const type = Math.random() > 0.5 ? "buy" : "sell";
    const price = 50 + Math.random() * 10; // Price between 50-60 NGN
    const amount = Math.random() * 100 + 10; // Amount between 10-110
    const value = price * amount;
    
    trades.push({
      id: `trade_${i}`,
      timestamp: now - (i * 60000 * Math.random() * 60), // Random times in last hour
      type,
      price,
      amount,
      value,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      user: `0x${Math.random().toString(16).substr(2, 40)}`,
    });
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp);
};

const generateMockUserTransactions = (): UserTransaction[] => {
  const transactions: UserTransaction[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 10; i++) {
    const types = ["swap", "liquidity_add", "liquidity_remove"] as const;
    const statuses = ["confirmed", "pending", "failed"] as const;
    
    transactions.push({
      id: `tx_${i}`,
      timestamp: now - (i * 3600000), // Every hour
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      fromToken: "NGN",
      toToken: "STOCK",
      fromAmount: Math.random() * 1000 + 100,
      toAmount: Math.random() * 20 + 2,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      gasUsed: Math.floor(Math.random() * 100000 + 21000),
    });
  }
  
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

export default function TradeHistory({ stockToken, className = "" }: TradeHistoryProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load mock data
  useEffect(() => {
    setRecentTrades(generateMockTrades());
    setUserTransactions(generateMockUserTransactions());
  }, [stockToken]);

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRecentTrades(generateMockTrades());
      setUserTransactions(generateMockUserTransactions());
      setIsLoading(false);
    }, 1000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getExplorerUrl = (txHash: string) => {
    if (chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    } else if (chainId === 355113) {
      return `https://explorer.bitfinity.network/tx/${txHash}`;
    }
    return "#";
  };

  const getStatusColor = (status: UserTransaction["status"]) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: "buy" | "sell") => {
    return type === "buy" 
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Trade History
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Trades</TabsTrigger>
            <TabsTrigger value="my-trades" disabled={!isConnected}>
              My Transactions
            </TabsTrigger>
          </TabsList>

          {/* Recent Market Trades */}
          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-5 text-xs font-medium text-gray-600 px-2 py-1">
                <span>Type</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Value</span>
                <span className="text-right">Time</span>
              </div>

              {/* Trade List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {recentTrades.map((trade) => (
                  <div 
                    key={trade.id} 
                    className="grid grid-cols-5 text-xs py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <div className="flex items-center">
                      {getTypeIcon(trade.type)}
                      <span className={`ml-1 capitalize ${
                        trade.type === "buy" ? "text-green-600" : "text-red-600"
                      }`}>
                        {trade.type}
                      </span>
                    </div>
                    <span className="text-right font-medium">
                      ₦{trade.price.toFixed(4)}
                    </span>
                    <span className="text-right">
                      {trade.amount.toFixed(2)}
                    </span>
                    <span className="text-right">
                      ₦{trade.value.toFixed(2)}
                    </span>
                    <span className="text-right text-gray-500">
                      {formatTime(trade.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {recentTrades.filter(t => t.type === "buy").length}
                  </div>
                  <div className="text-xs text-gray-600">Buy Orders</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {recentTrades.filter(t => t.type === "sell").length}
                  </div>
                  <div className="text-xs text-gray-600">Sell Orders</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    ₦{recentTrades.reduce((sum, t) => sum + t.value, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Volume</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* User Transactions */}
          <TabsContent value="my-trades" className="space-y-4">
            {!isConnected ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Connect wallet to view your transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userTransactions.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {tx.type.replace("_", " ")}
                        </Badge>
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(tx.timestamp)} {formatTime(tx.timestamp)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-2 font-medium">
                          {tx.fromAmount.toFixed(2)} {tx.fromToken}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>
                        <span className="ml-2 font-medium">
                          {tx.toAmount.toFixed(4)} {tx.toToken}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        Gas: {tx.gasUsed?.toLocaleString() || "N/A"}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={getExplorerUrl(tx.txHash)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}

                {userTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your trading history will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Trading Widget Component
 * 
 * Compact trading widget for embedding in stock symbol pages.
 * Provides quick buy/sell functionality with minimal UI footprint.
 * 
 * @author Augment Agent
 */

"use client";

import React, { useState, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
} from "wagmi";
import {
  StockNGNDEXABI,
  NGNStablecoinABI,
  NigerianStockTokenABI,
  getStockNGNDEXAddress,
  getNGNStablecoinAddress,
} from "../../abis";
import { formatEther, parseEther } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap,
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface QuickTradingWidgetProps {
  stockToken: string;
  stockSymbol: string;
  stockName: string;
  className?: string;
}

export default function QuickTradingWidget({ 
  stockToken, 
  stockSymbol, 
  stockName,
  className = "" 
}: QuickTradingWidgetProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Trading state
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy");
  const [inputAmount, setInputAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dexAddress = chainId ? getStockNGNDEXAddress(chainId) : "";
  const ngnAddress = chainId ? getNGNStablecoinAddress(chainId) : "";

  // Get current price
  const { data: currentPrice, refetch: refetchPrice } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getCurrentPrice",
    args: [stockToken],
    query: {
      enabled: !!stockToken && !!dexAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Get user balances
  const { data: ngnBalance } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!ngnAddress,
      refetchInterval: 15000,
    },
  });

  const { data: stockBalance } = useReadContract({
    address: stockToken as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!stockToken,
      refetchInterval: 15000,
    },
  });

  // Get swap quote
  const { data: swapQuote } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: tradeDirection === "buy" ? "getQuoteNGNToStock" : "getQuoteStockToNGN",
    args: [stockToken, inputAmount ? parseEther(inputAmount) : 0n],
    query: {
      enabled: !!stockToken && !!inputAmount && !!dexAddress,
      refetchInterval: 5000,
    },
  }) as { data: [bigint, bigint, bigint] | undefined };

  // Calculate expected output and minimum amount
  const expectedOutput = swapQuote ? formatEther(swapQuote[0]) : "0";
  const priceImpact = swapQuote ? Number(formatEther(swapQuote[2])) : 0;
  const minAmountOut = swapQuote 
    ? (swapQuote[0] * BigInt(9500)) / 10000n // 5% slippage tolerance
    : 0n;

  // Write contract hook
  const { writeContract: writeContractFn } = useWriteContract();

  // Handle trade execution
  const handleQuickTrade = useCallback(async () => {
    if (!isConnected || !stockToken || !inputAmount) {
      toast.error("Please connect wallet and enter amount");
      return;
    }

    setIsLoading(true);

    try {
      const deadline = Math.floor(Date.now() / 1000) + (20 * 60); // 20 minutes

      writeContractFn({
        address: dexAddress as `0x${string}`,
        abi: StockNGNDEXABI,
        functionName: tradeDirection === "buy" ? "swapNGNForStock" : "swapStockForNGN",
        args: [
          stockToken,
          parseEther(inputAmount),
          minAmountOut,
          deadline,
        ],
      });
      
      toast.success(`${tradeDirection === "buy" ? "Buy" : "Sell"} order submitted!`);
      setInputAmount(""); // Clear input after successful submission
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Trade failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    stockToken,
    inputAmount,
    tradeDirection,
    writeContractFn,
    dexAddress,
    minAmountOut,
  ]);

  // Handle max button click
  const handleMaxClick = () => {
    if (tradeDirection === "buy" && ngnBalance) {
      setInputAmount(formatEther(ngnBalance as bigint));
    } else if (tradeDirection === "sell" && stockBalance) {
      setInputAmount(formatEther(stockBalance as bigint));
    }
  };

  const formatPrice = (price: bigint) => {
    return `₦${Number(formatEther(price)).toFixed(4)}`;
  };

  const formatBalance = (balance: bigint | undefined) => {
    return balance ? Number(formatEther(balance)).toFixed(4) : "0.0000";
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Quick Trade
          </div>
          <Link href="/dex">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </CardTitle>
        <div className="text-sm text-gray-600">
          {stockSymbol} - {stockName}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Price */}
        {currentPrice ? (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Current Price</span>
            <div className="flex items-center">
              <span className="font-medium">{formatPrice(currentPrice as bigint)}</span>
              <Button variant="ghost" size="sm" onClick={() => refetchPrice()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Trade Direction Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={tradeDirection === "buy" ? "default" : "outline"}
            className={`flex-1 ${tradeDirection === "buy" ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => setTradeDirection("buy")}
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button
            variant={tradeDirection === "sell" ? "default" : "outline"}
            className={`flex-1 ${tradeDirection === "sell" ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={() => setTradeDirection("sell")}
            size="sm"
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Sell
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Amount ({tradeDirection === "buy" ? "NGN" : "Tokens"})</span>
            <span className="text-gray-500">
              Balance: {tradeDirection === "buy" 
                ? `₦${formatBalance(ngnBalance as bigint)}`
                : `${formatBalance(stockBalance as bigint)} tokens`
              }
            </span>
          </div>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleMaxClick} size="sm">
              MAX
            </Button>
          </div>
        </div>

        {/* Expected Output */}
        {inputAmount && swapQuote && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Expected Output:</span>
              <span className="font-medium">
                {tradeDirection === "buy" 
                  ? `${Number(expectedOutput).toFixed(4)} tokens`
                  : `₦${Number(expectedOutput).toFixed(2)}`
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Price Impact:</span>
              <Badge variant={priceImpact > 5 ? "destructive" : "secondary"}>
                {priceImpact.toFixed(2)}%
              </Badge>
            </div>
          </div>
        )}

        {/* Trade Button */}
        <Button
          onClick={handleQuickTrade}
          disabled={!isConnected || !stockToken || !inputAmount || isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {tradeDirection === "buy" ? "Buy Now" : "Sell Now"}
            </>
          )}
        </Button>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-amber-800 text-sm">Connect wallet to trade</span>
          </div>
        )}

        {/* Advanced Trading Link */}
        <Separator />
        <div className="text-center">
          <Link href="/dex">
            <Button variant="ghost" size="sm" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Advanced Trading
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

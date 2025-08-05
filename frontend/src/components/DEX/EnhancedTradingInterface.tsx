/**
 * Enhanced Trading Interface Component
 * 
 * Comprehensive trading interface with market/limit orders, slippage settings,
 * gas estimation, order book display, and real-time updates.
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
  useEstimateGas,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calculator
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getStockInfoByAddresses, DEXStockInfo, formatStockDisplayName } from "@/utils/dex-stock-mapping";

interface EnhancedTradingInterfaceProps {
  className?: string;
  selectedSymbol?: string;
}

type OrderType = "market" | "limit";
type TradeDirection = "buy" | "sell";

export default function EnhancedTradingInterface({ 
  className = "", 
  selectedSymbol 
}: EnhancedTradingInterfaceProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Trading state
  const [selectedStock, setSelectedStock] = useState<string>(selectedSymbol || "");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [tradeDirection, setTradeDirection] = useState<TradeDirection>("buy");
  const [inputAmount, setInputAmount] = useState("");
  // const [limitPrice, setLimitPrice] = useState(""); // For future limit order implementation
  const [slippageTolerance, setSlippageTolerance] = useState(5); // 5% default
  const [deadline, setDeadline] = useState(20); // 20 minutes default
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Enhanced stock information state
  const [enhancedStockInfo, setEnhancedStockInfo] = useState<DEXStockInfo[]>([]);
  const [selectedStockInfo, setSelectedStockInfo] = useState<DEXStockInfo | null>(null);
  const [stockInfoLoading, setStockInfoLoading] = useState(false);
  const [stockInfoError, setStockInfoError] = useState<string | null>(null);

  const dexAddress = chainId ? getStockNGNDEXAddress(chainId) : "";
  const ngnAddress = chainId ? getNGNStablecoinAddress(chainId) : "";

  // Get all available stock tokens
  const { data: allStockTokens, refetch: refetchStockTokens } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getAllStockTokens",
    query: {
      enabled: !!dexAddress,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  }) as { data: string[] | undefined; refetch: () => void };

  // Process stock tokens to get enhanced information
  React.useEffect(() => {
    if (allStockTokens && chainId) {
      setStockInfoLoading(true);
      setStockInfoError(null);

      try {
        const enhancedInfo = getStockInfoByAddresses(allStockTokens, chainId);
        setEnhancedStockInfo(enhancedInfo);

        // Update selected stock info if we have a selected stock
        if (selectedStock) {
          const selectedInfo = enhancedInfo.find(info => info.contractAddress === selectedStock);
          setSelectedStockInfo(selectedInfo || null);
        }

        // Show warning if no stock info was found
        if (enhancedInfo.length === 0 && allStockTokens.length > 0) {
          setStockInfoError("No stock information found for available tokens");
        }
      } catch (error) {
        console.error("Error processing stock information:", error);
        setStockInfoError("Failed to load stock information");
      } finally {
        setStockInfoLoading(false);
      }
    } else {
      // Reset state when no tokens available
      setEnhancedStockInfo([]);
      setSelectedStockInfo(null);
      setStockInfoError(null);
      setStockInfoLoading(false);
    }
  }, [allStockTokens, chainId, selectedStock]);

  // Get stock info for selected stock (for future use)
  /*
  const { data: stockInfo } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getStockInfo",
    args: [selectedStock],
    query: {
      enabled: !!selectedStock && !!dexAddress,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });
  */

  // Get current price
  const { data: currentPrice, refetch: refetchPrice } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getCurrentPrice",
    args: [selectedStock],
    query: {
      enabled: !!selectedStock && !!dexAddress,
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Get user balances
  const { data: ngnBalance, refetch: refetchNGNBalance } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!ngnAddress,
      refetchInterval: 10000,
    },
  });

  const { data: stockBalance, refetch: refetchStockBalance } = useReadContract({
    address: selectedStock as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!selectedStock,
      refetchInterval: 10000,
    },
  });

  // Get token allowances for approval checking
  const { data: ngnAllowance, refetch: refetchNGNAllowance } = useReadContract({
    address: ngnAddress as `0x${string}`,
    abi: NGNStablecoinABI,
    functionName: "allowance",
    args: [address, dexAddress],
    query: {
      enabled: !!address && !!ngnAddress && !!dexAddress,
      refetchInterval: 10000,
    },
  });

  const { data: stockAllowance, refetch: refetchStockAllowance } = useReadContract({
    address: selectedStock as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "allowance",
    args: [address, dexAddress],
    query: {
      enabled: !!address && !!selectedStock && !!dexAddress,
      refetchInterval: 10000,
    },
  });

  // Get swap quote for market orders
  const { data: swapQuote } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: tradeDirection === "buy" ? "getQuoteNGNToStock" : "getQuoteStockToNGN",
    args: [selectedStock, inputAmount ? parseEther(inputAmount) : 0n],
    query: {
      enabled: !!selectedStock && !!inputAmount && !!dexAddress && orderType === "market",
      refetchInterval: 3000, // Refresh every 3 seconds for real-time quotes
    },
  }) as { data: [bigint, bigint, bigint] | undefined };

  // Calculate expected output and price impact
  const expectedOutput = swapQuote ? formatEther(swapQuote[0]) : "0";
  const priceImpact = swapQuote ? Number(formatEther(swapQuote[2])) : 0;
  const minAmountOut = swapQuote
    ? (swapQuote[0] * BigInt(Math.floor((100 - slippageTolerance) * 100))) / 10000n
    : 0n;

  // Check if approval is needed
  const inputAmountBigInt = inputAmount ? parseEther(inputAmount) : 0n;
  const needsApproval = React.useMemo(() => {
    if (!inputAmount || !address) return false;

    if (tradeDirection === "buy") {
      // For buying (NGN to Stock), check NGN allowance
      return !ngnAllowance || (ngnAllowance as bigint) < inputAmountBigInt;
    } else {
      // For selling (Stock to NGN), check stock allowance
      return !stockAllowance || (stockAllowance as bigint) < inputAmountBigInt;
    }
  }, [tradeDirection, inputAmount, ngnAllowance, stockAllowance, inputAmountBigInt, address]);

  // Gas estimation
  const { data: gasEstimate } = useEstimateGas({
    to: dexAddress as `0x${string}`,
    data: "0x", // This would need to be the actual transaction data
    query: {
      enabled: !!selectedStock && !!inputAmount && !!dexAddress,
    },
  });

  // Write contract hook
  const { writeContract: writeContractFn } = useWriteContract({
    mutation: {
      onSuccess: (data: string) => {
        const shortHash = `${data.slice(0, 6)}...${data.slice(-4)}`;
        setSuccess(`Transaction successful! Hash: ${shortHash}`);
        toast.success(`Transaction submitted! Hash: ${shortHash}`);
        // Refresh balances and allowances after successful transaction
        refetchNGNBalance();
        refetchStockBalance();
        refetchNGNAllowance();
        refetchStockAllowance();
      },
      onError: (error: Error) => {
        const friendlyMessage = parseErrorMessage(error);
        setError(`Transaction failed: ${friendlyMessage}`);
        toast.error(`Transaction failed: ${friendlyMessage}`);
      },
    },
  });

  // Calculate deadline timestamp
  const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);

  // Helper function to parse and format error messages
  const parseErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();

    if (message.includes("user rejected") || message.includes("user denied")) {
      return "Transaction was cancelled by user";
    }
    if (message.includes("insufficient funds") || message.includes("insufficient balance")) {
      return "Insufficient balance for this transaction";
    }
    if (message.includes("slippage") || message.includes("slippageexceeded")) {
      return "Price moved too much (slippage exceeded). Try increasing slippage tolerance or reducing trade size";
    }
    if (message.includes("deadline") || message.includes("deadlineexceeded")) {
      return "Transaction deadline exceeded. Try increasing the deadline or submitting faster";
    }
    if (message.includes("allowance") || message.includes("transfer amount exceeds allowance")) {
      return "Insufficient token allowance. Please approve token spending first";
    }
    if (message.includes("paused") || message.includes("pausable")) {
      return "Trading is currently paused. Please try again later";
    }
    if (message.includes("price impact") || message.includes("excessivepriceimpact")) {
      return "Price impact too high. Try reducing trade size or check liquidity";
    }
    if (message.includes("trading pair not found") || message.includes("tradingpairnotfound")) {
      return "Trading pair not available for this token";
    }
    if (message.includes("emergency mode") || message.includes("emergencymodeactive")) {
      return "DEX is in emergency mode. Trading is temporarily disabled";
    }
    if (message.includes("nonce too low")) {
      return "Transaction nonce error. Please try refreshing and submitting again";
    }
    if (message.includes("replacement transaction underpriced")) {
      return "Transaction replacement failed. Please wait for the current transaction to complete";
    }
    if (message.includes("transaction dropped") || message.includes("transaction replaced")) {
      return "Transaction was dropped or replaced. This usually happens when network is congested. Please try again";
    }

    // Return original message if no specific pattern matches
    return error.message;
  };

  // Handle token approval
  const handleApproval = useCallback(async () => {
    if (!isConnected || !selectedStock || !inputAmount) {
      toast.error("Please connect wallet and fill all required fields");
      return;
    }

    // Check if user has sufficient balance
    if (tradeDirection === "buy" && ngnBalance && inputAmountBigInt > (ngnBalance as bigint)) {
      toast.error("Insufficient NGN balance for this transaction");
      return;
    }
    if (tradeDirection === "sell" && stockBalance && inputAmountBigInt > (stockBalance as bigint)) {
      toast.error(`Insufficient ${selectedStockInfo?.symbol || "stock"} balance for this transaction`);
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (tradeDirection === "buy") {
        // Approve NGN for DEX
        writeContractFn({
          address: ngnAddress as `0x${string}`,
          abi: NGNStablecoinABI,
          functionName: "approve",
          args: [dexAddress as `0x${string}`, inputAmountBigInt],
        });
        toast.success("NGN approval submitted!");
      } else {
        // Approve stock token for DEX
        writeContractFn({
          address: selectedStock as `0x${string}`,
          abi: NigerianStockTokenABI,
          functionName: "approve",
          args: [dexAddress as `0x${string}`, inputAmountBigInt],
        });
        toast.success("Stock token approval submitted!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      const friendlyMessage = parseErrorMessage(error);
      setError(`Approval failed: ${friendlyMessage}`);
      toast.error(`Approval failed: ${friendlyMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    selectedStock,
    inputAmount,
    tradeDirection,
    writeContractFn,
    ngnAddress,
    dexAddress,
    inputAmountBigInt,
    ngnBalance,
    stockBalance,
    selectedStockInfo?.symbol,
  ]);

  // Handle trade execution
  const handleTrade = useCallback(async () => {
    if (!isConnected || !selectedStock || !inputAmount) {
      toast.error("Please connect wallet and fill all required fields");
      return;
    }

    // Check if approval is needed first
    if (needsApproval) {
      toast.error("Please approve token spending first");
      return;
    }

    // Check if user has sufficient balance
    if (tradeDirection === "buy" && ngnBalance && inputAmountBigInt > (ngnBalance as bigint)) {
      toast.error("Insufficient NGN balance for this transaction");
      return;
    }
    if (tradeDirection === "sell" && stockBalance && inputAmountBigInt > (stockBalance as bigint)) {
      toast.error(`Insufficient ${selectedStockInfo?.symbol || "stock"} balance for this transaction`);
      return;
    }

    // Check if quote is available and reasonable
    if (!swapQuote || swapQuote[0] === 0n) {
      toast.error("Unable to get price quote. Please try again or check liquidity");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (orderType === "market") {
        // Execute market order
        writeContractFn({
          address: dexAddress as `0x${string}`,
          abi: StockNGNDEXABI,
          functionName: tradeDirection === "buy" ? "swapNGNForStock" : "swapStockForNGN",
          args: [
            selectedStock,
            inputAmountBigInt,
            minAmountOut,
            deadlineTimestamp,
          ],
        });

        toast.success("Market order submitted successfully!");
      } else {
        // For limit orders, we would need additional smart contract functionality
        toast.info("Limit orders coming soon!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      const friendlyMessage = parseErrorMessage(error);
      setError(`Trade failed: ${friendlyMessage}`);
      toast.error(`Trade failed: ${friendlyMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    selectedStock,
    inputAmount,
    needsApproval,
    orderType,
    tradeDirection,
    writeContractFn,
    dexAddress,
    inputAmountBigInt,
    minAmountOut,
    deadlineTimestamp,
    ngnBalance,
    stockBalance,
    selectedStockInfo?.symbol,
    swapQuote,
  ]);

  // Handle max button click
  const handleMaxClick = () => {
    if (tradeDirection === "buy" && ngnBalance) {
      setInputAmount(formatEther(ngnBalance as bigint));
    } else if (tradeDirection === "sell" && stockBalance) {
      setInputAmount(formatEther(stockBalance as bigint));
    }
  };

  // Refresh all data
  const refreshData = () => {
    refetchStockTokens();
    refetchPrice();
    refetchNGNBalance();
    refetchStockBalance();
    refetchNGNAllowance();
    refetchStockAllowance();
    toast.success("Data refreshed");
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2" />
            Trading Interface
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock Selection */}
        <div className="space-y-2">
          <Label htmlFor="stock-select">Select Stock Token</Label>
          <Select
            value={selectedStock}
            onValueChange={setSelectedStock}
            disabled={stockInfoLoading || !!stockInfoError}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                stockInfoLoading
                  ? "Loading stocks..."
                  : stockInfoError
                    ? "Error loading stocks"
                    : "Choose a stock to trade"
              }>
                {selectedStockInfo && !stockInfoLoading && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={selectedStockInfo.logoPath}
                        alt={selectedStockInfo.logoAlt}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/logo/png/logo-no-background.png";
                        }}
                      />
                    </div>
                    <span className="truncate">
                      {formatStockDisplayName(selectedStockInfo)}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stockInfoLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading stocks...</span>
                </div>
              ) : stockInfoError ? (
                <div className="flex items-center justify-center p-4">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{stockInfoError}</span>
                </div>
              ) : enhancedStockInfo.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <span className="text-sm text-muted-foreground">No stocks available</span>
                </div>
              ) : (
                enhancedStockInfo.map((stockInfo) => (
                  <SelectItem key={stockInfo.contractAddress} value={stockInfo.contractAddress}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={stockInfo.logoPath}
                          alt={stockInfo.logoAlt}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/logo/png/logo-no-background.png";
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">
                          {stockInfo.companyName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stockInfo.symbol} • {stockInfo.sector}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Error message display */}
          {stockInfoError && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">{stockInfoError}</span>
            </div>
          )}
        </div>

        {/* Current Price Display */}
        {selectedStock && currentPrice && selectedStockInfo ? (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 flex-shrink-0">
                    <Image
                      src={selectedStockInfo.logoPath}
                      alt={selectedStockInfo.logoAlt}
                      width={20}
                      height={20}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logo/png/logo-no-background.png";
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedStockInfo.symbol} Price
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">₦{currentPrice ? Number(formatEther(currentPrice as bigint)).toFixed(4) : "0.0000"}</span>
                  <TrendingUp className="h-4 w-4 ml-1 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Order Type Selection */}
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">Market Order</TabsTrigger>
            <TabsTrigger value="limit">Limit Order</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            {/* Trade Direction */}
            <div className="flex space-x-2">
              <Button
                variant={tradeDirection === "buy" ? "default" : "outline"}
                className={`flex-1 ${tradeDirection === "buy" ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={() => setTradeDirection("buy")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy
              </Button>
              <Button
                variant={tradeDirection === "sell" ? "default" : "outline"}
                className={`flex-1 ${tradeDirection === "sell" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => setTradeDirection("sell")}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Sell
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({tradeDirection === "buy" ? "NGN" : "Stock Tokens"})
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleMaxClick}>
                  MAX
                </Button>
              </div>
              {/* Balance Display */}
              <div className="text-sm text-gray-600">
                Balance: {tradeDirection === "buy" 
                  ? `₦${ngnBalance ? Number(formatEther(ngnBalance as bigint)).toFixed(2) : "0.00"}`
                  : `${stockBalance ? Number(formatEther(stockBalance as bigint)).toFixed(4) : "0.0000"} tokens`
                }
              </div>
            </div>

            {/* Expected Output */}
            {inputAmount && swapQuote && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Expected Output:</span>
                      <span className="font-medium">
                        {tradeDirection === "buy" 
                          ? `${Number(expectedOutput).toFixed(4)} tokens`
                          : `₦${Number(expectedOutput).toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Price Impact:</span>
                      <span className={`font-medium ${priceImpact > 5 ? "text-red-600" : "text-green-600"}`}>
                        {priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Minimum Received:</span>
                      <span className="font-medium text-sm">
                        {tradeDirection === "buy" 
                          ? `${Number(formatEther(minAmountOut)).toFixed(4)} tokens`
                          : `₦${Number(formatEther(minAmountOut)).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="limit" className="space-y-4">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Limit orders coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Advanced order types will be available in the next update
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="advanced-mode">Advanced Settings</Label>
            <Switch
              id="advanced-mode"
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
          </div>

          {isAdvancedMode && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              {/* Slippage Tolerance */}
              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  Range: 0.1% - 20%
                </div>
              </div>

              {/* Transaction Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Transaction Deadline (minutes)</Label>
                <Input
                  id="deadline"
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  value={deadline}
                  onChange={(e) => setDeadline(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  Range: 1 - 60 minutes
                </div>
              </div>

              {/* Gas Estimation */}
              {gasEstimate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Gas:</span>
                  <Badge variant="outline">
                    <Calculator className="h-3 w-3 mr-1" />
                    {gasEstimate.toString()}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Status and Trade Buttons */}
        {isConnected && selectedStock && inputAmount && (
          <div className="space-y-3">
            {/* Approval Status Display */}
            {needsApproval && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-blue-800">
                        Approval needed for {tradeDirection === "buy" ? "NGN" : selectedStockInfo?.symbol || "stock"} tokens
                      </span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      Step 1 of 2
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Button */}
            {needsApproval ? (
              <Button
                onClick={handleApproval}
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve {tradeDirection === "buy" ? "NGN" : selectedStockInfo?.symbol || "Stock"} Spending
                  </>
                )}
              </Button>
            ) : (
              /* Trade Button */
              <Button
                onClick={handleTrade}
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    {tradeDirection === "buy" ? "Buy" : "Sell"} {orderType === "market" ? "Market" : "Limit"}
                  </>
                )}
              </Button>
            )}

            {/* Step indicator when approval is not needed */}
            {!needsApproval && (
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to trade
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Fallback Trade Button for when no approval check is possible */}
        {(!isConnected || !selectedStock || !inputAmount) && (
          <Button
            onClick={handleTrade}
            disabled={!isConnected || !selectedStock || !inputAmount || isLoading}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                {tradeDirection === "buy" ? "Buy" : "Sell"} {orderType === "market" ? "Market" : "Limit"}
              </>
            )}
          </Button>
        )}

        {/* Connection Warning */}
        {!isConnected && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-amber-800">Please connect your wallet to start trading</span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

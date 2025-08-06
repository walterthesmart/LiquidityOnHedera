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

interface StockNGNTraderProps {
  className?: string;
}

// Interface for trading pair data (currently unused but may be needed for future features)
// interface TradingPair {
//   stockToken: string;
//   ngnReserve: bigint;
//   stockReserve: bigint;
//   totalLiquidity: bigint;
//   feeRate: number;
//   isActive: boolean;
//   lastUpdateTime: bigint;
//   priceImpactLimit: number;
// }

interface StockInfo {
  symbol: string;
  companyName: string;
  sector: string;
  totalShares: bigint;
  marketCap: bigint;
  isActive: boolean;
  lastUpdated: bigint;
}

const StockNGNTrader: React.FC<StockNGNTraderProps> = ({ className = "" }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [tradeDirection, setTradeDirection] = useState<
    "ngnToStock" | "stockToNgn"
  >("ngnToStock");
  const [inputAmount, setInputAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("5"); // 5% default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dexAddress = chainId ? getStockNGNDEXAddress(chainId) : "";
  const ngnAddress = chainId ? getNGNStablecoinAddress(chainId) : "";

  // Get all available stock tokens
  const { data: allStockTokens } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getAllStockTokens",
    query: {
      enabled: !!dexAddress,
    },
  }) as { data: string[] | undefined };

  // Get trading pair info for selected stock (currently unused but may be needed for future features)
  // const { data: tradingPair } = useReadContract({
  //   address: dexAddress as `0x${string}`,
  //   abi: StockNGNDEXABI,
  //   functionName: "getTradingPair",
  //   args: [selectedStock],
  //   query: {
  //     enabled: !!selectedStock && !!dexAddress,
  //   },
  // }) as { data: TradingPair | undefined };

  // Get stock token info
  const { data: stockInfo } = useReadContract({
    address: selectedStock as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "getStockInfo",
    query: {
      enabled: !!selectedStock,
    },
  }) as { data: StockInfo | undefined };

  // Get current price
  const { data: currentPrice } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getCurrentPrice",
    args: [selectedStock],
    query: {
      enabled: !!selectedStock && !!dexAddress,
      refetchInterval: 5000, // Replaces watch: true
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
      refetchInterval: 5000, // Replaces watch: true
    },
  });

  const { data: stockBalance, refetch: refetchStockBalance } = useReadContract({
    address: selectedStock as `0x${string}`,
    abi: NigerianStockTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!selectedStock,
      refetchInterval: 5000, // Replaces watch: true
    },
  });

  // Get swap quote
  const { data: swapQuote } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName:
      tradeDirection === "ngnToStock"
        ? "getQuoteNGNToStock"
        : "getQuoteStockToNGN",
    args: [selectedStock, inputAmount ? parseEther(inputAmount) : 0n],
    query: {
      enabled: !!selectedStock && !!inputAmount && !!dexAddress,
    },
  }) as { data: [bigint, bigint, bigint] | undefined };

  // Calculate swap parameters
  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
  const minAmountOut = swapQuote
    ? (swapQuote[0] * BigInt(100 - parseInt(slippageTolerance))) / 100n
    : 0n;

  // Contract write hooks
  const { writeContract: writeContractFn, isPending: isWritePending } =
    useWriteContract({
      mutation: {
        onSuccess: (data: string) => {
          setSuccess(`Transaction successful! Hash: ${data}`);
          setInputAmount("");
          refetchNGNBalance();
          refetchStockBalance();
        },
        onError: (error: Error) => {
          setError(`Transaction failed: ${error.message}`);
        },
      },
    });

  const handleApproval = useCallback(() => {
    setError(null);
    setSuccess(null);

    if (tradeDirection === "ngnToStock") {
      writeContractFn({
        address: ngnAddress as `0x${string}`,
        abi: NGNStablecoinABI,
        functionName: "approve",
        args: [
          dexAddress as `0x${string}`,
          inputAmount ? parseEther(inputAmount) : 0n,
        ],
      });
    } else if (tradeDirection === "stockToNgn") {
      writeContractFn({
        address: selectedStock as `0x${string}`,
        abi: NigerianStockTokenABI,
        functionName: "approve",
        args: [
          dexAddress as `0x${string}`,
          inputAmount ? parseEther(inputAmount) : 0n,
        ],
      });
    }
  }, [
    tradeDirection,
    writeContractFn,
    ngnAddress,
    dexAddress,
    selectedStock,
    inputAmount,
  ]);

  const handleSwap = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      writeContractFn({
        address: dexAddress as `0x${string}`,
        abi: StockNGNDEXABI,
        functionName:
          tradeDirection === "ngnToStock"
            ? "swapNGNForStock"
            : "swapStockForNGN",
        args: [
          selectedStock,
          inputAmount ? parseEther(inputAmount) : 0n,
          minAmountOut,
          deadline,
        ],
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(`Swap failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    writeContractFn,
    dexAddress,
    tradeDirection,
    selectedStock,
    inputAmount,
    minAmountOut,
    deadline,
  ]);

  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return "0.00";
    return parseFloat(formatEther(balance)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatPrice = (price: bigint | undefined): string => {
    if (!price) return "0.00";
    return parseFloat(formatEther(price)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculatePriceImpact = (): string => {
    if (!swapQuote || !swapQuote[2]) return "0.00";
    return (Number(swapQuote[2]) / 100).toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Stock ↔ NGN Trading
          </h3>
          <p className="text-gray-600">
            Please connect your wallet to start trading
          </p>
        </div>
      </div>
    );
  }

  if (!dexAddress || !ngnAddress) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Stock ↔ NGN Trading
          </h3>
          <p className="text-yellow-600">DEX not deployed on this network</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Stock ↔ NGN Trading
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">DEX</span>
          </div>
        </div>
      </div>

      {/* Trading Direction Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTradeDirection("ngnToStock")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tradeDirection === "ngnToStock"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          NGN → Stock
        </button>
        <button
          onClick={() => setTradeDirection("stockToNgn")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tradeDirection === "stockToNgn"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Stock → NGN
        </button>
      </div>

      {/* Stock Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Stock
        </label>
        <select
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a stock...</option>
          {allStockTokens?.map((token) => (
            <option key={token} value={token}>
              {token.slice(0, 6)}...{token.slice(-4)}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Info Display */}
      {stockInfo && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900">
                {stockInfo.symbol}
              </h4>
              <p className="text-sm text-gray-600">{stockInfo.companyName}</p>
              <p className="text-xs text-gray-500">{stockInfo.sector}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                ₦{formatPrice(currentPrice as bigint)}
              </p>
              <p className="text-xs text-gray-500">per token</p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Display */}
      {selectedStock && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">NGN Balance</p>
            <p className="text-sm font-semibold">
              ₦{formatBalance(ngnBalance as bigint)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {stockInfo?.symbol || "Stock"} Balance
            </p>
            <p className="text-sm font-semibold">
              {formatBalance(stockBalance as bigint)}
            </p>
          </div>
        </div>
      )}

      {/* Trade Input */}
      {selectedStock && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tradeDirection === "ngnToStock"
                ? "NGN Amount"
                : `${stockInfo?.symbol || "Stock"} Amount`}
            </label>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Swap Quote */}
          {swapQuote && inputAmount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">You will receive:</span>
                <span className="text-lg font-semibold text-blue-700">
                  {tradeDirection === "ngnToStock"
                    ? `${formatBalance(swapQuote[0])} ${stockInfo?.symbol || "Stock"}`
                    : `₦${formatBalance(swapQuote[0])}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span>Fee: </span>
                  <span>
                    {tradeDirection === "ngnToStock" ? "₦" : ""}
                    {formatBalance(swapQuote[1])}
                  </span>
                </div>
                <div>
                  <span>Price Impact: </span>
                  <span
                    className={
                      parseFloat(calculatePriceImpact()) > 5
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {calculatePriceImpact()}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Slippage Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slippage Tolerance (%)
            </label>
            <select
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1%</option>
              <option value="3">3%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleApproval}
              disabled={isWritePending || !inputAmount}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isWritePending
                ? "Approving..."
                : `Approve ${tradeDirection === "ngnToStock" ? "NGN" : stockInfo?.symbol || "Stock"}`}
            </button>

            <button
              onClick={handleSwap}
              disabled={isLoading || isWritePending || !swapQuote}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading || isWritePending ? "Swapping..." : "Execute Swap"}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
};

export default StockNGNTrader;

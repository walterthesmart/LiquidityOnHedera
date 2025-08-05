"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { StockNGNDEXABI, getStockNGNDEXAddress } from "../../abis";
import { formatEther } from "ethers";

interface DEXDashboardProps {
  className?: string;
}

interface TradingPair {
  stockToken: string;
  ngnReserve: bigint;
  stockReserve: bigint;
  totalLiquidity: bigint;
  feeRate: number;
  isActive: boolean;
  lastUpdateTime: bigint;
  priceImpactLimit: number;
}

interface StockInfo {
  symbol: string;
  companyName: string;
  sector: string;
  totalShares: bigint;
  marketCap: bigint;
  isActive: boolean;
  lastUpdated: bigint;
}

interface PairWithInfo extends TradingPair {
  stockInfo?: StockInfo;
  currentPrice?: bigint;
  priceHistory?: bigint[];
}

const DEXDashboard: React.FC<DEXDashboardProps> = ({ className = "" }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [pairs, setPairs] = useState<PairWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"volume" | "liquidity" | "price">(
    "liquidity",
  );

  const dexAddress = chainId ? getStockNGNDEXAddress(chainId) : "";

  // Get all stock tokens
  const { data: allStockTokens } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getAllStockTokens",
    query: {
      enabled: !!dexAddress,
    },
  }) as { data: string[] | undefined };

  // Get DEX statistics
  const { data: dexStats } = useReadContract({
    address: dexAddress as `0x${string}`,
    abi: StockNGNDEXABI,
    functionName: "getDEXStats",
    query: {
      enabled: !!dexAddress,
      refetchInterval: 5000, // Replaces watch: true
    },
  }) as { data: [bigint, bigint, bigint, bigint] | undefined };

  // Load trading pairs data
  useEffect(() => {
    const loadPairsData = async () => {
      if (!allStockTokens || !dexAddress) return;

      setLoading(true);
      const pairsData: PairWithInfo[] = [];

      for (const stockToken of allStockTokens) {
        try {
          // This would need to be implemented with multiple contract calls
          // For now, we'll create a simplified version
          const pairData: PairWithInfo = {
            stockToken,
            ngnReserve: 0n,
            stockReserve: 0n,
            totalLiquidity: 0n,
            feeRate: 30,
            isActive: true,
            lastUpdateTime: BigInt(Date.now()),
            priceImpactLimit: 500,
          };

          pairsData.push(pairData);
        } catch (error) {
          console.error(`Error loading data for ${stockToken}:`, error);
        }
      }

      setPairs(pairsData);
      setLoading(false);
    };

    loadPairsData();
  }, [allStockTokens, dexAddress]);

  const formatNumber = (
    value: bigint | number,
    decimals: number = 2,
  ): string => {
    const num =
      typeof value === "bigint" ? parseFloat(formatEther(value)) : value;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCompactNumber = (value: bigint | number): string => {
    const num =
      typeof value === "bigint" ? parseFloat(formatEther(value)) : value;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            DEX Dashboard
          </h3>
          <p className="text-gray-600">
            Please connect your wallet to view DEX data
          </p>
        </div>
      </div>
    );
  }

  if (!dexAddress) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            DEX Dashboard
          </h3>
          <p className="text-yellow-600">DEX not deployed on this network</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">DEX Dashboard</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* DEX Statistics */}
      {dexStats && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Pairs</p>
              <p className="text-2xl font-bold text-blue-700">
                {dexStats[0].toString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Liquidity</p>
              <p className="text-2xl font-bold text-green-700">
                ₦{formatCompactNumber(dexStats[3])}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">24h Volume</p>
              <p className="text-2xl font-bold text-purple-700">
                ₦{formatCompactNumber(dexStats[1])}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Fees Collected</p>
              <p className="text-2xl font-bold text-yellow-700">
                ₦{formatCompactNumber(dexStats[2])}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trading Pairs Table */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Trading Pairs</h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "volume" | "liquidity" | "price")
              }
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="liquidity">Liquidity</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading trading pairs...</p>
          </div>
        ) : pairs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No trading pairs available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liquidity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pairs.map((pair, index) => (
                  <tr key={pair.stockToken} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {pair.stockInfo?.symbol?.slice(0, 2) ||
                                `S${index + 1}`}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pair.stockInfo?.symbol || `Stock ${index + 1}`}/NGN
                          </div>
                          <div className="text-sm text-gray-500">
                            {pair.stockInfo?.companyName || "Unknown Company"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₦{formatNumber(pair.currentPrice || 0n)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +2.5%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{formatCompactNumber(pair.ngnReserve)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{formatCompactNumber(0)}{" "}
                      {/* Would need to track volume */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(pair.feeRate / 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Trade
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Add Liquidity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create New Pair
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Add Liquidity
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
            View Analytics
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DEXDashboard;

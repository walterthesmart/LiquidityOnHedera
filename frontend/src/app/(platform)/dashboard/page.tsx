"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check, Copy } from "lucide-react";
import {
  getStockHoldings,
  getTotalPortfolioValue,
  getInitialInvestment,
} from "@/server-actions/stocks/dashboard";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { PortfolioPerformance } from "./components/portfolio-performance";
import { AssetHoldings } from "./components/asset-holdings";
import { SummaryCards } from "./components/summary-cards";
import { SendReceiveTokens } from "./components/send-receive-tokens";
import { StockHoldings, PerformanceData, DateRange } from "./components/types";
import getGraphData from "@/server-actions/dashboard/graph";
import { GraphDataMode } from "@/constants/types";

const NGN_TO_AVAX = 2560;

const DashBoardPage = () => {
  // RainbowKit wallet (EVM only)
  const { isConnected, address } = useAccount();

  // Use EVM address as the active address
  const activeAddress = address;

  const [portfolio, setPortfolio] = useState<StockHoldings[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("1w");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!activeAddress) return;

    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      toast.success("Address copied to clipboard!");

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
      console.error("Copy error:", err);
    }
  };

  const fetchData = useCallback(async () => {
    if (!isConnected || !activeAddress) return;

    try {
      setLoading(true);
      setError(null);

      const fromDate = getDateFromRange(dateRange);
      const mode: GraphDataMode =
        dateRange === "1w" || dateRange === "1m"
          ? GraphDataMode.WEEKLY
          : GraphDataMode.MONTHLY;

      const [holdings, invested, portfolioValue, performance] =
        await Promise.all([
          getStockHoldings(activeAddress),
          getInitialInvestment({ user_address: activeAddress }),
          getTotalPortfolioValue(activeAddress),
          getGraphData({
            user_address: activeAddress,
            from: fromDate,
            to: new Date(),
            mode,
          }),
        ]);

      setPortfolio(holdings);
      setTotalInvested(invested);
      setCurrentValue(portfolioValue);
      setPerformanceData(
        performance.map((item) => ({
          ...item,
          name: formatDateForDisplay(item.date, dateRange),
        })),
      );
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  }, [isConnected, activeAddress, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDateFromRange = (range: DateRange): Date => {
    const date = new Date();
    switch (range) {
      case "1w":
        date.setDate(date.getDate() - 7);
        break;
      case "1m":
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date;
  };

  const formatDateForDisplay = (date: Date, range: DateRange) => {
    if (range === "1w" || range === "1m") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const totalProfit = currentValue - totalInvested;
  const profitPercentage =
    totalInvested !== 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Wallet className="h-12 w-12 mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
        <p className="text-gray-500 mb-4">
          Please connect your wallet to view your portfolio
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Just a moment...</p>
        {activeAddress && (
          <p className="text-sm text-gray-500 mt-2">
            Wallet: {activeAddress.substring(0, 6)}...
            {activeAddress.substring(activeAddress.length - 4)}
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 p-4 rounded-lg max-w-md text-center">
          <h2 className="text-red-600 font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-16 mx-auto mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mt-6">Your Dashboard</h1>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-gray-500" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-full group">
            <span className="text-sm px-3 py-1">
              {activeAddress
                ? `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}`
                : "Disconnected"}
            </span>
            {activeAddress && (
              <button
                onClick={handleCopy}
                disabled={copied}
                className="cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={copied ? "Copied!" : "Copy address"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <SummaryCards
        currentValue={currentValue}
        totalProfit={totalProfit}
        totalInvested={totalInvested}
        profitPercentage={profitPercentage}
        portfolio={portfolio}
      />

      {activeAddress && (
        <>
          <PortfolioPerformance
            dateRange={dateRange}
            setDateRange={setDateRange}
            performanceData={performanceData}
            loading={loading}
            netInvestment={totalInvested}
          />

          <AssetHoldings
            portfolio={portfolio}
            userAddress={activeAddress}
            isEvmConnected={isConnected}
            isHederaConnected={false}
            onUpdate={fetchData}
            NGN_TO_AVAX={NGN_TO_AVAX}
          />

          <SendReceiveTokens />
        </>
      )}
    </div>
  );
};

export default DashBoardPage;

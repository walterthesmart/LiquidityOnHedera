"use client";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getStocks } from "@/server-actions/stocks/getStocks";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useAccount } from "wagmi";
import { StockData } from "@/types";
import { toast } from "sonner";
import { useErrorHandler } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Bitfinity EVM token hooks for Nigerian stock tokens
// import {
//   useAllBitfinityTokens,
//   useBitfinityNetwork,
// } from "@/hooks/use-bitfinity-tokens";
interface Stocks {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
}
export function Stocks(/*{ stocks }: { stocks: Stocks[] }*/) {
  const handleError = useErrorHandler();
  const {
    data: stocks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    // enable polling
    refetchInterval: 20000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle errors using useEffect
  React.useEffect(() => {
    if (error) {
      handleError(error as Error, {
        component: "Stocks",
        operation: "fetchStocks",
      });
      toast.error("Failed to fetch stock data. Please check your connection.");
    }
  }, [error, handleError]);
  const { isConnected } = useAccount();

  // Bitfinity EVM integration available but not used in this component yet
  // const { tokens: bitfinityTokens, loading: tokensLoading } = useAllBitfinityTokens();
  // const { network } = useBitfinityNetwork();

  if (isLoading) {
    return (
      <div className="w-full grid gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="w-24 h-8 bg-gray-200" />
        ))}
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Unable to Load Stock Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {error instanceof Error && error.message.includes("connection")
              ? "Database connection failed. Please check your internet connection and try again."
              : error instanceof Error && error.message.includes("fetch")
                ? "Network error occurred while fetching stock data. This might be due to connectivity issues."
                : "There was an error loading the stock data. Please try again."}
          </p>

          {process.env.NODE_ENV === "development" && error instanceof Error && (
            <details className="bg-gray-50 p-4 rounded-md">
              <summary className="cursor-pointer font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // usePolling(10000);

  let chainSpecificStocks: StockData[];
  if (!stocks || stocks.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            No Stocks Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            No stock data is currently available. This might be due to database
            connectivity issues or the data hasn&apos;t been loaded yet.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    if (isConnected) {
      // Show all stocks for connected EVM wallets
      chainSpecificStocks = stocks || [];
    } else {
      toast.warning("Connect your wallet to view stocks");
      chainSpecificStocks = [];
    }
  }

  return (
    <div className="">
      {stocks && <DataTable columns={columns} data={chainSpecificStocks} />}
    </div>
  );
}

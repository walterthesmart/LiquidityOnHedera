"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  BarChart3,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { StockHoldings } from "./types";

interface SummaryCardsProps {
  currentValue: number;
  totalProfit: number;
  totalInvested: number;
  profitPercentage: number;
  portfolio: StockHoldings[];
}

export const SummaryCards = ({
  currentValue,
  totalProfit,
  totalInvested,
  profitPercentage,
  portfolio,
}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Portfolio Value
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₦
            {currentValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </div>
          <p
            className={`text-xs ${profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {profitPercentage >= 0 ? (
              <ArrowUp className="inline h-3 w-3" />
            ) : (
              <ArrowDown className="inline h-3 w-3" />
            )}
            {Math.abs(profitPercentage).toFixed(2)}% from total investment
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Profit/Loss
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {totalProfit >= 0 ? "+" : ""}₦{" "}
            {totalProfit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            From investment of ₦{" "}
            {totalInvested.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Assets Owned</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{portfolio.length}</div>
          <p className="text-xs text-muted-foreground">
            Total of {portfolio.reduce((acc, stock) => acc + stock.shares, 0)}{" "}
            shares
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

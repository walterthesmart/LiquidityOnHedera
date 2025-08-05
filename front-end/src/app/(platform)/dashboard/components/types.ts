export interface StockHoldings {
  tokenId: string;
  symbol: string;
  name: string;
  shares: number;
  buy_price_perShare: number;
  current_price: number;
  profit: number;
  total_value_bought: number;
}

export type DateRange = "1w" | "1m";

export interface PerformanceData {
  date: Date;
  value: number;
  name?: string;
}

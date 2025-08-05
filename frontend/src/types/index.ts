export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  tokenID: string;
  change: number;
  chain: string;
  // Additional properties for enhanced stock information
  sector?: string;
  marketCap?: number;
  volume?: number;
  lastUpdated?: string;
  description?: string;
  industry?: string;
  listingDate?: string;
  isin?: string;
}

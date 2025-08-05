import { ethers } from 'ethers';

export interface TradeOrder {
  stockSymbol: string;
  amount: number;
  price: number;
  orderType: 'buy' | 'sell';
  timestamp: number;
}

export interface TradingPair {
  stockToken: string;
  ngnToken: string;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
}

export class TradingEngine {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  async executeTrade(order: TradeOrder): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for trading');
    }

    // Simulate trade execution
    console.log('Executing trade:', order);
    
    // Return transaction hash
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  async getMarketPrice(stockSymbol: string): Promise<number> {
    // Fetch current market price
    const response = await fetch(`/api/nigerian-stocks?action=prices&symbol=${stockSymbol}`);
    const data = await response.json();
    return data.price || 0;
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    // Fetch available trading pairs
    const response = await fetch('/api/trading-pairs');
    const data = await response.json();
    return data.pairs || [];
  }

  calculateSlippage(amount: number, liquidity: number): number {
    // Simple slippage calculation
    return (amount / liquidity) * 100;
  }

  validateOrder(order: TradeOrder): boolean {
    return order.amount > 0 && order.price > 0 && order.stockSymbol.length > 0;
  }
}

export const tradingEngine = new TradingEngine(
  new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BITFINITY_TESTNET_RPC_URL)
);

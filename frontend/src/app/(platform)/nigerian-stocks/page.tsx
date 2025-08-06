import { Metadata } from 'next';
import NigerianStocksDashboard from '@/components/NigerianStocksDashboard';

export const metadata: Metadata = {
  title: 'Nigerian Stocks | Liquidity Platform',
  description: 'Trade Nigerian stocks on Hedera Testnet with real-time data and secure transactions.',
  keywords: ['Nigerian stocks', 'NSE', 'Hedera', 'blockchain', 'trading', 'DANGCEM', 'GTCO', 'AIRTELAFRI'],
};

export default function NigerianStocksPage() {
  return <NigerianStocksDashboard />;
}

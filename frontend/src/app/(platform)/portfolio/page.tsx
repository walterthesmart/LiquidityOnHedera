import { Metadata } from 'next';
import PortfolioDashboard from '@/components/PortfolioDashboard';

export const metadata: Metadata = {
  title: 'Portfolio | Liquidity Platform',
  description: 'View your Nigerian stock portfolio and holdings on Hedera Testnet.',
  keywords: ['portfolio', 'Nigerian stocks', 'Hedera', 'blockchain', 'holdings'],
};

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}

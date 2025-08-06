import { Metadata } from 'next';
import DeploymentStatus from '@/components/DeploymentStatus';

export const metadata: Metadata = {
  title: 'Deployment Status | Liquidity Platform',
  description: 'View the current deployment status of smart contracts on Hedera Testnet.',
};

export default function DeploymentPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Deployment Status
        </h1>
        <p className="text-gray-600">
          Monitor and manage smart contract deployments on Hedera Testnet
        </p>
      </div>
      
      <DeploymentStatus />
    </div>
  );
}

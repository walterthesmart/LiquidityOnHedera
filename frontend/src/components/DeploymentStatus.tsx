'use client';

import React from 'react';
import { useHederaContracts } from '@/hooks/use-hedera-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Copy, Terminal, Zap, Wallet } from 'lucide-react';
import contractsConfig from '@/config/hedera-contracts.json';
import ContractTestComponent from './ContractTestComponent';

export default function DeploymentStatus() {
  const contracts = useHederaContracts();
  const isTestData = contractsConfig.contracts.NGNStablecoin.address.startsWith('0xAAAAA');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Live Integration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span>Live Integration Status</span>
              </CardTitle>
              <CardDescription>
                Real-time contract integration and wallet connectivity
              </CardDescription>
            </div>
            <Badge variant={contracts.isFullyDeployed ? "default" : "secondary"}>
              {contracts.isFullyDeployed ? "Fully Integrated" : "Partial Integration"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Contract Service</span>
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Live Trading</span>
                <Badge variant={contracts.isFullyDeployed ? "default" : "secondary"}>
                  {contracts.isFullyDeployed ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Wallet Connection</span>
                <Badge variant={contracts.isConnected ? "default" : "outline"}>
                  {contracts.isConnected ? (
                    <>
                      <Wallet className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    "Not Connected"
                  )}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Available Stocks</span>
                <Badge variant="outline">
                  {contracts.availableStocks.length} Tokens
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Network</span>
                <Badge variant="outline">
                  Hedera Testnet
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Portfolio Tracking</span>
                <Badge variant={contracts.isConnected ? "default" : "outline"}>
                  {contracts.isConnected ? "Active" : "Connect Wallet"}
                </Badge>
              </div>
            </div>
          </div>

          {contracts.isConnected && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>Wallet Connected:</strong> {contracts.userAddress?.slice(0, 6)}...{contracts.userAddress?.slice(-4)}
              </p>
              <p className="text-green-700 text-sm mt-1">
                NGN Balance: {parseFloat(contracts.ngnBalance).toFixed(2)} NGN
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {isTestData ? (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span>Deployment Status</span>
              </CardTitle>
              <CardDescription>
                Current status of smart contracts on Hedera Testnet
              </CardDescription>
            </div>
            <Badge variant={isTestData ? "secondary" : "default"}>
              {isTestData ? "Mock Data" : "Live Deployment"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isTestData ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Currently using mock data for development. Deploy actual contracts to Hedera Testnet to enable live trading.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All contracts are successfully deployed and operational on Hedera Testnet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract Addresses</CardTitle>
          <CardDescription>
            Smart contract addresses on {contractsConfig.network}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(contractsConfig.contracts).map(([name, contract]) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500">Contract ID: {contract.contractId}</p>
                  <p className="text-sm text-gray-400 font-mono">{contract.address}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(contract.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://hashscan.io/testnet/contract/${contract.contractId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Tokens</CardTitle>
          <CardDescription>
            Nigerian stock tokens available for trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(contractsConfig.stockTokens).map(([symbol, token]) => (
              <div key={symbol} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{symbol}</h4>
                  <Badge variant="outline">{token.sector}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{token.companyName}</p>
                <p className="text-xs text-gray-500">Contract ID: {token.contractId}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{token.address}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isTestData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>Deploy to Hedera Testnet</span>
            </CardTitle>
            <CardDescription>
              Follow these steps to deploy actual contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Prerequisites</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Hedera testnet account with sufficient HBAR balance</li>
                  <li>• Account ID and private key configured in .env file</li>
                  <li>• Node.js and npm installed</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Deployment Commands</h4>
                <div className="space-y-2">
                  <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                    <p># Navigate to backend directory</p>
                    <p>cd backend</p>
                    <p></p>
                    <p># Set up environment variables</p>
                    <p>cp .env.example .env</p>
                    <p># Edit .env with your Hedera credentials</p>
                    <p></p>
                    <p># Deploy contracts using Hardhat</p>
                    <p>npm run deploy:hedera-hardhat</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Get Hedera Testnet Account</h4>
                <p className="text-sm text-blue-700 mb-3">
                  You need a Hedera testnet account to deploy contracts. Get one for free:
                </p>
                <Button
                  onClick={() => window.open('https://portal.hedera.com/register', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Hedera Account
                </Button>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2 text-green-800">After Deployment</h4>
                <p className="text-sm text-green-700">
                  Once deployed, the contract addresses will be automatically updated in the frontend configuration,
                  and you&apos;ll be able to interact with live contracts on Hedera Testnet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Service Test */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Service Test</CardTitle>
          <CardDescription>
            Test the contract service integration and ABI loading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractTestComponent />
        </CardContent>
      </Card>
    </div>
  );
}

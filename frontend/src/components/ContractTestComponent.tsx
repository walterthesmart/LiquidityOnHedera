'use client';

import React, { useState } from 'react';
import { hederaContractService } from '@/lib/hedera-contract-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ContractTestComponent() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    details?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runContractTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];

    // Test 1: Check deployment status
    try {
      const isDeployed = hederaContractService.isFullyDeployed();
      results.push({
        name: 'Deployment Status Check',
        status: 'success' as const,
        message: `Fully deployed: ${isDeployed}`,
        details: isDeployed ? 'All contracts are deployed' : 'Some contracts missing'
      });
    } catch (error: unknown) {
      results.push({
        name: 'Deployment Status Check',
        status: 'error' as const,
        message: 'Failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 2: Get available stocks
    try {
      const stocks = hederaContractService.getAvailableStocks();
      results.push({
        name: 'Available Stocks',
        status: 'success' as const,
        message: `${stocks.length} stocks available`,
        details: stocks.join(', ')
      });
    } catch (error: unknown) {
      results.push({
        name: 'Available Stocks',
        status: 'error' as const,
        message: 'Failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 3: Get deployed contracts info
    try {
      const contractsInfo = hederaContractService.getDeployedContracts();
      results.push({
        name: 'Contracts Info',
        status: 'success' as const,
        message: `Network: ${contractsInfo.network}`,
        details: `Last updated: ${contractsInfo.lastUpdated}`
      });
    } catch (error: unknown) {
      results.push({
        name: 'Contracts Info',
        status: 'error' as const,
        message: 'Failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 4: Try to create NGN contract instance
    try {
      const ngnContract = hederaContractService.getNGNStablecoin();
      results.push({
        name: 'NGN Contract Instance',
        status: 'success' as const,
        message: 'Contract instance created',
        details: `Address: ${await ngnContract.getAddress()}`
      });
    } catch (error: unknown) {
      results.push({
        name: 'NGN Contract Instance',
        status: 'error' as const,
        message: 'Failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 5: Try to create stock contract instance
    try {
      const stockContract = hederaContractService.getStockToken('DANGCEM');
      results.push({
        name: 'Stock Contract Instance (DANGCEM)',
        status: 'success' as const,
        message: 'Contract instance created',
        details: `Address: ${await stockContract.getAddress()}`
      });
    } catch (error: unknown) {
      results.push({
        name: 'Stock Contract Instance (DANGCEM)',
        status: 'error' as const,
        message: 'Failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Contract Service Test</CardTitle>
        <CardDescription>
          Test the Hedera contract service integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runContractTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Contract Tests'
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <Alert key={index} className={result.status === 'success' ? 'border-green-200' : 'border-red-200'}>
                  <div className="flex items-start space-x-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.name}</span>
                        <span className={`text-sm ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.message}
                        </span>
                      </div>
                      <AlertDescription className="mt-1">
                        {result.details}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState } from 'react';
import { hederaContractService } from '@/lib/hedera-contract-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ContractTestComponent() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runContractTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];

    // Test 1: Check deployment status
    try {
      const isDeployed = hederaContractService.isFullyDeployed();
      results.push({
        test: 'Deployment Status Check',
        status: 'success',
        result: `Fully deployed: ${isDeployed}`,
        details: isDeployed ? 'All contracts are deployed' : 'Some contracts missing'
      });
    } catch (error) {
      results.push({
        test: 'Deployment Status Check',
        status: 'error',
        result: 'Failed',
        details: error.message
      });
    }

    // Test 2: Get available stocks
    try {
      const stocks = hederaContractService.getAvailableStocks();
      results.push({
        test: 'Available Stocks',
        status: 'success',
        result: `${stocks.length} stocks available`,
        details: stocks.join(', ')
      });
    } catch (error) {
      results.push({
        test: 'Available Stocks',
        status: 'error',
        result: 'Failed',
        details: error.message
      });
    }

    // Test 3: Get deployed contracts info
    try {
      const contractsInfo = hederaContractService.getDeployedContracts();
      results.push({
        test: 'Contracts Info',
        status: 'success',
        result: `Network: ${contractsInfo.network}`,
        details: `Last updated: ${contractsInfo.lastUpdated}`
      });
    } catch (error) {
      results.push({
        test: 'Contracts Info',
        status: 'error',
        result: 'Failed',
        details: error.message
      });
    }

    // Test 4: Try to create NGN contract instance
    try {
      const ngnContract = hederaContractService.getNGNStablecoin();
      results.push({
        test: 'NGN Contract Instance',
        status: 'success',
        result: 'Contract instance created',
        details: `Address: ${await ngnContract.getAddress()}`
      });
    } catch (error) {
      results.push({
        test: 'NGN Contract Instance',
        status: 'error',
        result: 'Failed',
        details: error.message
      });
    }

    // Test 5: Try to create stock contract instance
    try {
      const stockContract = hederaContractService.getStockToken('DANGCEM');
      results.push({
        test: 'Stock Contract Instance (DANGCEM)',
        status: 'success',
        result: 'Contract instance created',
        details: `Address: ${await stockContract.getAddress()}`
      });
    } catch (error) {
      results.push({
        test: 'Stock Contract Instance (DANGCEM)',
        status: 'error',
        result: 'Failed',
        details: error.message
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
                        <span className="font-medium">{result.test}</span>
                        <span className={`text-sm ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.result}
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

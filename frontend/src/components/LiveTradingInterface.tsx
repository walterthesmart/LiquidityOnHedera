'use client';

import React, { useState } from 'react';
import { useHederaContracts, useStock } from '@/hooks/use-hedera-contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface LiveTradingInterfaceProps {
  stockSymbol: string;
}

export default function LiveTradingInterface({ stockSymbol }: LiveTradingInterfaceProps) {
  const contracts = useHederaContracts();
  const stock = useStock(stockSymbol);
  
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');

  const handleConnectWallet = async () => {
    try {
      await contracts.connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleBuyStock = () => {
    if (!buyAmount || !contracts.userAddress) return;
    
    const minStockAmount = (parseFloat(buyAmount) * 0.95).toString(); // 5% slippage tolerance
    contracts.swapNGNForStock({
      stockSymbol,
      ngnAmount: buyAmount,
      minStockAmount
    });
  };

  const handleSellStock = () => {
    if (!sellAmount || !contracts.userAddress) return;
    
    const minNGNAmount = (parseFloat(sellAmount) * parseFloat(stock.price) * 0.95).toString(); // 5% slippage tolerance
    contracts.swapStockForNGN({
      stockSymbol,
      stockAmount: sellAmount,
      minNGNAmount
    });
  };

  const handleMintNGN = () => {
    if (!mintAmount || !contracts.userAddress) return;
    
    contracts.mintNGN({
      to: contracts.userAddress,
      amount: mintAmount
    });
  };

  if (!contracts.isFullyDeployed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>Contracts Not Deployed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The trading contracts are not fully deployed yet. Please check the deployment status.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Wallet Connection</span>
            </div>
            <Badge variant={contracts.isConnected ? "default" : "secondary"}>
              {contracts.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!contracts.isConnected ? (
            <Button onClick={handleConnectWallet} className="w-full">
              Connect Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Address: {contracts.userAddress?.slice(0, 6)}...{contracts.userAddress?.slice(-4)}
              </p>
              <div className="flex items-center justify-between">
                <span>NGN Balance: {parseFloat(contracts.ngnBalance).toFixed(2)} NGN</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => contracts.refetchNGNBalance()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{stock.config?.name || stockSymbol}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{stock.config?.sector}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(contracts.getContractExplorerUrl(stock.config?.address || ''), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>{stock.config?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-lg font-semibold">₦{parseFloat(stock.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Balance</p>
              <p className="text-lg font-semibold">{parseFloat(stock.balance).toFixed(4)} {stockSymbol}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Supply</p>
              <p className="text-lg font-semibold">{stock.info ? parseFloat(stock.info.totalSupply).toFixed(0) : 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Supply</p>
              <p className="text-lg font-semibold">{stock.info ? parseFloat(stock.info.maxSupply).toFixed(0) : 'Loading...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Interface */}
      {contracts.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Live Trading</CardTitle>
            <CardDescription>Trade {stockSymbol} tokens with NGN stablecoin</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="buy">Buy Stock</TabsTrigger>
                <TabsTrigger value="sell">Sell Stock</TabsTrigger>
                <TabsTrigger value="mint">Mint NGN</TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NGN Amount to Spend</label>
                  <Input
                    type="number"
                    placeholder="Enter NGN amount"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                  />
                  {buyAmount && (
                    <p className="text-sm text-gray-500">
                      You will receive approximately {(parseFloat(buyAmount) / parseFloat(stock.price)).toFixed(4)} {stockSymbol}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleBuyStock}
                  disabled={!buyAmount || contracts.swapNGNForStockStatus === 'pending'}
                  className="w-full"
                >
                  {contracts.swapNGNForStockStatus === 'pending' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Buying...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Buy {stockSymbol}
                    </>
                  )}
                </Button>
                {contracts.swapNGNForStockError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error: {contracts.swapNGNForStockError.message}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="sell" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{stockSymbol} Amount to Sell</label>
                  <Input
                    type="number"
                    placeholder={`Enter ${stockSymbol} amount`}
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    max={stock.balance}
                  />
                  {sellAmount && (
                    <p className="text-sm text-gray-500">
                      You will receive approximately {(parseFloat(sellAmount) * parseFloat(stock.price)).toFixed(2)} NGN
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSellStock}
                  disabled={!sellAmount || contracts.swapStockForNGNStatus === 'pending'}
                  className="w-full"
                  variant="outline"
                >
                  {contracts.swapStockForNGNStatus === 'pending' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Selling...
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Sell {stockSymbol}
                    </>
                  )}
                </Button>
                {contracts.swapStockForNGNError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error: {contracts.swapStockForNGNError.message}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="mint" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NGN Amount to Mint</label>
                  <Input
                    type="number"
                    placeholder="Enter NGN amount to mint"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Mint NGN stablecoin for testing purposes
                  </p>
                </div>
                <Button
                  onClick={handleMintNGN}
                  disabled={!mintAmount || contracts.mintNGNStatus === 'pending'}
                  className="w-full"
                  variant="secondary"
                >
                  {contracts.mintNGNStatus === 'pending' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mint NGN
                    </>
                  )}
                </Button>
                {contracts.mintNGNError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error: {contracts.mintNGNError.message}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Stock Token:</span>
              <span className="font-mono">{stock.config?.address}</span>
            </div>
            <div className="flex justify-between">
              <span>NGN Stablecoin:</span>
              <span className="font-mono">{contracts.contractsInfo?.contracts.NGNStablecoin.address}</span>
            </div>
            <div className="flex justify-between">
              <span>DEX Contract:</span>
              <span className="font-mono">{contracts.contractsInfo?.contracts.StockNGNDEX.address}</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span>Hedera Testnet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import database from '@/db';
import { getContractConfig } from '@/config/contracts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const symbol = searchParams.get('symbol');
    const chainId = parseInt(searchParams.get('chainId') || '11155111'); // Default to Sepolia

    // Get contract configuration for the specified network
    const contractConfig = getContractConfig(chainId);
    
    if (!contractConfig || contractConfig.totalTokens === 0) {
      return NextResponse.json({
        error: 'No contracts deployed on this network',
        chainId,
        availableNetworks: [11155111], // Sepolia
      }, { status: 400 });
    }

    switch (action) {
      case 'stocks':
        return await handleGetStocks(chainId);
      
      case 'prices':
        if (symbol) {
          return await handleGetStockPrice(symbol, chainId);
        } else {
          return await handleGetAllPrices(chainId);
        }
      
      case 'market-stats':
        return await handleGetMarketStats(chainId);
      
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: stocks, prices, market-stats',
          supportedActions: ['stocks', 'prices', 'market-stats'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Nigerian stocks API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleGetStocks(chainId: number) {
  try {
    const stocks = await database.getStocks();
    const contractConfig = getContractConfig(chainId);
    
    // Enhance stocks with contract addresses
    const enhancedStocks = stocks.map(stock => ({
      ...stock,
      contractAddress: contractConfig?.tokens[stock.symbol] || null,
      chainId,
      blockExplorer: contractConfig?.blockExplorer,
      hasContract: !!contractConfig?.tokens[stock.symbol],
    }));

    return NextResponse.json({
      success: true,
      data: enhancedStocks,
      meta: {
        total: enhancedStocks.length,
        chainId,
        network: getNetworkName(chainId),
        contractsDeployed: contractConfig?.totalTokens || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({
      error: 'Failed to fetch stocks',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleGetStockPrice(symbol: string, chainId: number) {
  try {
    const price = await database.getStockPrice(symbol.toUpperCase());
    const contractConfig = getContractConfig(chainId);
    
    if (!price) {
      return NextResponse.json({
        error: 'Stock not found',
        symbol,
        chainId,
      }, { status: 404 });
    }

    const enhancedPrice = {
      ...price,
      contractAddress: contractConfig?.tokens[symbol.toUpperCase()] || null,
      chainId,
      blockExplorer: contractConfig?.blockExplorer,
      hasContract: !!contractConfig?.tokens[symbol.toUpperCase()],
    };

    return NextResponse.json({
      success: true,
      data: enhancedPrice,
      meta: {
        symbol: symbol.toUpperCase(),
        chainId,
        network: getNetworkName(chainId),
      },
    });
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock price',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleGetAllPrices(chainId: number) {
  try {
    const prices = await database.getAllStockPrices();
    const contractConfig = getContractConfig(chainId);
    
    // Enhance prices with contract addresses
    const enhancedPrices = prices.map(price => ({
      ...price,
      contractAddress: contractConfig?.tokens[price.symbol] || null,
      chainId,
      blockExplorer: contractConfig?.blockExplorer,
      hasContract: !!contractConfig?.tokens[price.symbol],
    }));

    return NextResponse.json({
      success: true,
      data: enhancedPrices,
      meta: {
        total: enhancedPrices.length,
        chainId,
        network: getNetworkName(chainId),
        contractsDeployed: contractConfig?.totalTokens || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching all prices:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock prices',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleGetMarketStats(chainId: number) {
  try {
    const stocks = await database.getStocks();
    const prices = await database.getAllStockPrices();
    const contractConfig = getContractConfig(chainId);
    
    // Calculate market statistics
    const totalStocks = stocks.length;
    const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0);
    const averagePrice = prices.length > 0 ? 
      prices.reduce((sum, price) => sum + price.price, 0) / prices.length : 0;
    
    const gainers = prices.filter(p => p.changeAmount > 0).length;
    const losers = prices.filter(p => p.changeAmount < 0).length;
    const unchanged = prices.filter(p => p.changeAmount === 0).length;

    return NextResponse.json({
      success: true,
      data: {
        totalStocks,
        totalMarketCap,
        averagePrice,
        marketMovement: {
          gainers,
          losers,
          unchanged,
        },
        contractsDeployed: contractConfig?.totalTokens || 0,
        topGainers: prices
          .filter(p => p.changeAmount > 0)
          .sort((a, b) => b.changeAmount - a.changeAmount)
          .slice(0, 5),
        topLosers: prices
          .filter(p => p.changeAmount < 0)
          .sort((a, b) => a.changeAmount - b.changeAmount)
          .slice(0, 5),
      },
      meta: {
        chainId,
        network: getNetworkName(chainId),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch market statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    11155111: 'Ethereum Sepolia',
    296: 'Hedera Testnet',
    295: 'Hedera Mainnet',
    355113: 'Bitfinity EVM Testnet',
    355110: 'Bitfinity EVM Mainnet',
  };
  return networks[chainId] || 'Unknown Network';
}

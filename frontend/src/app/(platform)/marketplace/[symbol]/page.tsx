/**
 * Stock Detail Page - Simplified Design
 *
 * Clean stock detail page featuring only the TradingView advanced chart
 * and comprehensive stock information displayed in cards.
 * Removed other TradingView widgets to reduce network errors and improve performance.
 *
 * @author Augment Agent
 */
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { Suspense } from "react";
import getPriceChartData from "@/server-actions/stocks/get_price_chart_data";
import { getStockBySymbol } from "@/server-actions/stocks/getStocks";
import { BuyStocksForm } from "../_components/buy-stocks-form";

// TradingView Widgets - Only keeping the advanced chart
import TradingViewWidget from "@/components/TradingViewWidget";
import TradingViewErrorBoundary from "@/components/TradingViewErrorBoundary";

// DEX Trading Components
import { QuickTradingWidget } from "@/components/DEX";

//interface for data returned by getStockBySymbol
// interface stockSymbolData {
//   id: number,
//   symbol: string,
//   name: string,
//   price: number,
//   change: number,
//   tokenID: number,
// };

export default async function StockDetail({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  if (!symbol) {
    return (
      <div className="h-screen flex justify-center items-center">
        Stock not found
      </div>
    );
  } // In a real app, you would fetch this based on symbol

  const _data = await getPriceChartData(symbol); // eslint-disable-line @typescript-eslint/no-unused-vars

  const stockSymbol = await getStockBySymbol(symbol);
  const stock = {
    ...stockSymbol,
    description: `${stockSymbol?.name} is a revolutionary company`,
    exchange: `${stockSymbol?.symbol}-NSE`,
    supply: 100000,
    borrow: 50000,
    utilizationRate: 10,
  };

  if (!stockSymbol) {
    return (
      <div className="h-screen flex justify-center items-center">
        Stock not found
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50/30">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header Section with Symbol Info */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Company Name and Basic Info */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    {stockSymbol.name}
                  </h1>
                  <span className="text-lg text-gray-600">
                    ({stockSymbol.symbol})
                  </span>
                  <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {stock.exchange}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ₦{stockSymbol.price.toFixed(2)}
                  </span>
                  <div
                    className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      stockSymbol.change >= 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {stockSymbol.change >= 0 ? (
                      <ArrowUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-1" />
                    )}
                    <span>
                      {stockSymbol.change >= 0 ? "+" : ""}
                      {stockSymbol.change.toFixed(2)} (
                      {stockSymbol.change.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stock Information & Quick Trading */}
            <div className="lg:w-96 space-y-6">
              {/* Quick Trading Widget */}
              <Suspense fallback={<div className="h-64 bg-white rounded-lg shadow-sm animate-pulse" />}>
                <QuickTradingWidget
                  stockToken={`0x${symbol.toLowerCase()}`} // This would need to be the actual token address
                  stockSymbol={stockSymbol.symbol}
                  stockName={stockSymbol.name}
                  className="shadow-sm"
                />
              </Suspense>

              {/* Stock Information */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Stock Information</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol:</span>
                      <span className="font-medium">{stockSymbol.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{stockSymbol.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sector:</span>
                      <span className="font-medium">{stockSymbol.sector || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap:</span>
                      <span className="font-medium">{stockSymbol.marketCap || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="text-xs text-gray-500 flex items-center font-medium">
                <span>TOTAL SUPPLY</span>
                <Info className="h-3 w-3 ml-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {stock.supply.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stock.exchange}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="text-xs text-gray-500 flex items-center font-medium">
                <span>TOTAL BORROW</span>
                <Info className="h-3 w-3 ml-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {stock.borrow.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stock.exchange}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="text-xs text-gray-500 flex items-center font-medium">
                <span>SUPPLY APY</span>
                <Info className="h-3 w-3 ml-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {stockSymbol.change}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="text-xs text-gray-500 flex items-center font-medium">
                <span>UTILIZATION RATE</span>
                <Info className="h-3 w-3 ml-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {stock.utilizationRate}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Charts and Analysis */}
          <div className="xl:col-span-3 space-y-6">
            {/* Advanced Chart Widget */}
            <div className="bg-white rounded-lg shadow-sm">
              <TradingViewErrorBoundary
                widgetName="Advanced Chart"
                symbol={symbol}
              >
                <Suspense
                  fallback={
                    <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
                  }
                >
                  <TradingViewWidget
                    symbol={symbol}
                    height="500px"
                    width="100%"
                    title={`${stockSymbol.name} (${stockSymbol.symbol})`}
                    className="rounded-lg"
                    interval="D"
                    allowSymbolChange={true}
                    hideToolbar={false}
                    studies={[]}
                  />
                </Suspense>
              </TradingViewErrorBoundary>
            </div>

            {/* Stock Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Performance */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Performance Metrics</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Price:</span>
                      <span className="font-medium">₦{stockSymbol.price?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Change:</span>
                      <span className={`font-medium flex items-center ${
                        (stockSymbol.change || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {(stockSymbol.change || 0) >= 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        ₦{Math.abs(stockSymbol.change || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">{stockSymbol.volume?.toLocaleString() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-sm">
                        {stockSymbol.lastUpdated ? new Date(stockSymbol.lastUpdated).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Company Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600 block">Description:</span>
                      <p className="text-sm mt-1">
                        {stockSymbol.description || `${stockSymbol.name} is a leading company in the ${stockSymbol.sector || "Nigerian"} sector.`}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Industry:</span>
                      <span className="font-medium">{stockSymbol.industry || stockSymbol.sector || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exchange:</span>
                      <span className="font-medium">Nigerian Stock Exchange (NGX)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Information */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Trading Information</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">Trading Status</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        This stock is available for trading on the Nigerian Stock Exchange.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trading Hours:</span>
                        <span className="font-medium">9:30 AM - 2:30 PM WAT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">Nigerian Naira (₦)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lot Size:</span>
                        <span className="font-medium">100 shares</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Information */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Market Information</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Market Status</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Nigerian Stock Exchange is currently open for trading.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market:</span>
                        <span className="font-medium">Nigerian Stock Exchange</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Listing Date:</span>
                        <span className="font-medium">{stockSymbol.listingDate || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ISIN:</span>
                        <span className="font-medium">{stockSymbol.isin || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Trading Form */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <BuyStocksForm entry={stockSymbol} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

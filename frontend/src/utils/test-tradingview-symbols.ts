/**
 * Test utility for verifying TradingView symbol conversion
 * This file helps debug symbol format issues with the TradingView widget
 */

import {
  getTradingViewSymbol,
  NIGERIAN_STOCK_SYMBOLS,
  getAlternativeSymbolFormats,
} from "@/components/TradingViewWidget";

/**
 * Test symbol conversion for all Nigerian stocks
 */
export function testAllSymbolConversions(): void {
  console.log("=== TradingView Symbol Conversion Test ===");

  const testSymbols = Object.keys(NIGERIAN_STOCK_SYMBOLS);

  testSymbols.forEach((symbol) => {
    const converted = getTradingViewSymbol(symbol);
    const alternatives = getAlternativeSymbolFormats(symbol);

    console.log(`${symbol} -> ${converted}`);
    console.log(`  Alternatives: ${alternatives.join(", ")}`);
  });

  console.log("\n=== Test Complete ===");
}

/**
 * Test TradingView widget configuration
 */
export function testTradingViewConfig(symbol: string): void {
  console.log("=== TradingView Configuration Test ===");

  const tradingViewSymbol = getTradingViewSymbol(symbol);
  const containerId = `test_${symbol}_${Date.now()}`;

  const testConfig = {
    autosize: true,
    symbol: tradingViewSymbol,
    interval: "D",
    timezone: "Etc/UTC",
    theme: "light",
    style: "1",
    locale: "en",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    allow_symbol_change: true,
    container_id: containerId,
    hide_side_toolbar: false,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    show_popup_button: true,
    popup_width: "1000",
    popup_height: "650",
    save_image: false,
    withdateranges: true,
    details: true,
    hotlist: true,
    calendar: true,
    studies: [],
  };

  console.log("Configuration for symbol:", symbol);
  console.log("TradingView symbol:", tradingViewSymbol);
  console.log("Full config:", JSON.stringify(testConfig, null, 2));
  console.log("\n=== Configuration Test Complete ===");
}

/**
 * Test specific symbol conversion
 */
export function testSymbolConversion(symbol: string): void {
  console.log(`=== Testing Symbol: ${symbol} ===`);

  const converted = getTradingViewSymbol(symbol);
  const alternatives = getAlternativeSymbolFormats(symbol);

  console.log(`Input: ${symbol}`);
  console.log(`Converted: ${converted}`);
  console.log(
    `Found in mapping: ${symbol.toUpperCase() in NIGERIAN_STOCK_SYMBOLS}`,
  );
  console.log(`Alternatives: ${alternatives.join(", ")}`);
}

/**
 * Test common Nigerian stock symbols
 */
export function testCommonSymbols(): void {
  const commonSymbols = ["GTCO", "DANGCEM", "MTNN", "ZENITHBANK", "ACCESS"];

  console.log("=== Testing Common Nigerian Stocks ===");

  commonSymbols.forEach((symbol) => {
    testSymbolConversion(symbol);
    console.log("---");
  });
}

// Export for use in browser console
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testTradingViewSymbols = {
    testAllSymbolConversions,
    testSymbolConversion,
    testCommonSymbols,
    getTradingViewSymbol,
    getAlternativeSymbolFormats,
  };
}

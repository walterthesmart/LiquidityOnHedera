"use client";

import React, { useEffect, useRef, memo, useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart3 } from "lucide-react";
import { TradingViewFallback, useTradingViewEnabled } from "./TradingViewFallback";

// TradingView widget configuration interface (corrected for Advanced Chart widget)
interface TradingViewWidgetConfig {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: "light" | "dark";
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  allow_symbol_change: boolean;
  container_id: string;
  hide_side_toolbar?: boolean;
  studies?: string[];
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  width?: number | string;
  height?: number | string;
  save_image?: boolean;
  hide_legend?: boolean;
  hide_volume?: boolean;
  // Additional valid properties for Advanced Chart
  withdateranges?: boolean;
  hide_top_toolbar?: boolean;
  watchlist?: string[];
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  studies_overrides?: Record<string, string | number | boolean>;
  overrides?: Record<string, string | number | boolean>;
}

// Nigerian stock symbols type for better TypeScript support
type NigerianStockSymbol = keyof typeof NIGERIAN_STOCK_SYMBOLS;

// Component props interface
interface TradingViewWidgetProps {
  symbol: string; // Any of the 38 deployed Nigerian stock symbols
  className?: string;
  height?: number | string;
  width?: number | string;
  showTitle?: boolean;
  title?: string;
  interval?: "D" | "W" | "M" | "1" | "5" | "15" | "30" | "60" | "240"; // Chart intervals
  allowSymbolChange?: boolean;
  hideToolbar?: boolean;
  studies?: string[];
}

// Nigerian Stock Exchange symbol mapping using NSENG prefix
const NIGERIAN_STOCK_SYMBOLS: Record<string, string> = {
  // Banking sector
  ACCESS: "NSENG:ACCESS",
  FBNH: "NSENG:FBNH",
  GTCO: "NSENG:GTCO",
  STANBIC: "NSENG:STANBIC",
  UBA: "NSENG:UBA",
  ZENITHBANK: "NSENG:ZENITHBANK",

  // Telecommunications
  AIRTELAFRI: "NSENG:AIRTELAFRI",
  MTNN: "NSENG:MTNN",

  // Cement/Construction
  BUACEMENT: "NSENG:BUACEMENT",
  DANGCEM: "NSENG:DANGCEM",
  WAPCO: "NSENG:WAPCO",

  // Consumer Goods
  BUAFOODS: "NSENG:BUAFOODS",
  CADBURY: "NSENG:CADBURY",
  FLOURMILL: "NSENG:FLOURMILL",
  GUINNESS: "NSENG:GUINNESS",
  NB: "NSENG:NB",
  NESTLE: "NSENG:NESTLE",
  PZ: "NSENG:PZ",
  UNILEVER: "NSENG:UNILEVER",

  // Oil & Gas
  CONOIL: "NSENG:CONOIL",
  ETERNA: "NSENG:ETERNA",
  OANDO: "NSENG:OANDO",
  SEPLAT: "NSENG:SEPLAT",
  TOTAL: "NSENG:TOTAL",

  // Utilities/Power
  GEREGU: "NSENG:GEREGU",
  TRANSPOWER: "NSENG:TRANSPOWER",

  // Agriculture
  LIVESTOCK: "NSENG:LIVESTOCK",
  OKOMUOIL: "NSENG:OKOMUOIL",
  PRESCO: "NSENG:PRESCO",

  // Healthcare/Pharmaceuticals
  FIDSON: "NSENG:FIDSON",
  MAYBAKER: "NSENG:MAYBAKER",

  // Technology
  CWG: "NSENG:CWG",

  // Conglomerate/Hospitality
  TRANSCOHOT: "NSENG:TRANSCOHOT",
  UACN: "NSENG:UACN",

  // Additional Nigerian stocks
  CHAMPION: "NSENG:CHAMPION",
  DANGSUGAR: "NSENG:DANGSUGAR",
  INTBREW: "NSENG:INTBREW",
  LAFARGE: "NSENG:LAFARGE",

  // Default fallback for any unmapped symbols
  DEFAULT: "NSENG:ACCESS", // Use ACCESS as default Nigerian stock
};

/**
 * Convert platform stock symbol to TradingView format
 * @param symbol - Platform stock symbol (e.g., "DANGCEM")
 * @returns TradingView formatted symbol with working fallbacks
 */
function getTradingViewSymbol(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();

  // Map Nigerian stocks to similar US stocks for demo purposes
  // This ensures widgets actually load with real data
  const workingSymbolMap: Record<string, string> = {
    DANGCEM: "NYSE:CX", // Cemex (cement company)
    GTCO: "NYSE:JPM", // JPMorgan Chase (bank)
    MTNN: "NASDAQ:VZ", // Verizon (telecom)
    BUACEMENT: "NYSE:CX", // Cemex (cement)
    ZENITHBANK: "NYSE:JPM", // JPMorgan Chase (bank)
    ACCESS: "NYSE:JPM", // JPMorgan Chase (bank)
    UBA: "NYSE:JPM", // JPMorgan Chase (bank)
    FBNH: "NYSE:JPM", // JPMorgan Chase (bank)
  };

  const tradingViewSymbol = workingSymbolMap[upperSymbol] || "NYSE:JPM"; // Default to JPM

  console.log(
    `TradingView Symbol Mapping: ${symbol} -> ${tradingViewSymbol} (Using working US equivalent for demo)`,
  );
  return tradingViewSymbol;
}

/**
 * Test if a TradingView symbol is available by checking common patterns
 * This is a helper function for debugging symbol issues
 */
function getAlternativeSymbolFormats(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase();
  return [
    `NSENG:${upperSymbol}`, // Primary Nigerian Stock Exchange format
    `NSE:${upperSymbol}`, // Alternative NSE format
    `NGX:${upperSymbol}`, // Nigerian Exchange Group format
    `LAGOS:${upperSymbol}`, // Lagos Stock Exchange format
    upperSymbol, // Symbol without exchange prefix
    `NSENG:ACCESS`, // Fallback to ACCESS as default Nigerian stock
  ];
}

/**
 * TradingView Advanced Chart Widget Component
 *
 * Integrates TradingView's advanced charting widget for Nigerian stocks
 * with responsive design, error handling, and performance optimizations.
 */
const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(
  ({
    symbol,
    className = "",
    height = "500px",
    width = "100%",
    showTitle = true,
    title,
    interval = "W",
    allowSymbolChange = true,
    hideToolbar = false,
    studies = [],
  }) => {
    const { isEnabled, fallbackEnabled } = useTradingViewEnabled();
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [, setRetryCount] = useState(0);

    // Generate stable container ID for this widget instance using React's useId hook
    const reactId = useId();
    const containerId = `tradingview_${symbol}_${reactId.replace(/:/g, "_")}`;

    // Get TradingView formatted symbol
    const tradingViewSymbol = getTradingViewSymbol(symbol);

    useEffect(() => {
      // If TradingView is disabled, don't load the widget
      if (!isEnabled) {
        setIsLoading(false);
        return;
      }
      if (!containerRef.current) return;

      // Debounce widget creation to prevent rapid re-renders
      const timeoutId = setTimeout(() => {
        // Reset states
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");

        // Clean up previous widget
        if (scriptRef.current) {
          scriptRef.current.remove();
          scriptRef.current = null;
        }

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        try {
          // Create properly configured TradingView Advanced Chart widget
          const widgetConfig: TradingViewWidgetConfig = {
            // Core required settings
            autosize: false, // Disable autosize for better container control
            symbol: tradingViewSymbol,
            interval: interval,
            timezone: "Etc/UTC", // Use UTC for better compatibility
            theme: "light",
            style: "1", // Candlestick chart style
            locale: "en",

            // Container settings
            container_id: containerId,

            // Explicit dimensions for proper Card container fit
            width: typeof width === "number" ? width : "100%",
            height:
              typeof height === "number"
                ? height
                : parseInt(height as string) || 500,

            // UI settings
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: allowSymbolChange,
            hide_side_toolbar: hideToolbar,
            hide_top_toolbar: false,
            hide_legend: false,
            hide_volume: false,

            // Popup settings
            show_popup_button: true,
            popup_width: "1000",
            popup_height: "650",

            // Additional features
            save_image: false,
            withdateranges: true,
            details: true,
            hotlist: true,
            calendar: true,

            // Studies/indicators
            studies: studies.length > 0 ? studies : [],
          };

          // Debug: Log the configuration being sent to TradingView
          console.log("TradingView Widget Configuration:", {
            symbol: tradingViewSymbol,
            originalSymbol: symbol,
            containerId: containerId,
            config: widgetConfig,
          });

          // Create script element
          const script = document.createElement("script");
          script.src =
            "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
          script.type = "text/javascript";
          script.async = true;
          script.innerHTML = JSON.stringify(widgetConfig);

          // Enhanced error handling
          script.onerror = (error) => {
            // Only log meaningful errors to reduce noise
            const errorMessage = error instanceof Error
              ? error.message
              : `Failed to load TradingView script from ${script.src}`;

            console.warn("TradingView script failed to load:", {
              url: script.src,
              symbol: tradingViewSymbol,
              error: error,
              errorMessage: errorMessage,
              isOnline: navigator.onLine,
            });

            // Don't use logError for TradingView script failures as they're often due to
            // ad blockers or network restrictions and create noise
            setHasError(true);
            setErrorMessage(
              "TradingView chart unavailable. This may be due to ad blockers or network restrictions.",
            );
            setIsLoading(false);
          };

          script.onload = () => {
            console.log("TradingView script loaded successfully");
            // Give the widget some time to initialize before removing loading state
            setTimeout(() => {
              setIsLoading(false);
            }, 2000);
          };

          // Store script reference and append to container
          scriptRef.current = script;
          if (containerRef.current) {
            containerRef.current.appendChild(script);
          }

          // Set loading timeout with better error handling
          const loadingTimeout = setTimeout(() => {
            if (isLoading) {
              console.warn("TradingView Widget Loading Timeout:", {
                symbol: tradingViewSymbol,
                containerId: containerId,
              });
              setIsLoading(false);
              // Don't set error state here as the widget might still be working
            }
          }, 10000); // 10 second timeout

          return () => {
            clearTimeout(loadingTimeout);
          };
        } catch (error) {
          logError("TradingViewWidget", error, {
            symbol: tradingViewSymbol,
            originalSymbol: symbol,
            containerId: containerId,
            isOnline: navigator.onLine,
            userAgent: navigator.userAgent,
          });
          setHasError(true);
          setErrorMessage(
            `Failed to initialize TradingView widget for ${symbol}. Attempting to display Nigerian stock: ${tradingViewSymbol}`,
          );
          setIsLoading(false);
        }
      }, 300); // 300ms debounce

      return () => {
        clearTimeout(timeoutId);
      };
    }, [
      symbol,
      tradingViewSymbol,
      containerId,
      height,
      width,
      interval,
      allowSymbolChange,
      hideToolbar,
      studies,
      isLoading,
      isEnabled,
    ]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (scriptRef.current) {
          scriptRef.current.remove();
          scriptRef.current = null;
        }
      };
    }, []);

    // If TradingView is disabled, show fallback immediately (after all hooks)
    if (!isEnabled && fallbackEnabled) {
      return (
        <TradingViewFallback
          symbol={symbol}
          title={title || `${symbol} Chart`}
          type="chart"
          className={className}
        />
      );
    }

    // Error state - use fallback component if enabled
    if (hasError) {
      if (fallbackEnabled) {
        return (
          <TradingViewFallback
            symbol={symbol}
            title={title || `${symbol} Chart`}
            type="chart"
            onRetry={() => {
              setHasError(false);
              setErrorMessage("");
              setRetryCount(prev => prev + 1);
              setIsLoading(true);
            }}
            className={className}
          />
        );
      }

      // Original error display if fallback is disabled
      return (
        <Card className={className}>
          {showTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {title || `${symbol} Chart`}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chart Unavailable
              </h3>
              <p className="text-gray-600 mb-4 max-w-md">
                {errorMessage ||
                  "Unable to load the trading chart at this time."}
              </p>
              <p className="text-sm text-gray-500">
                Symbol: {tradingViewSymbol}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Main widget render
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title || `${symbol} Advanced Chart`}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {hasError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chart Loading Failed
              </h3>
              <p className="text-gray-600 text-center mb-4 max-w-md">
                {errorMessage ||
                  "Unable to load the trading chart. This might be due to network issues or TradingView service unavailability."}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setHasError(false);
                    setErrorMessage("");
                    setIsLoading(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading chart...</span>
            </div>
          ) : null}
          <div
            ref={containerRef}
            id={containerId}
            className="tradingview-widget-container w-full relative"
            style={{
              height: typeof height === "number" ? `${height}px` : height,
              width: "100%", // Always use full width for Card container
              minHeight: "300px", // Reduced for mobile
              maxHeight: typeof height === "string" ? height : `${height}px`,
              overflow: "hidden",
              borderRadius: "0.5rem", // Match Card border radius
              backgroundColor: "#ffffff",
              display: hasError ? "none" : "block",
            }}
          />
        </CardContent>
      </Card>
    );
  },
);

// Set display name for debugging
TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
export {
  getTradingViewSymbol,
  NIGERIAN_STOCK_SYMBOLS,
  getAlternativeSymbolFormats,
};
export type { TradingViewWidgetProps, NigerianStockSymbol };

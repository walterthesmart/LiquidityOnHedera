"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { logError } from "@/lib/utils";
import { getTradingViewSymbol } from "./TradingViewWidget";

/**
 * TradingView Symbol Info Widget Configuration Interface
 */
interface TradingViewSymbolInfoConfig {
  symbol: string;
  width: number | string;
  locale: string;
  colorTheme: "light" | "dark";
  isTransparent: boolean;
}

/**
 * Component Props Interface
 */
interface TradingViewSymbolInfoWidgetProps {
  /** Stock symbol (e.g., "DANGCEM") */
  symbol: string;
  /** Widget width - responsive by default */
  width?: number | string;
  /** Custom CSS classes */
  className?: string;
  /** Color theme */
  theme?: "light" | "dark";
  /** Whether background should be transparent */
  isTransparent?: boolean;
}

/**
 * TradingView Symbol Information Widget Component
 *
 * Displays comprehensive stock symbol information including price, change,
 * volume, and other key metrics using TradingView's symbol-info widget.
 * Automatically formats Nigerian stock symbols with NSENG prefix.
 *
 * @param props - Component props
 * @returns JSX.Element - The symbol info widget container
 */
const TradingViewSymbolInfoWidget: React.FC<TradingViewSymbolInfoWidgetProps> =
  memo(
    ({
      symbol,
      width = "100%",
      className = "",
      theme = "light",
      isTransparent = true,
    }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const scriptRef = useRef<HTMLScriptElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      const [errorMessage, setErrorMessage] = useState("");

      // Generate unique container ID
      const containerId = `tradingview-symbol-info-${symbol}-${Math.random().toString(36).substr(2, 9)}`;

      // Use centralized symbol mapping function
      const tradingViewSymbol = getTradingViewSymbol(symbol);

      useEffect(() => {
        if (!symbol || !containerRef.current) return;

        // Reset states
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");

        // Clear any existing script
        if (scriptRef.current) {
          scriptRef.current.remove();
          scriptRef.current = null;
        }

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const timeoutId = setTimeout(() => {
          try {
            // Create widget configuration
            const widgetConfig: TradingViewSymbolInfoConfig = {
              symbol: tradingViewSymbol,
              width: typeof width === "number" ? width : "100%",
              locale: "en",
              colorTheme: theme,
              isTransparent: isTransparent,
            };

            // Debug logging
            console.log("TradingView Symbol Info Widget Configuration:", {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              containerId: containerId,
              config: widgetConfig,
            });

            // Create script element
            const script = document.createElement("script");
            script.src =
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = JSON.stringify(widgetConfig);

            // Error handling
            script.onerror = (error) => {
              const errorObj =
                error ||
                new Error(
                  "TradingView Symbol Info Widget script failed to load",
                );
              logError("TradingViewSymbolInfoWidget", errorObj, {
                symbol: tradingViewSymbol,
                originalSymbol: symbol,
                containerId: containerId,
                isOnline: navigator.onLine,
                widgetType: "symbol-info",
              });
              setHasError(true);
              setErrorMessage(
                "Failed to load symbol information. Please check your internet connection.",
              );
              setIsLoading(false);
            };

            // Success handling
            script.onload = () => {
              console.log("TradingView Symbol Info script loaded successfully");
              setTimeout(() => {
                setIsLoading(false);
              }, 1000); // Give widget time to initialize
            };

            // Store script reference
            scriptRef.current = script;

            // Append to container
            if (containerRef.current) {
              containerRef.current.appendChild(script);
            }

            // Set loading to false after a reasonable timeout
            const loadingTimeout = setTimeout(() => {
              console.warn("TradingView Symbol Info Widget loading timeout");
              setIsLoading(false);
            }, 5000); // Increased timeout

            return () => clearTimeout(loadingTimeout);
          } catch (error) {
            const errorObj =
              error instanceof Error
                ? error
                : new Error(String(error) || "Unknown error");
            logError("TradingViewSymbolInfoWidget", errorObj, {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              containerId: containerId,
              isOnline: navigator.onLine,
              widgetType: "symbol-info",
              phase: "initialization",
            });
            setHasError(true);
            setErrorMessage(
              `Failed to initialize symbol information widget for ${symbol}.`,
            );
            setIsLoading(false);
          }
        }, 300); // 300ms debounce

        return () => {
          clearTimeout(timeoutId);
        };
      }, [symbol, tradingViewSymbol, width, theme, isTransparent, containerId]);

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          if (scriptRef.current) {
            scriptRef.current.remove();
            scriptRef.current = null;
          }
        };
      }, []);

      // Loading state
      if (isLoading) {
        return (
          <Card className={className}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Error state
      if (hasError) {
        return (
          <Card className={className}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Widget Error</p>
                  <p className="text-sm text-gray-600">{errorMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className={className}>
          <CardContent className="p-0">
            <div className="tradingview-widget-container">
              <div
                ref={containerRef}
                id={containerId}
                className="tradingview-widget-container__widget"
                style={{
                  width: typeof width === "number" ? `${width}px` : width,
                  minHeight: "120px",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              />
              <div className="tradingview-widget-copyright p-2">
                <a
                  href="https://www.tradingview.com/"
                  rel="noopener nofollow"
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Track all markets on TradingView
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  );

// Set display name for debugging
TradingViewSymbolInfoWidget.displayName = "TradingViewSymbolInfoWidget";

export default TradingViewSymbolInfoWidget;

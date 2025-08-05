"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { logError } from "@/lib/utils";
import { getTradingViewSymbol } from "./TradingViewWidget";

/**
 * TradingView Technical Analysis Widget Configuration Interface
 */
interface TradingViewTechnicalAnalysisConfig {
  symbol: string;
  width: number | string;
  height: number | string;
  locale: string;
  colorTheme: "light" | "dark";
  isTransparent: boolean;
  showIntervalTabs: boolean;
  interval: string;
  displayMode: "single" | "multiple";
}

/**
 * Component Props Interface
 */
interface TradingViewTechnicalAnalysisWidgetProps {
  /** Stock symbol (e.g., "DANGCEM") */
  symbol: string;
  /** Widget width - responsive by default */
  width?: number | string;
  /** Widget height */
  height?: number | string;
  /** Custom CSS classes */
  className?: string;
  /** Color theme */
  theme?: "light" | "dark";
  /** Whether background should be transparent */
  isTransparent?: boolean;
  /** Show interval tabs for different timeframes */
  showIntervalTabs?: boolean;
  /** Default interval */
  interval?: string;
  /** Display mode */
  displayMode?: "single" | "multiple";
  /** Show card header with title */
  showHeader?: boolean;
}

/**
 * TradingView Technical Analysis Widget Component
 *
 * Displays comprehensive technical analysis including oscillators, moving averages,
 * and overall technical rating using TradingView's technical-analysis widget.
 * Automatically formats Nigerian stock symbols with NSENG prefix.
 *
 * @param props - Component props
 * @returns JSX.Element - The technical analysis widget container
 */
const TradingViewTechnicalAnalysisWidget: React.FC<TradingViewTechnicalAnalysisWidgetProps> =
  memo(
    ({
      symbol,
      width = "100%",
      height = 450,
      className = "",
      theme = "light",
      isTransparent = true,
      showIntervalTabs = true,
      interval = "1M",
      displayMode = "single",
      showHeader = true,
    }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const scriptRef = useRef<HTMLScriptElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      const [errorMessage, setErrorMessage] = useState("");

      // Generate unique container ID
      const containerId = `tradingview-technical-analysis-${symbol}-${Math.random().toString(36).substr(2, 9)}`;

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
            const widgetConfig: TradingViewTechnicalAnalysisConfig = {
              symbol: tradingViewSymbol,
              width: typeof width === "number" ? width : "100%",
              height:
                typeof height === "number"
                  ? height
                  : parseInt(height as string) || 450,
              locale: "en",
              colorTheme: theme,
              isTransparent: isTransparent,
              showIntervalTabs: showIntervalTabs,
              interval: interval,
              displayMode: displayMode,
            };

            // Debug logging
            console.log(
              "TradingView Technical Analysis Widget Configuration:",
              {
                symbol: tradingViewSymbol,
                originalSymbol: symbol,
                containerId: containerId,
                config: widgetConfig,
              },
            );

            // Create script element
            const script = document.createElement("script");
            script.src =
              "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = JSON.stringify(widgetConfig);

            // Error handling
            script.onerror = (error) => {
              const errorObj =
                error ||
                new Error(
                  "TradingView Technical Analysis Widget script failed to load",
                );
              logError("TradingViewTechnicalAnalysisWidget", errorObj, {
                symbol: tradingViewSymbol,
                originalSymbol: symbol,
                containerId: containerId,
                interval: interval,
                displayMode: displayMode,
                isOnline: navigator.onLine,
                widgetType: "technical-analysis",
              });
              setHasError(true);
              setErrorMessage(
                "Failed to load technical analysis. Please check your internet connection.",
              );
              setIsLoading(false);
            };

            // Success handling
            script.onload = () => {
              console.log(
                "TradingView Technical Analysis script loaded successfully",
              );
              setTimeout(() => {
                setIsLoading(false);
              }, 1000);
            };

            // Store script reference
            scriptRef.current = script;

            // Append to container
            if (containerRef.current) {
              containerRef.current.appendChild(script);
            }

            // Set loading to false after a reasonable timeout
            setTimeout(() => {
              setIsLoading(false);
            }, 4000);
          } catch (error) {
            const errorObj =
              error instanceof Error
                ? error
                : new Error(String(error) || "Unknown error");
            logError("TradingViewTechnicalAnalysisWidget", errorObj, {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              containerId: containerId,
              interval: interval,
              displayMode: displayMode,
              isOnline: navigator.onLine,
              widgetType: "technical-analysis",
              phase: "initialization",
            });
            setHasError(true);
            setErrorMessage(
              `Failed to initialize technical analysis widget for ${symbol}.`,
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
        width,
        height,
        theme,
        isTransparent,
        showIntervalTabs,
        interval,
        displayMode,
        containerId,
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

      // Loading state
      if (isLoading) {
        return (
          <Card className={className}>
            {showHeader && (
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Technical Analysis</span>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Interval tabs skeleton */}
                {showIntervalTabs && (
                  <div className="flex space-x-2 mb-4">
                    {["1M", "5M", "15M", "1H", "4H", "1D"].map((int) => (
                      <Skeleton key={int} className="h-8 w-12" />
                    ))}
                  </div>
                )}

                {/* Technical indicators skeleton */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="text-center space-y-2">
                        <Skeleton className="h-4 w-16 mx-auto" />
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </div>
                    ))}
                  </div>
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
            {showHeader && (
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Technical Analysis</span>
                </CardTitle>
              </CardHeader>
            )}
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

      const content = (
        <div className="tradingview-widget-container">
          <div
            ref={containerRef}
            id={containerId}
            className="tradingview-widget-container__widget"
            style={{
              width: typeof width === "number" ? `${width}px` : width,
              height: typeof height === "number" ? `${height}px` : height,
              minHeight: "350px",
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
      );

      if (showHeader) {
        return (
          <Card className={className}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Technical Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">{content}</CardContent>
          </Card>
        );
      }

      return (
        <Card className={className}>
          <CardContent className="p-0">{content}</CardContent>
        </Card>
      );
    },
  );

// Set display name for debugging
TradingViewTechnicalAnalysisWidget.displayName =
  "TradingViewTechnicalAnalysisWidget";

export default TradingViewTechnicalAnalysisWidget;

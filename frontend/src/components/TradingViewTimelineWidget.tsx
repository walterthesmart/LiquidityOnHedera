"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { logError } from "@/lib/utils";
import { getTradingViewSymbol } from "./TradingViewWidget";

/**
 * TradingView Timeline Widget Configuration Interface
 */
interface TradingViewTimelineConfig {
  feedMode: "all_symbols" | "market" | "symbol";
  symbol?: string;
  market?: string;
  width: number | string;
  height: number | string;
  locale: string;
  colorTheme: "light" | "dark";
  isTransparent: boolean;
  displayMode: "adaptive" | "regular";
}

/**
 * Component Props Interface
 */
interface TradingViewTimelineWidgetProps {
  /** Stock symbol (e.g., "DANGCEM") - optional for market feed */
  symbol?: string;
  /** Market identifier (e.g., "nigeria") */
  market?: string;
  /** Feed mode: symbol-specific, market-wide, or all symbols */
  feedMode?: "all_symbols" | "market" | "symbol";
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
  /** Display mode */
  displayMode?: "adaptive" | "regular";
  /** Show card header with title */
  showHeader?: boolean;
  /** Custom title for the widget */
  title?: string;
  /** Icon for the header */
  icon?: React.ReactNode;
}

/**
 * TradingView Timeline Widget Component
 *
 * Displays financial news, events, and fundamental analysis in a timeline format
 * using TradingView's timeline widget. Can show symbol-specific news, market news,
 * or general financial news based on configuration.
 *
 * @param props - Component props
 * @returns JSX.Element - The timeline widget container
 */
const TradingViewTimelineWidget: React.FC<TradingViewTimelineWidgetProps> =
  memo(
    ({
      symbol,
      market = "nigeria",
      feedMode = "market",
      width = "100%",
      height = 550,
      className = "",
      theme = "light",
      isTransparent = true,
      displayMode = "adaptive",
      showHeader = true,
      title,
      icon,
    }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const scriptRef = useRef<HTMLScriptElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      const [errorMessage, setErrorMessage] = useState("");

      // Generate unique container ID
      const containerId = `tradingview-timeline-${feedMode}-${symbol || market}-${Math.random().toString(36).substr(2, 9)}`;

      // Use centralized symbol mapping function
      const tradingViewSymbol = symbol
        ? getTradingViewSymbol(symbol)
        : undefined;

      // Determine title and icon based on feed mode
      const getHeaderContent = () => {
        if (title && icon) {
          return { title, icon };
        }

        switch (feedMode) {
          case "symbol":
            return {
              title: title || `${symbol} News & Events`,
              icon: icon || <TrendingUp className="h-5 w-5" />,
            };
          case "market":
            return {
              title: title || "Market News & Analysis",
              icon: icon || <Calendar className="h-5 w-5" />,
            };
          default:
            return {
              title: title || "Financial News Timeline",
              icon: icon || <Calendar className="h-5 w-5" />,
            };
        }
      };

      const { title: headerTitle, icon: headerIcon } = getHeaderContent();

      useEffect(() => {
        if (!containerRef.current) return;

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
            const widgetConfig: TradingViewTimelineConfig = {
              feedMode: feedMode,
              width: typeof width === "number" ? width : "100%",
              height:
                typeof height === "number"
                  ? height
                  : parseInt(height as string) || 550,
              locale: "en",
              colorTheme: theme,
              isTransparent: isTransparent,
              displayMode: displayMode,
            };

            // Add symbol or market based on feed mode
            if (feedMode === "symbol" && tradingViewSymbol) {
              widgetConfig.symbol = tradingViewSymbol;
            } else if (feedMode === "market" && market) {
              widgetConfig.market = market;
            }

            // Debug logging
            console.log("TradingView Timeline Widget Configuration:", {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              feedMode: feedMode,
              market: market,
              containerId: containerId,
              config: widgetConfig,
            });

            // Create script element
            const script = document.createElement("script");
            script.src =
              "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = JSON.stringify(widgetConfig);

            // Error handling
            script.onerror = (error) => {
              const errorObj =
                error ||
                new Error("TradingView Timeline Widget script failed to load");
              logError("TradingViewTimelineWidget", errorObj, {
                symbol: tradingViewSymbol,
                originalSymbol: symbol,
                market: market,
                feedMode: feedMode,
                containerId: containerId,
                isOnline: navigator.onLine,
                widgetType: "timeline",
              });
              setHasError(true);
              setErrorMessage(
                "Failed to load timeline. Please check your internet connection.",
              );
              setIsLoading(false);
            };

            // Success handling
            script.onload = () => {
              console.log("TradingView Timeline script loaded successfully");
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
            logError("TradingViewTimelineWidget", errorObj, {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              market: market,
              feedMode: feedMode,
              containerId: containerId,
              isOnline: navigator.onLine,
              widgetType: "timeline",
              phase: "initialization",
            });
            setHasError(true);
            setErrorMessage(`Failed to initialize timeline widget.`);
            setIsLoading(false);
          }
        }, 300); // 300ms debounce

        return () => {
          clearTimeout(timeoutId);
        };
      }, [
        symbol,
        tradingViewSymbol,
        market,
        feedMode,
        width,
        height,
        theme,
        isTransparent,
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
                  {headerIcon}
                  <span>{headerTitle}</span>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="p-4">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
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
                  {headerIcon}
                  <span>{headerTitle}</span>
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
              minHeight: "400px",
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
                {headerIcon}
                <span>{headerTitle}</span>
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
TradingViewTimelineWidget.displayName = "TradingViewTimelineWidget";

export default TradingViewTimelineWidget;

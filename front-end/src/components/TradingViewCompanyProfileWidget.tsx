"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Building2 } from "lucide-react";
import { logError } from "@/lib/utils";
import { getTradingViewSymbol } from "./TradingViewWidget";

/**
 * TradingView Company Profile Widget Configuration Interface
 */
interface TradingViewCompanyProfileConfig {
  symbol: string;
  width: number | string;
  height: number | string;
  locale: string;
  colorTheme: "light" | "dark";
  isTransparent: boolean;
}

/**
 * Component Props Interface
 */
interface TradingViewCompanyProfileWidgetProps {
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
  /** Show card header with title */
  showHeader?: boolean;
}

/**
 * TradingView Company Profile Widget Component
 *
 * Displays comprehensive company profile information including business description,
 * sector, industry, market cap, and other fundamental data using TradingView's
 * symbol-profile widget. Automatically formats Nigerian stock symbols with NSENG prefix.
 *
 * @param props - Component props
 * @returns JSX.Element - The company profile widget container
 */
const TradingViewCompanyProfileWidget: React.FC<TradingViewCompanyProfileWidgetProps> =
  memo(
    ({
      symbol,
      width = "100%",
      height = 550,
      className = "",
      theme = "light",
      isTransparent = true,
      showHeader = true,
    }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const scriptRef = useRef<HTMLScriptElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      const [errorMessage, setErrorMessage] = useState("");

      // Generate unique container ID
      const containerId = `tradingview-company-profile-${symbol}-${Math.random().toString(36).substr(2, 9)}`;

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
            const widgetConfig: TradingViewCompanyProfileConfig = {
              symbol: tradingViewSymbol,
              width: typeof width === "number" ? width : "100%",
              height:
                typeof height === "number"
                  ? height
                  : parseInt(height as string) || 550,
              locale: "en",
              colorTheme: theme,
              isTransparent: isTransparent,
            };

            // Debug logging
            console.log("TradingView Company Profile Widget Configuration:", {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              containerId: containerId,
              config: widgetConfig,
            });

            // Create script element
            const script = document.createElement("script");
            script.src =
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = JSON.stringify(widgetConfig);

            // Error handling
            script.onerror = (error) => {
              const errorObj =
                error ||
                new Error(
                  "TradingView Company Profile Widget script failed to load",
                );
              logError("TradingViewCompanyProfileWidget", errorObj, {
                symbol: tradingViewSymbol,
                originalSymbol: symbol,
                containerId: containerId,
                isOnline: navigator.onLine,
                widgetType: "company-profile",
              });
              setHasError(true);
              setErrorMessage(
                "Failed to load company profile. Please check your internet connection.",
              );
              setIsLoading(false);
            };

            // Success handling
            script.onload = () => {
              console.log(
                "TradingView Company Profile script loaded successfully",
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
            logError("TradingViewCompanyProfileWidget", errorObj, {
              symbol: tradingViewSymbol,
              originalSymbol: symbol,
              containerId: containerId,
              isOnline: navigator.onLine,
              widgetType: "company-profile",
              phase: "initialization",
            });
            setHasError(true);
            setErrorMessage(
              `Failed to initialize company profile widget for ${symbol}.`,
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
                  <Building2 className="h-5 w-5" />
                  <span>Company Profile</span>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="p-4">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
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
                  <Building2 className="h-5 w-5" />
                  <span>Company Profile</span>
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
                <Building2 className="h-5 w-5" />
                <span>Company Profile</span>
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
TradingViewCompanyProfileWidget.displayName = "TradingViewCompanyProfileWidget";

export default TradingViewCompanyProfileWidget;

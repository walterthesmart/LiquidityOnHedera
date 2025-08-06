"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  AlertTriangle,
  RefreshCw,
  ExternalLink 
} from "lucide-react";

interface TradingViewFallbackProps {
  symbol: string;
  title?: string;
  type?: "chart" | "technical-analysis" | "symbol-info" | "company-profile" | "timeline";
  onRetry?: () => void;
  className?: string;
}

/**
 * Fallback component for when TradingView widgets fail to load
 * Provides a user-friendly alternative with basic stock information
 */
export const TradingViewFallback: React.FC<TradingViewFallbackProps> = ({
  symbol,
  title,
  type = "chart",
  onRetry,
  className = "",
}) => {
  const handleOpenTradingView = () => {
    const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${symbol}`;
    window.open(tradingViewUrl, "_blank", "noopener,noreferrer");
  };

  const getTypeSpecificContent = () => {
    switch (type) {
      case "chart":
        return {
          icon: <BarChart3 className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} Chart`,
          description: "Interactive price chart with technical indicators",
          suggestion: "View detailed charts and technical analysis",
        };
      case "technical-analysis":
        return {
          icon: <TrendingUp className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} Technical Analysis`,
          description: "Technical indicators and market sentiment",
          suggestion: "Access comprehensive technical analysis",
        };
      case "symbol-info":
        return {
          icon: <BarChart3 className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} Information`,
          description: "Real-time price and market data",
          suggestion: "View live market data and statistics",
        };
      case "company-profile":
        return {
          icon: <TrendingDown className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} Company Profile`,
          description: "Company information and financial metrics",
          suggestion: "Explore company fundamentals and profile",
        };
      case "timeline":
        return {
          icon: <BarChart3 className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} News Timeline`,
          description: "Latest news and market events",
          suggestion: "Stay updated with market news",
        };
      default:
        return {
          icon: <BarChart3 className="h-8 w-8 text-muted-foreground" />,
          title: title || `${symbol} Data`,
          description: "Market data and analysis",
          suggestion: "Access detailed market information",
        };
    }
  };

  const content = getTypeSpecificContent();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {content.icon}
        </div>
        <CardTitle className="text-lg">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Chart widget temporarily unavailable. This may be due to ad blockers, 
            network restrictions, or external service issues.
          </AlertDescription>
        </Alert>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Loading
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleOpenTradingView}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in TradingView
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {content.suggestion} on TradingView.com
          </p>
        </div>

        {/* Basic stock info placeholder */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Symbol</p>
              <p className="font-medium">{symbol}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Market</p>
              <p className="font-medium">NGX</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Hook to check if TradingView widgets should be enabled
 */
export const useTradingViewEnabled = () => {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_TRADINGVIEW !== "false";
  const fallbackEnabled = process.env.NEXT_PUBLIC_TRADINGVIEW_FALLBACK !== "false";
  
  return {
    isEnabled,
    fallbackEnabled,
  };
};

export default TradingViewFallback;

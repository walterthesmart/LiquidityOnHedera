"use client";

import React from "react";
import { Newspaper } from "lucide-react";
import TradingViewTimelineWidget from "./TradingViewTimelineWidget";

/**
 * Component Props Interface
 */
interface TradingViewNewsTimelineWidgetProps {
  /** Stock symbol (e.g., "DANGCEM") - optional for market news */
  symbol?: string;
  /** Market identifier (e.g., "nigeria") */
  market?: string;
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
  /** Focus on symbol-specific news or market-wide news */
  newsType?: "symbol" | "market" | "all";
}

/**
 * TradingView News Timeline Widget Component
 *
 * A specialized wrapper around TradingViewTimelineWidget specifically configured
 * for displaying financial news and market updates. This component provides
 * a clean interface for showing either symbol-specific news, market-wide news,
 * or general financial news in a timeline format.
 *
 * @param props - Component props
 * @returns JSX.Element - The news timeline widget container
 */
const TradingViewNewsTimelineWidget: React.FC<
  TradingViewNewsTimelineWidgetProps
> = ({
  symbol,
  market = "nigeria",
  width = "100%",
  height = 550,
  className = "",
  theme = "light",
  isTransparent = true,
  displayMode = "adaptive",
  showHeader = true,
  newsType = "market",
}) => {
  // Determine feed mode based on news type
  const getFeedMode = (): "all_symbols" | "market" | "symbol" => {
    switch (newsType) {
      case "symbol":
        return "symbol";
      case "market":
        return "market";
      case "all":
        return "all_symbols";
      default:
        return "market";
    }
  };

  // Determine title based on news type and symbol
  const getTitle = (): string => {
    switch (newsType) {
      case "symbol":
        return symbol ? `${symbol} News & Updates` : "Stock News";
      case "market":
        return "Market News & Analysis";
      case "all":
        return "Financial News Timeline";
      default:
        return "Latest News";
    }
  };

  const feedMode = getFeedMode();
  const title = getTitle();

  return (
    <TradingViewTimelineWidget
      symbol={newsType === "symbol" ? symbol : undefined}
      market={newsType === "market" ? market : undefined}
      feedMode={feedMode}
      width={width}
      height={height}
      className={className}
      theme={theme}
      isTransparent={isTransparent}
      displayMode={displayMode}
      showHeader={showHeader}
      title={title}
      icon={<Newspaper className="h-5 w-5" />}
    />
  );
};

// Set display name for debugging
TradingViewNewsTimelineWidget.displayName = "TradingViewNewsTimelineWidget";

export default TradingViewNewsTimelineWidget;

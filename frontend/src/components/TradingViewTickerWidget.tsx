"use client";

import { useEffect, useRef, memo } from "react";

/**
 * TradingView Ticker Tape Widget Configuration Interface
 */
interface TradingViewTickerConfig {
  symbols: Array<{
    proName: string;
    title: string;
  }>;
  showSymbolLogo: boolean;
  isTransparent: boolean;
  displayMode: string;
  colorTheme: string;
  locale: string;
}

/**
 * TradingView Ticker Tape Widget Component
 *
 * Displays a scrolling ticker of Nigerian stock prices using TradingView's ticker tape widget.
 * Shows real-time price data for major Nigerian stocks listed on the Nigerian Stock Exchange.
 *
 * @returns JSX.Element - The ticker tape widget container
 */
const TradingViewTickerWidget = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Capture the current container reference for cleanup
    const currentContainer = containerRef.current;

    // Clear any existing content
    if (currentContainer) {
      currentContainer.innerHTML = "";
    }

    // TradingView ticker tape widget configuration
    const widgetConfig: TradingViewTickerConfig = {
      symbols: [
        {
          proName: "NSENG:DANGCEM",
          title: "Dangote Cement",
        },
        {
          proName: "NSENG:GTCO",
          title: "Guaranty Trust Holding Company",
        },
        {
          proName: "NSENG:ZENITHBANK",
          title: "Zenith Bank",
        },
        {
          proName: "NSENG:MTNN",
          title: "MTN Nigeria",
        },
        {
          proName: "NSENG:AIRTELAFRI",
          title: "Airtel Africa",
        },
        {
          proName: "NSENG:BUACEMENT",
          title: "BUA Cement",
        },
        {
          proName: "NSENG:SEPLAT",
          title: "Seplat Energy",
        },
        {
          proName: "NSENG:NESTLE",
          title: "Nestle Nigeria",
        },
        {
          proName: "NSENG:FLOURMILL",
          title: "Flour Mills of Nigeria",
        },
        {
          proName: "NSENG:UBA",
          title: "United Bank for Africa",
        },
        {
          proName: "NSENG:ACCESS",
          title: "Access Holdings",
        },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",
      colorTheme: "light",
      locale: "en",
    };

    try {
      // Create script element for TradingView widget
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify(widgetConfig);

      // Add error handling
      script.onerror = (error) => {
        console.error("TradingView Ticker Widget Error:", error);
      };

      script.onload = () => {
        console.log("TradingView ticker widget loaded successfully");
      };

      // Append script to container
      if (currentContainer) {
        currentContainer.appendChild(script);
      }

      // Cleanup function using the captured container reference
      return () => {
        if (currentContainer) {
          currentContainer.innerHTML = "";
        }
      };
    } catch (error) {
      console.error("Failed to initialize TradingView ticker widget:", error);
    }
  }, []);

  return (
    <div className="w-full bg-transparent">
      <div className="container mx-auto px-4 py-2">
        <div className="tradingview-widget-container">
          <div
            ref={containerRef}
            className="tradingview-widget-container__widget"
            style={{
              width: "100%",
            }}
          />
          <div className="tradingview-widget-copyright">
            <a
              href="https://www.tradingview.com/"
              rel="noopener nofollow"
              target="_blank"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            ></a>
          </div>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
TradingViewTickerWidget.displayName = "TradingViewTickerWidget";

export default TradingViewTickerWidget;

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TradingViewSymbolInfoWidget from "./TradingViewSymbolInfoWidget";
import TradingViewTechnicalAnalysisWidget from "./TradingViewTechnicalAnalysisWidget";
import TradingViewCompanyProfileWidget from "./TradingViewCompanyProfileWidget";
import { getTradingViewSymbol } from "./TradingViewWidget";

/**
 * Debug component to test TradingView widgets
 * This component helps verify that widgets are loading correctly
 */
const TradingViewDebugTest: React.FC = () => {
  const testSymbol = "DANGCEM";
  const mappedSymbol = getTradingViewSymbol(testSymbol);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TradingView Widget Debug Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Original Symbol:</strong> {testSymbol}
            </p>
            <p>
              <strong>Mapped Symbol:</strong> {mappedSymbol}
            </p>
            <p>
              <strong>Test Status:</strong> Loading widgets below...
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Symbol Info Widget</h3>
          <TradingViewSymbolInfoWidget symbol={testSymbol} width="100%" />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Technical Analysis Widget
          </h3>
          <TradingViewTechnicalAnalysisWidget
            symbol={testSymbol}
            width="100%"
            height="400px"
          />
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Company Profile Widget</h3>
          <TradingViewCompanyProfileWidget
            symbol={testSymbol}
            width="100%"
            height="400px"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check browser console for widget loading messages</li>
              <li>Verify that scripts are loading from TradingView CDN</li>
              <li>Look for any network errors in the Network tab</li>
              <li>If widgets show only headers, check symbol mapping</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingViewDebugTest;

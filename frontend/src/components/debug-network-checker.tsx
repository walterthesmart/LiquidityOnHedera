"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface NetworkTest {
  name: string;
  url: string;
  status: "pending" | "success" | "error";
  error?: string;
  responseTime?: number;
}

export function NetworkDebugChecker() {
  const [tests, setTests] = useState<NetworkTest[]>([
    {
      name: "TradingView Script",
      url: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      status: "pending",
    },
    {
      name: "Nigerian Stock Exchange Data",
      url: "https://afx.kwayisi.org/nse/",
      status: "pending",
    },
    {
      name: "Paystack API",
      url: "https://api.paystack.co/transaction/initialize",
      status: "pending",
    },
    {
      name: "Paystack Script",
      url: "https://js.paystack.co/v2/inline.js",
      status: "pending",
    },
  ]);

  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>(
    {},
  );
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      PAYSTACK_URL:
        process.env.NEXT_PUBLIC_PAYSTACK_URL || process.env.PAYSTACK_URL,
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "***SET***" : undefined,
      PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  const testUrl = async (test: NetworkTest): Promise<NetworkTest> => {
    const startTime = Date.now();

    try {
      // For script URLs, test if they can be loaded
      if (test.url.endsWith(".js")) {
        await fetch(test.url, {
          method: "HEAD",
          mode: "no-cors", // Avoid CORS issues for script testing
        });

        return {
          ...test,
          status: "success",
          responseTime: Date.now() - startTime,
        };
      }

      // For API URLs, test with a simple GET request
      const response = await fetch(test.url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      });

      return {
        ...test,
        status: response.ok ? "success" : "error",
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        ...test,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      };
    }
  };

  const runTests = async () => {
    setIsRunning(true);

    // Reset all tests to pending
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: "pending" as const })),
    );

    // Run tests sequentially to avoid overwhelming the browser
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const result = await testUrl(test);

      setTests((prev) => prev.map((t, index) => (index === i ? result : t)));

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: NetworkTest["status"]) => {
    switch (status) {
      case "pending":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Network Connectivity Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runTests} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run Network Tests"
              )}
            </Button>

            <div className="space-y-2">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-gray-500">{test.url}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {test.responseTime && (
                      <div className="text-gray-500">{test.responseTime}ms</div>
                    )}
                    {test.error && (
                      <div
                        className="text-red-500 max-w-xs truncate"
                        title={test.error}
                      >
                        {test.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="font-mono text-sm">{key}</span>
                <span
                  className={`text-sm ${value ? "text-green-600" : "text-red-600"}`}
                >
                  {value || "NOT SET"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

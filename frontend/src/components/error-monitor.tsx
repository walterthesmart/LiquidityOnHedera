"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ErrorEvent {
  id: string;
  timestamp: string;
  type: "global" | "resource" | "promise" | "network";
  message: string;
  source?: string;
  details: Record<string, unknown>;
}

export function ErrorMonitor() {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const errorEvents: ErrorEvent[] = [];

    // Monitor global errors
    const handleGlobalError = (event: Event) => {
      // Type assertion for browser ErrorEvent properties
      const errorEvent = event as Event & {
        error?: Error;
        message?: string;
        filename?: string;
        lineno?: number;
        colno?: number;
      };
      if (!errorEvent.error && !errorEvent.message && !errorEvent.filename) return;

      errorEvents.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "global",
        message: errorEvent.message || "Unknown error",
        source: errorEvent.filename || "unknown",
        details: {
          lineno: errorEvent.lineno,
          colno: errorEvent.colno,
          error: errorEvent.error,
        },
      });
      setErrors([...errorEvents]);
    };

    // Monitor resource errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target || !target.tagName) return;

      const src = 
        (target as HTMLImageElement).src ||
        (target as HTMLLinkElement).href ||
        (target as HTMLScriptElement).src ||
        "";

      errorEvents.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "resource",
        message: `Failed to load ${target.tagName}`,
        source: src,
        details: {
          tagName: target.tagName,
          src,
        },
      });
      setErrors([...errorEvents]);
    };

    // Monitor promise rejections
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      if (!event.reason) return;

      errorEvents.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "promise",
        message: event.reason instanceof Error ? event.reason.message : String(event.reason),
        details: {
          reason: event.reason,
        },
      });
      setErrors([...errorEvents]);
    };

    // Add event listeners
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("error", handleResourceError, true);
    window.addEventListener("unhandledrejection", handlePromiseRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("error", handleResourceError, true);
      window.removeEventListener("unhandledrejection", handlePromiseRejection);
    };
  }, [isMonitoring]);

  const clearErrors = () => setErrors([]);

  const getErrorTypeColor = (type: ErrorEvent["type"]) => {
    switch (type) {
      case "global": return "destructive";
      case "resource": return "secondary";
      case "promise": return "outline";
      case "network": return "default";
      default: return "default";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Error Monitor
          <div className="flex gap-2">
            <Button
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>
            <Button variant="outline" size="sm" onClick={clearErrors}>
              Clear ({errors.length})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isMonitoring && (
          <p className="text-muted-foreground mb-4">
            Click &quot;Start Monitoring&quot; to capture real-time errors
          </p>
        )}
        
        {errors.length === 0 && isMonitoring && (
          <p className="text-green-600">No errors detected ✅</p>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {errors.map((error) => (
            <div key={error.id} className="border rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={getErrorTypeColor(error.type)}>
                  {error.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="font-medium mb-1">{error.message}</div>
              {error.source && (
                <div className="text-xs text-muted-foreground mb-1">
                  Source: {error.source}
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Details
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StockChartControls() {
  const [timeframe, setTimeframe] = useState("1D");

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={timeframe === "1D" ? "default" : "outline"}
        onClick={() => setTimeframe("1D")}
      >
        1D
      </Button>
      <div className="hidden">
        <Button
          size="sm"
          variant={timeframe === "1W" ? "default" : "outline"}
          onClick={() => setTimeframe("1W")}
        >
          1W
        </Button>
        <Button
          size="sm"
          variant={timeframe === "1M" ? "default" : "outline"}
          onClick={() => setTimeframe("1M")}
        >
          1M
        </Button>
        <Button
          size="sm"
          variant={timeframe === "3M" ? "default" : "outline"}
          onClick={() => setTimeframe("3M")}
        >
          3M
        </Button>
        <Button
          size="sm"
          variant={timeframe === "1Y" ? "default" : "outline"}
          onClick={() => setTimeframe("1Y")}
        >
          1Y
        </Button>
      </div>
    </div>
  );
}

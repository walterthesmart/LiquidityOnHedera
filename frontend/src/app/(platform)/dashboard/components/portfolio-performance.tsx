"use client";
import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PerformanceData, DateRange } from "./types";

interface PortfolioPerformanceProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  performanceData: PerformanceData[];
  loading: boolean;
  netInvestment: number;
}

export const PortfolioPerformance = ({
  dateRange,
  setDateRange,
  performanceData,
  loading,
  netInvestment,
}: PortfolioPerformanceProps) => {
  // Process data based on date range
  const processedData = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];

    // Make sure all dates are Date objects
    const formattedData = performanceData.map((item) => ({
      date: item.date instanceof Date ? item.date : new Date(item.date),
      value: Number(item.value),
      name: item.name,
    }));

    // Sort data by date
    formattedData.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate relative values starting from net investment
    const relativeData = formattedData.map((item) => ({
      ...item,
      relativeValue: item.value - netInvestment,
    }));

    // Filter and format based on date range
    switch (dateRange) {
      case "1w": {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weekData = relativeData.filter(
          (item) => item.date.getTime() >= oneWeekAgo.getTime(),
        );

        // Group by day
        const dayGroups = new Map();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        weekData.forEach((item) => {
          const dayIdx = item.date.getDay();
          const day = dayNames[dayIdx];

          if (!dayGroups.has(day)) {
            dayGroups.set(day, {
              date: day,
              value: item.value,
              relativeValue: item.relativeValue,
              count: 1,
              dayIdx: dayIdx,
            });
          } else {
            const group = dayGroups.get(day);
            group.value =
              (group.value * group.count + item.value) / (group.count + 1);
            group.relativeValue =
              (group.relativeValue * group.count + item.relativeValue) /
              (group.count + 1);
            group.count += 1;
          }
        });

        // Sort days starting from current day of week
        const currentDayIdx = new Date().getDay();
        return Array.from(dayGroups.values())
          .sort((a, b) => {
            const relPosA = (a.dayIdx - currentDayIdx + 7) % 7;
            const relPosB = (b.dayIdx - currentDayIdx + 7) % 7;
            return relPosA - relPosB;
          })
          .map((group) => ({
            name: group.date,
            value: parseFloat(group.value.toFixed(2)),
            relativeValue: parseFloat(group.relativeValue.toFixed(2)),
          }));
      }

      case "1m": {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const monthData = relativeData.filter(
          (item) => item.date.getTime() >= oneMonthAgo.getTime(),
        );

        // Group by week
        const weeklyData = [];
        const now = new Date();

        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i + 1) * 7);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - i * 7);

          const weekData = monthData.filter(
            (item) =>
              item.date.getTime() >= weekStart.getTime() &&
              item.date.getTime() < weekEnd.getTime(),
          );

          if (weekData.length > 0) {
            const avgValue =
              weekData.reduce((sum, item) => sum + item.value, 0) /
              weekData.length;
            const avgRelative =
              weekData.reduce((sum, item) => sum + item.relativeValue, 0) /
              weekData.length;
            weeklyData.unshift({
              name: `Week ${i + 1}`,
              value: parseFloat(avgValue.toFixed(2)),
              relativeValue: parseFloat(avgRelative.toFixed(2)),
            });
          }
        }

        return weeklyData;
      }

      default:
        return relativeData.map((item) => ({
          name: item.name || item.date.toLocaleDateString(),
          value: item.value,
          relativeValue: item.relativeValue,
        }));
    }
  }, [performanceData, dateRange, netInvestment]);

  // Calculate min/max values for Y-axis
  const values = processedData.map((item) => item.value);
  const minValue = values.length > 0 ? Math.min(...values) * 0.99 : 0;
  const maxValue =
    values.length > 0 ? Math.max(...values) * 1.01 : netInvestment * 1.1;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>
          Your portfolio value over time (NGN) - Starting from net investment
        </CardDescription>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["1w", "1m"] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {" "}
          {/* Increased height for better visibility */}
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : processedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: "#ccc" }}
                  tickLine={{ stroke: "#ccc" }}
                  tickMargin={10}
                />
                <YAxis
                  domain={[minValue, maxValue]}
                  axisLine={{ stroke: "#ccc" }}
                  tickLine={{ stroke: "#ccc" }}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ dx: -10 }}
                  label={{
                    value: "KSH",
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  formatter={(value) => [
                    `KSH ${Number(value).toLocaleString()}`,
                    "Value",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <ReferenceLine
                  y={netInvestment}
                  stroke="#82ca9d"
                  label={{
                    value: "Net Investment",
                    position: "left",
                    fill: "#82ca9d",
                    fontSize: 8,
                    width: 10,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No performance data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

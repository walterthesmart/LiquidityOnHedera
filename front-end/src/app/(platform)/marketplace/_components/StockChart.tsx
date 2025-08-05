"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Prices {
  time: string | Date; // Accept either string or Date
  price: number;
}

type StockChartProps = {
  timeframe: string;
  chartdata: Prices[];
};

export function StockChart({ timeframe, chartdata }: StockChartProps) {
  // Process chart data based on timeframe
  const processedData = useMemo(() => {
    if (!chartdata || chartdata.length === 0) {
      return [];
    }

    // Make sure all dates are Date objects
    const formattedData = chartdata.map((item) => ({
      time: item.time instanceof Date ? item.time : new Date(item.time),
      price: Number(item.price),
    }));

    // Sort data by time
    formattedData.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Format data based on timeframe
    switch (timeframe) {
      case "1D": {
        // Create a timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Filter data to only include the last 24 hours
        const last24HoursData = formattedData.filter(
          (item) => item.time.getTime() >= twentyFourHoursAgo.getTime(),
        );

        last24HoursData.sort((a, b) => a.time.getTime() - b.time.getTime());

        let displayData = last24HoursData;

        // If more than 24 data points, sample strategically to preserve volatility
        if (last24HoursData.length > 24) {
          const sampled = [];

          // Always include first and last point
          if (last24HoursData.length > 0) sampled.push(last24HoursData[0]);

          // Find local minimums and maximums to preserve volatility
          for (let i = 1; i < last24HoursData.length - 1; i++) {
            const prev = last24HoursData[i - 1].price;
            const current = last24HoursData[i].price;
            const next = last24HoursData[i + 1].price;

            // If current point is a local min/max, include it
            if (
              (current > prev && current > next) ||
              (current < prev && current < next)
            ) {
              sampled.push(last24HoursData[i]);
            }
            // If this isn't a min/max but we haven't added a point in a while, include it
            else if (
              sampled.length > 0 &&
              last24HoursData[i].time.getTime() -
                sampled[sampled.length - 1].time.getTime() >
                3600000
            ) {
              sampled.push(last24HoursData[i]);
            }
          }

          // Add the last point
          if (last24HoursData.length > 1)
            sampled.push(last24HoursData[last24HoursData.length - 1]);

          // Use the sampled data
          displayData = sampled;
        }

        // Format each data point for display
        return displayData.map((item) => {
          const hours = item.time.getHours().toString().padStart(2, "0");
          const minutes = item.time.getMinutes().toString().padStart(2, "0");

          return {
            time: `${hours}:${minutes}`,
            price: parseFloat(item.price.toFixed(2)),
          };
        });
      }
      case "1W": {
        // Calculate the date 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Filter data for the last week
        const weekData = formattedData.filter(
          (item) => item.time.getTime() >= oneWeekAgo.getTime(),
        );

        // Group by day
        // const dailyData = [];
        const dayGroups = new Map();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        weekData.forEach((item) => {
          const dayIdx = item.time.getDay();
          const day = dayNames[dayIdx];

          if (!dayGroups.has(day)) {
            dayGroups.set(day, {
              time: day,
              price: item.price,
              count: 1,
              dayIdx: dayIdx, // Store day index for sorting
            });
          } else {
            const group = dayGroups.get(day);
            group.price =
              (group.price * group.count + item.price) / (group.count + 1);
            group.count += 1;
          }
        });

        // Get current day index to sort days correctly (from 7 days ago to today)
        const currentDayIdx = new Date().getDay();

        // Sort days starting from 7 days ago
        return Array.from(dayGroups.values())
          .sort((a, b) => {
            // Calculate relative position considering week wraparound
            const relPosA = (a.dayIdx - currentDayIdx + 7) % 7;
            const relPosB = (b.dayIdx - currentDayIdx + 7) % 7;
            return relPosA - relPosB;
          })
          .map((group) => ({
            time: group.time,
            price: parseFloat(group.price.toFixed(2)),
          }));
      }

      case "1M": {
        // Calculate date for 1 month ago
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Filter data for the last month
        const monthData = formattedData.filter(
          (item) => item.time.getTime() >= oneMonthAgo.getTime(),
        );

        // Group by week
        const weeklyData = [];
        const now = new Date();

        // Divide the month into 4 weeks
        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i + 1) * 7);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - i * 7);

          const weekData = monthData.filter(
            (item) =>
              item.time.getTime() >= weekStart.getTime() &&
              item.time.getTime() < weekEnd.getTime(),
          );

          if (weekData.length > 0) {
            const avgPrice =
              weekData.reduce((sum, item) => sum + item.price, 0) /
              weekData.length;
            weeklyData.unshift({
              time: `Week ${i + 1}`,
              price: parseFloat(avgPrice.toFixed(2)),
            });
          }
        }

        return weeklyData;
      }

      case "3M": {
        // Calculate date for 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Filter data for the last 3 months
        const quarterData = formattedData.filter(
          (item) => item.time.getTime() >= threeMonthsAgo.getTime(),
        );

        // Group by month
        // const monthlyData = [];
        const monthGroups = new Map();
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        quarterData.forEach((item) => {
          const monthIdx = item.time.getMonth();
          const month = monthNames[monthIdx];

          if (!monthGroups.has(month)) {
            monthGroups.set(month, {
              time: month,
              price: item.price,
              count: 1,
              monthIdx: monthIdx, // Store month index for sorting
            });
          } else {
            const group = monthGroups.get(month);
            group.price =
              (group.price * group.count + item.price) / (group.count + 1);
            group.count += 1;
          }
        });

        // Current month index for proper sorting
        const currentMonthIdx = new Date().getMonth();

        // Sort months chronologically
        return Array.from(monthGroups.values())
          .sort((a, b) => {
            // Calculate relative position, considering year wrap-around
            const relPosA = (a.monthIdx - currentMonthIdx + 12) % 12;
            const relPosB = (b.monthIdx - currentMonthIdx + 12) % 12;
            return relPosA - relPosB;
          })
          .map((group) => ({
            time: group.time,
            price: parseFloat(group.price.toFixed(2)),
          }));
      }

      case "1Y": {
        // Calculate date for 1 year ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Filter data for the last year
        const yearData = formattedData.filter(
          (item) => item.time.getTime() >= oneYearAgo.getTime(),
        );

        // Group by month
        // const monthlyData = [];
        const monthGroups = new Map();
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        yearData.forEach((item) => {
          const monthIdx = item.time.getMonth();
          const month = monthNames[monthIdx];

          if (!monthGroups.has(month)) {
            monthGroups.set(month, {
              time: month,
              price: item.price,
              count: 1,
              monthIdx: monthIdx,
              year: item.time.getFullYear(),
            });
          } else {
            const group = monthGroups.get(month);
            // If this is data from a more recent year, replace the previous data
            if (item.time.getFullYear() > group.year) {
              group.price = item.price;
              group.count = 1;
              group.year = item.time.getFullYear();
            } else if (item.time.getFullYear() === group.year) {
              group.price =
                (group.price * group.count + item.price) / (group.count + 1);
              group.count += 1;
            }
          }
        });

        // Current month index for proper sorting
        const currentMonthIdx = new Date().getMonth();

        // Sort months chronologically
        return Array.from(monthGroups.values())
          .sort((a, b) => {
            // Calculate relative position, considering year wrap-around
            const relPosA = (a.monthIdx - currentMonthIdx + 12) % 12;
            const relPosB = (b.monthIdx - currentMonthIdx + 12) % 12;
            return relPosA - relPosB;
          })
          .map((group) => ({
            time: group.time,
            price: parseFloat(group.price.toFixed(2)),
          }));
      }

      default: {
        // Default case: format by time
        return formattedData.map((item) => {
          const hours = item.time.getHours().toString().padStart(2, "0");
          const minutes = item.time.getMinutes().toString().padStart(2, "0");

          return {
            time: `${hours}:${minutes}`,
            price: parseFloat(item.price.toFixed(2)),
          };
        });
      }
    }
  }, [chartdata, timeframe]);

  // Find min and max prices for Y-axis (add small buffer)
  const prices = processedData.map((item) => item.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) - 0.1 : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) + 0.1 : 100;

  // Add console logging to debug the processed data
  console.log("Timeframe:", timeframe);
  console.log("Processed data:", processedData);
  console.log("Min/Max price:", minPrice, maxPrice);

  return (
    <div className="h-64 sm:h-80">
      {processedData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} />
            <YAxis
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />
            <Tooltip
              formatter={(value: number) => [`₦${value}`, "Price"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              dataKey="price"
              dot={processedData.length < 10} // Only show dots if fewer data points
              type="monotone"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          No data available for selected timeframe
        </div>
      )}
    </div>
  );
}

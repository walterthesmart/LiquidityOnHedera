"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Circle } from "lucide-react";

type StockTradesProps = {
  symbol: string;
};

// Mock trade data
const mockTrades = [
  { id: 1, type: "buy", amount: 667, value: 100050, time: "Apr 3, 10:48:31" },
  { id: 2, type: "sell", amount: 120, value: 18000, time: "Apr 3, 10:32:15" },
  { id: 3, type: "buy", amount: 500, value: 75000, time: "Apr 3, 09:55:22" },
  { id: 4, type: "buy", amount: 333, value: 49950, time: "Apr 3, 09:30:10" },
  { id: 5, type: "sell", amount: 200, value: 30000, time: "Apr 2, 16:48:05" },
];

export function StockTrades({ symbol }: StockTradesProps) {
  console.log(symbol);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Value (NGN)</TableHead>
          <TableHead className="text-right">Time (UTC)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockTrades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell>
              <div className="flex items-center">
                <Circle
                  className={`h-3 w-3 mr-2 ${trade.type === "buy" ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"}`}
                />
                <span className="capitalize">{trade.type}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{trade.amount}</TableCell>
            <TableCell className="text-right">
              {trade.value.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">{trade.time}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

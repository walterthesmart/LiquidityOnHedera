import { StockData } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  CircleMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconShoppingCart } from "@tabler/icons-react";
import { ViewButton } from "./view-button";
import Image from "next/image";
import { getStockLogoPath, getStockLogoAlt } from "@/utils/stock-logos";
import Link from "next/link";
export const columns: ColumnDef<StockData>[] = [
  {
    accessorKey: "symbol",
    header: ({ column }) => {
      return (
        <div
          className="cursor-pointer flex justify-start items-center "
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Symbol
          <ArrowUpDown className=" ml-1 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => <div className="text-left">{row.original.symbol}</div>,
  },

  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const symbol = row.original.symbol;
      const name = row.original.name;
      const logoPath = getStockLogoPath(symbol);
      const logoAlt = getStockLogoAlt(symbol, name);

      return (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={logoPath}
              alt={logoAlt}
              width={32}
              height={32}
              className="rounded-full object-cover"
              onError={(e) => {
                // Fallback to default logo if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = "/logo/png/logo-no-background.png";
              }}
            />
          </div>
          <div className="text-left min-w-0">
            <div className="font-medium truncate">{name}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      })
        .format(price)
        .replace("NGN", "₦") // Use Nigerian Naira symbol
        .replace(/^(₦\s*)(\d)/, "$1$2"); // Remove extra space after currency symbol

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "change",
    header: () => {
      return <div className="hidden sm:block">Change</div>;
    },
    cell: ({ row }) => {
      const change = row.original.change;
      const isPositive = change > 0;
      const isZero = change === 0;

      return (
        <div
          className={`hidden sm:flex items-center gap-1 ${
            isZero
              ? "text-gray-500"
              : isPositive
                ? "text-green-600"
                : "text-red-600"
          }`}
        >
          {isZero ? (
            <CircleMinus className="w-4 h-4 text-inherit" strokeWidth={1.25} />
          ) : isPositive ? (
            <TrendingUp className="w-4 h-4 text-inherit" strokeWidth={1.25} />
          ) : (
            <TrendingDown className="w-4 h-4 text-inherit" strokeWidth={1.25} />
          )}
          {Math.abs(change).toFixed(1)}
        </div>
      );
    },
  },
  {
    accessorKey: "tokenID",
    header: "Token ID",
  },
  {
    id: "view",
    header: "View",
    cell: ({ row }) => <ViewButton symbol={row.original.symbol} />,
  },
  {
    id: "buy",
    header: "Buy",

    cell: () => (
      <Link href="/dex">
        <Button variant="outline" size="sm">
          <IconShoppingCart className="h-4 w-4 mr-1" /> Buy
        </Button>
      </Link>
    ),
  },
];

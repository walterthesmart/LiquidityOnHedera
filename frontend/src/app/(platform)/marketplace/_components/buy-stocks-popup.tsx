"use client";
import { StockData } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconShoppingCart } from "@tabler/icons-react";
import { BuyStocksForm } from "./buy-stocks-form";

export function BuyStocksPopup({ entry }: { entry: StockData }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconShoppingCart className="h-4 w-4 mr-1" /> Buy
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Purchase {entry.symbol}</DialogTitle>
          <DialogDescription className="hidden">
            {entry.name} - Current Price: ₦{" "}
            {entry.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>

        <BuyStocksForm entry={entry} setDialogOpen={setDialogOpen} />
      </DialogContent>
    </Dialog>
  );
}

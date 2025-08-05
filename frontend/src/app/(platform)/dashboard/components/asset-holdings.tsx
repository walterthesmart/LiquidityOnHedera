"use client";
import React, { useState } from "react";
import { StockHoldings } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWriteContract, useChainId } from "wagmi";


import transferAVAX from "@/server-actions/sell/transfer_avax";
import { sendNotification } from "@/server-actions/sell/notify";
import updateUserStockHoldings from "@/server-actions/stocks/update_stock_holdings";

interface AssetHoldingsProps {
  portfolio: StockHoldings[];
  userAddress: string;
  isEvmConnected: boolean;
  isHederaConnected: boolean;
  onUpdate: () => Promise<void>;
  NGN_TO_AVAX: number;
}

export const AssetHoldings = ({
  portfolio,
  userAddress,
  isEvmConnected,
  isHederaConnected,
  onUpdate,
  NGN_TO_AVAX,
}: AssetHoldingsProps) => {
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const [selectedStock, setSelectedStock] = useState<StockHoldings | null>(
    null,
  );
  const [sellQuantity, setSellQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSelling, setIsSelling] = useState(false);
  // Hedera wallet functionality is handled by useHederaWallet hook

  const approveToken = async (tokenAddress: string, amount: number) => {
    try {
      const { getStockNGNDEXAddress } = await import("@/abis");
      const { NigerianStockTokenABI } = await import("@/abis");

      const dexAddress = getStockNGNDEXAddress(chainId || 11155111);
      if (!dexAddress) {
        throw new Error("DEX contract not deployed on this network");
      }

      const stockAmountIn = BigInt(amount) * BigInt(10 ** 18); // Convert to wei

      await writeContractAsync({
        abi: NigerianStockTokenABI,
        address: tokenAddress as `0x${string}`,
        functionName: "approve",
        args: [dexAddress as `0x${string}`, stockAmountIn],
      });
      toast.success("Token approval submitted");
    } catch (err) {
      console.error("Error occurred while approving tokens", err);
      toast.error("Token approval failed");
      throw err;
    }
  };

  const sellToken = async (
    amount: number,
    tokenAddress: string,
    pricePerShare: number,
  ) => {
    try {
      // Use DEX contract for selling tokens
      const { getStockNGNDEXAddress } = await import("@/abis");
      const { StockNGNDEXABI } = await import("@/abis");

      const dexAddress = getStockNGNDEXAddress(chainId || 11155111);
      if (!dexAddress) {
        throw new Error("DEX contract not deployed on this network");
      }

      // Calculate minimum NGN amount out (with 2% slippage tolerance)
      const stockAmountIn = BigInt(amount) * BigInt(10 ** 18); // Convert to wei
      const expectedNGNOut = stockAmountIn * BigInt(Math.floor(pricePerShare * 100)) / BigInt(100);
      const minNGNAmountOut = (expectedNGNOut * BigInt(98)) / BigInt(100); // 2% slippage

      // Set deadline to 30 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      await writeContractAsync({
        abi: StockNGNDEXABI,
        address: dexAddress as `0x${string}`,
        functionName: "swapStockForNGN",
        args: [
          tokenAddress as `0x${string}`,
          stockAmountIn,
          minNGNAmountOut,
          deadline,
        ],
      });
      toast.success("Sell transaction submitted");
    } catch (err) {
      console.error("Error occurred while selling tokens", err);
      toast.error("Sell transaction failed");
      throw err;
    }
  };

  // Hedera token sale function
  const sellHederaToken = async (amount: number, tokenId: string) => {
    // TODO: Implement Hedera token transfer using Hedera SDK
    // This will use the existing Hedera token service
    console.log("Selling Hedera token:", { amount, tokenId });
    toast.info("Hedera token sale functionality will be implemented");
    throw new Error("Hedera token sale not yet implemented");
  };

  const handleSell = async () => {
    if (!selectedStock || !userAddress) {
      toast.warning("No stock selected or wallet disconnected");
      return;
    }
    setIsSelling(true);

    try {
      const currentPricePerShare = selectedStock.current_price;
      const saleAmount = currentPricePerShare * sellQuantity;

      if (isEvmConnected) {
        const saleAmountAVAX = saleAmount / NGN_TO_AVAX;
        // Get token address from symbol
        const { getTokenAddress } = await import("@/abis");
        const tokenAddress = getTokenAddress(chainId || 11155111, selectedStock.symbol);

        if (!tokenAddress) {
          throw new Error(`Token address not found for ${selectedStock.symbol}`);
        }

        // First approve the DEX to spend tokens
        toast.info("Approving token spending...");
        await approveToken(tokenAddress, sellQuantity);

        // Wait a moment for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Then execute the sell
        toast.info("Executing sell order...");
        await sellToken(
          sellQuantity,
          tokenAddress,
          Math.ceil(currentPricePerShare),
        );

        if (paymentMethod === "mobile") {
          await sendNotification({
            customer_phone_number: phoneNumber,
            amount: saleAmount,
          });
        } else {
          await transferAVAX({ address: userAddress, amount: saleAmountAVAX });
        }
      } else if (isHederaConnected) {
        await sellHederaToken(sellQuantity, selectedStock.tokenId);

        if (paymentMethod === "mobile") {
          await sendNotification({
            customer_phone_number: phoneNumber,
            amount: saleAmount,
          });
        } else {
          // TODO: Implement Hedera HBAR transfer
          toast.info("Hedera HBAR transfer will be implemented");
        }
      }
      await updateUserStockHoldings({
        user_address: userAddress,
        stock_symbol: selectedStock.symbol,
        stock_name: selectedStock.name,
        number_stock: sellQuantity,
        tokenId: selectedStock.tokenId,
        operation: "sell",
      });

      toast.success(
        `Sold ${sellQuantity} shares of ${selectedStock.symbol} for ₦${saleAmount.toLocaleString(
          "en-NG",
          {
            minimumFractionDigits: 2,
          },
        )}`,
      );
      await onUpdate();
    } catch (err) {
      toast.error("Failed to complete sale");
      console.error("Sale error:", err);
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Asset Holdings</CardTitle>
        <CardDescription>
          Manage your portfolio and sell assets when ready
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">
                  Buy Price <p className="text-xs">(PerShare)</p>
                </TableHead>
                <TableHead className="text-right">
                  Current Price <p className="text-xs">(PerShare)</p>
                </TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Total Profit/Loss</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.map((stock) => {
                if (stock.shares === 0) return null;

                return (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">
                      {stock.symbol}
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="text-right">{stock.shares}</TableCell>
                    <TableCell className="text-right">
                      {stock.buy_price_perShare.toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.current_price.toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-base">
                      {(stock.current_price * stock.shares).toLocaleString(
                        "en-KE",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right ${stock.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      <div className="flex flex-col">
                        <div>
                          {stock.profit >= 0 ? (
                            <ArrowUp className="inline h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDown className="inline h-4 w-4 mr-1" />
                          )}
                          {Math.abs(stock.profit).toFixed(2)}%
                        </div>
                        <div className="text-xs">
                          {(stock.current_price - stock.buy_price_perShare) *
                            stock.shares >=
                          0
                            ? "+"
                            : ""}
                          {(
                            (stock.current_price - stock.buy_price_perShare) *
                            stock.shares
                          ).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStock(stock);
                              setSellQuantity(1);
                            }}
                          >
                            Sell
                          </Button>
                        </DialogTrigger>
                        {selectedStock?.symbol === stock.symbol && (
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>
                                Sell {selectedStock.symbol}
                              </DialogTitle>
                              <DialogDescription>
                                {selectedStock.name} - Current Price: ₦{" "}
                                {stock.current_price.toLocaleString("en-NG", {
                                  minimumFractionDigits: 2,
                                })}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                  Quantity to Sell (Max: {selectedStock.shares})
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={selectedStock.shares}
                                  value={sellQuantity}
                                  onChange={(e) =>
                                    setSellQuantity(
                                      Math.min(
                                        parseInt(e.target.value) || 1,
                                        selectedStock.shares,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                  Total Amount to Receive
                                </label>
                                <div className="text-xl font-bold">
                                  ₦{" "}
                                  {(
                                    stock.current_price * sellQuantity
                                  ).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                  Payment Method
                                </label>
                                <div className="flex space-x-2">
                                  <Button
                                    variant={
                                      paymentMethod === "mobile"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => setPaymentMethod("mobile")}
                                    className="flex-1"
                                  >
                                    Mobile Money
                                  </Button>
                                  <Button
                                    variant={
                                      paymentMethod === "eth"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => setPaymentMethod("eth")}
                                    className="flex-1"
                                  >
                                    HBAR
                                  </Button>
                                </div>
                              </div>
                              {paymentMethod === "mobile" && (
                                <div className="grid gap-2">
                                  <label className="text-sm font-medium">
                                    Phone Number
                                  </label>
                                  <Input
                                    placeholder="+254..."
                                    value={phoneNumber}
                                    onChange={(e) =>
                                      setPhoneNumber(e.target.value)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button onClick={handleSell} disabled={isSelling}>
                                {isSelling ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                  </div>
                                ) : (
                                  "Confirm Sale"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

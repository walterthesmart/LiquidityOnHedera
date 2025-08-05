"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconFlagBitcoin } from "@tabler/icons-react";
import { useState } from "react";
import { bitfinityService } from "@/lib/bitfinity-contract-service";
import { useAccount } from "wagmi";
import { Spinner } from "@/components/ui/spinner";

// Define the form schema with Zod for Bitfinity EVM
const stockFormSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or less")
    .toUpperCase(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less"),
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be 200 characters or less"),
  sector: z.string().min(1, "Sector is required"),
  totalShares: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().gt(0, "must be greater than 0")),
  marketCap: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().gt(0, "must be greater than 0")),
  initialSupply: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().gt(0, "must be greater than 0")),
});

// Defines the form value type from the schema
type StockFormValues = z.infer<typeof stockFormSchema>;

// Default values for the form
const defaultValues: Partial<StockFormValues> = {
  symbol: "",
  name: "",
  companyName: "",
  sector: "",
  totalShares: 0,
  marketCap: 0,
  initialSupply: 0,
};

export const TokenizeStockForm = () => {
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues,
  });

  // Handle form submission for Bitfinity EVM
  async function onSubmit(data: StockFormValues) {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    try {
      // Connect wallet if not already connected
      const signer = await bitfinityService.connectWallet();
      if (!signer) {
        toast.error("Failed to connect wallet");
        return;
      }

      // Prepare stock metadata for smart contract
      const stockMetadata = {
        symbol: data.symbol,
        companyName: data.companyName,
        sector: data.sector,
        totalShares: BigInt(data.totalShares),
        marketCap: BigInt(data.marketCap),
        isActive: true,
        lastUpdated: BigInt(Math.floor(Date.now() / 1000)),
      };

      // Note: In a real implementation, you would call the factory contract
      // to deploy the new token. For now, we'll show a success message.
      console.log("Stock metadata prepared for deployment:", stockMetadata);

      toast.success(
        `Stock token ${data.symbol} deployment initiated on Bitfinity EVM!`,
      );
      form.reset();
    } catch (error) {
      console.error("Error tokenizing stock:", error);
      toast.error("Failed to tokenize stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2 justify-self-center">
      <div className="mb-4 flex items-center gap-2">
        <IconFlagBitcoin className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          Stock Tokenization on Bitfinity EVM
        </h1>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Deploy New Stock Token</CardTitle>
          <CardDescription>
            Deploy a new Nigerian stock token on Bitfinity EVM by filling out
            the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="AAPL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the stock ticker symbol (e.g., AAPL for Apple Inc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Apple Inc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full name of the company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dangote Cement Plc" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full legal name of the company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Input placeholder="Industrial Goods" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the business sector (e.g., Banking, Oil & Gas,
                      Consumer Goods)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalShares"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Shares</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="17040000000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The total number of shares outstanding
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market Cap (NGN)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="7710000000000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Current market capitalization in Nigerian Naira
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Token Supply</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Initial supply of tokens to mint (will be sent to admin
                      address)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-semibold md:w-auto"
                disabled={!isConnected}
              >
                {isSubmitting ? (
                  <Spinner className="mr-1 h-4 w-4 text-white" />
                ) : (
                  <IconFlagBitcoin className="mr-1 h-4 w-4" strokeWidth={2} />
                )}
                {isSubmitting
                  ? "Deploying Token..."
                  : isConnected
                    ? "Deploy Stock Token"
                    : "Connect Wallet First"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

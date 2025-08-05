"use client";
import { StockData } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form";
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

import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { IconCash } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { store_stock_purchase } from "@/server-actions/buy/stock_holdings";
// paystack hook
import { usePaystack } from "@/hooks/use-paystack";
import { makePaymentRequest } from "@/server-actions/paystack/makePaymentRequest";
import { Errors } from "@/constants/errors";
import { sendTokensToUserBitfinity } from "@/server-actions/contracts/send_token_user";
import updateUserStockHoldings from "@/server-actions/stocks/update_stock_holdings";
import { useEffect } from "react";

// Defines the form value type from the schema
const paymentSchema = z.object({
  email: z.string().email("enter a valid email address"),
  amount: z
    .number({ message: Errors.INVALID_AMOUNT })
    .gt(0, { message: Errors.INVALID_AMOUNT })
    .transform((val) => Math.ceil(val)), //round up to next shilling
  stock_symbol: z
    .string({ message: Errors.INVALID_SYMBOL })
    .max(9, { message: Errors.INVALID_SYMBOL }),
});

type FormValues = z.infer<typeof paymentSchema>;

type BuyStocksFormProps = {
  entry: StockData;
  setDialogOpen?: (open: boolean) => void;
  onPurchaseComplete?: () => void;
};

export function BuyStocksForm({
  entry,
  setDialogOpen,
  onPurchaseComplete,
}: BuyStocksFormProps) {
  const [quantity, setQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("0");

  const { address } = useAccount();
  const { isReady: paystackReady, initiatePayment } = usePaystack();

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: entry.price,
      email: "",
      stock_symbol: entry.symbol,
    },
  });
  const rawAmount = entry.price * quantity;
  const roundedAmount = Math.ceil(rawAmount);
  const commission = roundedAmount - rawAmount;
  useEffect(() => {
    // Calculate token amount based on quantity
    if (quantity > 0) {
      setTokenAmount(quantity.toString());
    } else {
      setTokenAmount("0");
    }
  }, [quantity]);

  const onSubmit = async (data: FormValues) => {
    const finalAmount = Math.ceil(entry.price * quantity); // Calculate amount dynamically
    data.amount = finalAmount;
    if (!address) {
      toast.warning("you need to connect your wallet in order to proceed");
      return;
    }
    if (!paystackReady) {
      toast.warning(
        "Payment system is still loading. Please try again in a moment.",
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const transaction = await makePaymentRequest(
        data.email,
        finalAmount * 100,
      );

      let public_key: string = "";
      if (process.env.NODE_ENV === "production") {
        public_key = process.env.NEXT_PUBLIC_LIVE_PAYSTACK_PUBLIC_KEY!;
      } else {
        public_key = process.env.NEXT_PUBLIC_TEST_PAYSTACK_PUBLIC_KEY!;
      }

      // Close dialog if it exists
      if (setDialogOpen) {
        setTimeout(() => {
          setDialogOpen(false);
        }, 1000);
      }

      initiatePayment({
        key: public_key,
        email: data.email,
        amount: finalAmount * 100,
        ref: transaction.reference,
        access_code: transaction.access_code,
        currency: "NGN",
        callback: async (response) => {
          toast.success(`Payment complete! Reference:${response.reference}`);
          try {
            //store the stock purchase using the reference
            if (!address) {
              toast.warning("Connect your wallet");
              return;
            }

            const user_wallet = address;

            await store_stock_purchase({
              stock_symbol: data.stock_symbol,
              name: entry.name,
              amount_shares: quantity,
              buy_price: finalAmount,
              paystack_id: transaction.reference,
              user_wallet,
              purchase_date: new Date(),
              transaction_type: "buy",
            });

            console.log("Sending tokens to user");

            // Send tokens using Bitfinity EVM
            await sendTokensToUserBitfinity({
              tokenSymbol: entry.symbol,
              amount: quantity,
              receiverAddress: user_wallet,
            });

            console.log("Updating user stock holdings");
            await updateUserStockHoldings({
              stock_symbol: data.stock_symbol,
              user_address: user_wallet,
              stock_name: entry.name,
              number_stock: quantity,
              tokenId: entry.tokenID,
              operation: "buy",
            });

            // Show success message
            toast.success(
              `Payment successful! You've purchased ${quantity} shares of ${entry.symbol}`,
            );

            // Reset form
            form.reset();
            setQuantity(0);

            // Call completion handler if provided
            if (onPurchaseComplete) {
              onPurchaseComplete();
            }
          } catch (error) {
            console.error("Error processing successful payment:", error);
            toast.error(
              "Error completing your purchase. Please contact support.",
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        onClose: function () {
          toast.info("Payment cancelled or window closed");
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Error: unable to initiate payment");
      setIsSubmitting(false);
    }
  };

  // Log validation errors when submit fails
  const onError = (errors: FieldErrors<FormValues>) => {
    Object.keys(errors).forEach((field) => {
      const key = field as keyof FormValues;
      toast.error(`Error: ${errors[key]?.message}`);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-4 sm:space-y-6"
      >
        <div className="grid gap-2">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </Label>
          <Input
            id="quantity"
            max={100000}
            type="number"
            value={quantity}
            onChange={(e) => {
              setQuantity(parseInt(e.target.value));
            }}
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
          <FormDescription className="text-xs">
            Enter the quantity of stocks you want you buy
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="eg. johndoe@example.com"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                  className="h-12 text-base sm:h-10 sm:text-sm"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Enter your email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <label className="block text-sm font-medium mb-2">
            You will Receive ({entry.name})
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{entry.symbol}</span>
            </div>
            <Input type="text" className="pl-16" value={tokenAmount} readOnly />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Price Per Share</span>
            <span className="text-sm font-semibold ">
              ₦{" "}
              {entry.price.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500"> Your Total</span>
            <span className="text-sm w-64 text-right font-semibold overflow-hidden">
              ₦{" "}
              {quantity
                ? (entry.price * quantity).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })
                : 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Commision</span>
            <span className="text-sm w-64 text-right font-semibold overflow-hidden">
              ₦{" "}
              {quantity
                ? commission.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })
                : 0}
            </span>
          </div>
        </div>

        <div className="mt-4 w-full border">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full font-semibold text-base h-12 sm:h-10"
          >
            {isSubmitting ? (
              <Spinner className="mr-1 h-6 w-6 text-white" />
            ) : (
              <IconCash className="mr-1 h-6 w-6 " strokeWidth={2} />
            )}
            {isSubmitting ? "Processing" : `Buy ${entry.symbol}-NSE`}
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          <p>
            By submitting this order, you agree to our Terms of Service and
            Privacy Policy. Market conditions may affect final settlement price.
          </p>
        </div>
      </form>
    </Form>
  );
}

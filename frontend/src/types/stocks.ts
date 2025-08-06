import { z } from "zod";

export const CreateStockTokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  totalShares: z.number().int().nonnegative(),
});
export const BuyTokenSchema = z.object({
  tokenId: z.string(),
  userWalletAddress: z.string(),
  amount: z.number().int().positive(),
  transactionId: z.string().optional(),
});
export const sellTokenSchema = z.object({
  tokenId: z.string(),
  userWalletAddress: z.string(),
  amount: z.number().int().positive(),
  transactionId: z.string().optional(),
});
export type CreateStockTokenArgs = z.infer<typeof CreateStockTokenSchema>;
export type BuyTokenArgs = z.infer<typeof BuyTokenSchema>;
export type SellTokenArgs = z.infer<typeof sellTokenSchema>;

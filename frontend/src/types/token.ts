import { z } from "zod";

export const TokenSchema = z.object({
  assetName: z.string(),
  supply: z.number(),
});

export const sendTokenSchema = z.object({
  tokenId: z.string(),
  amount: z.number(),
  receiverAddress: z.string(),
});

export type HederaToken = z.infer<typeof TokenSchema>;

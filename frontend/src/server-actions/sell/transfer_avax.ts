"use server";

import { MyError } from "@/constants/errors";

// Legacy Avalanche function - deprecated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function transferAVAX(_args: {
  address: string;
  amount: number;
}) {
  console.log(
    "Avalanche support has been removed. Use Hedera HBAR transfers instead.",
  );
  throw new MyError(
    "Avalanche support has been removed. Use transferHbar instead.",
  );
}

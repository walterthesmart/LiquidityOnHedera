"use server";

import "../../../envConfig";
import { Errors, MyError } from "@/constants/errors";
import { convertKESToHBAR } from "../sell/convertKES_HBAR";

export async function transferHbar(args: {
  userAddress: string;
  amount: number;
}) {
  try {
    // Convert KES to HBAR
    const hbarAmount = await convertKESToHBAR(args.amount);
    // TODO: Implement proper Hedera HBAR transfer using Hedera SDK
    console.log(
      `Would transfer ${Math.ceil(hbarAmount)} HBAR to ${args.userAddress}`,
    );
    throw new MyError("Hedera HBAR transfer implementation needed");
  } catch (err) {
    console.log("Error transfering hbar", err);
    throw new MyError(Errors.NOT_TRANSFER_HBAR);
  }
}

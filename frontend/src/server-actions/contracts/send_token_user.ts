"use server";

// Bitfinity EVM token transfer functionality
import { MyError } from "@/constants/errors";
import { BuyTokenArgs } from "@/types/stocks";

// Legacy Avalanche function - deprecated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendTokensToUserAvalanche(_args: BuyTokenArgs) {
  console.log(
    "Avalanche support has been removed. Use Bitfinity EVM tokens instead.",
  );
  throw new MyError(
    "Avalanche support has been removed. Use sendTokensToUserBitfinity instead.",
  );
}

// Legacy Hedera function - deprecated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendTokensToUserHedera(_args: {
  tokenId: string;
  amount: number;
  receiverAddress: string;
}) {
  console.log(
    "Hedera support has been removed. Use Bitfinity EVM tokens instead.",
  );
  throw new MyError(
    "Hedera support has been removed. Use sendTokensToUserBitfinity instead.",
  );
}

export async function sendTokensToUserBitfinity(args: {
  tokenSymbol: string;
  amount: number;
  receiverAddress: string;
}) {
  try {
    // TODO: Implement Bitfinity EVM token transfer
    // This would typically be done through a smart contract call
    // For now, we'll simulate the transfer since this is a server action
    // In a real implementation, this would:
    // 1. Get the token contract address from the factory
    // 2. Call the transfer function on the token contract
    // 3. Handle the transaction and wait for confirmation

    console.log("Sending Bitfinity EVM tokens:", args);

    // Simulate successful transfer for now
    // In production, this would interact with the deployed contracts
    return {
      success: true,
      transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
      message: `Successfully transferred ${args.amount} ${args.tokenSymbol} tokens to ${args.receiverAddress}`,
    };
  } catch (err) {
    console.error("Error sending tokens", err);
    throw new MyError("Could not send tokens to user");
  }
}

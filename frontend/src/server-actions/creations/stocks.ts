"use server";
import { Errors, MyError } from "@/constants/errors";
import { Chains } from "@/constants/status";
// Legacy contract import removed - migrated to Bitfinity EVM
import database from "@/db";
import { CreateStockTokenArgs } from "@/types/stocks";

export async function createStockOnHedera(args: CreateStockTokenArgs) {
  try {
    //Check if the stock with the symbol exists
    const stockExists = await database.checkIfStockExists(
      args.symbol,
      Chains.HEDERA,
    );
    if (stockExists) {
      return;
    }

    //TODO: Migrate to Bitfinity EVM contract deployment
    // This function needs to be updated to use the new Bitfinity contract service
    console.log("Legacy Hedera function called:", args);
    throw new MyError(
      "Stock creation has been migrated to Bitfinity EVM. Please use the admin panel.",
    );

    const tokenId = "MIGRATED_TO_BITFINITY";

    //Save the stock token to the database
    await database.createStockInDB({
      tokenID: tokenId,
      symbol: args.symbol,
      name: args.name,
      totalShares: args.totalShares,
      chain: Chains.HEDERA,
      exchange: "NGX",
      sector: "Technology",
      isActive: true,
      lastUpdated: new Date(),
    });
  } catch (err) {
    console.log("Error creating stock", err);
    throw new MyError(Errors.NOT_CREATE_STOCK);
  }
}

"use server";

import { UpdateUserStockHoldings } from "@/constants/types";
import database from "@/db";

export default async function updateUserStockHoldings(
  args: UpdateUserStockHoldings,
) {
  try {
    console.log("Update stock holdings args", args);
    // Map the fields to match the database interface
    const dbArgs = {
      user_address: args.user_address,
      stock_symbol: args.stock_symbol,
      amount_shares: args.number_stock, // Map number_stock to amount_shares
      operation: args.operation,
    };
    // Update in db
    await database.updateNumberStocksOwnedByUser(dbArgs);
  } catch (err) {
    throw err;
  }
}

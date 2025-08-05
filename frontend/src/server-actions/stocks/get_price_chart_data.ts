"use server";
import { Errors, MyError } from "@/constants/errors";
import database from "@/db";

interface Prices {
  time: Date;
  price: number;
}

export default async function getPriceChartData(
  symbol: string,
): Promise<Prices[]> {
  try {
    if (!symbol) {
      throw new Error("Symbol is required");
    }

    // Use the new Turso database method to get price chart data
    const prices = await database.getPriceChartData(symbol.toUpperCase());

    return prices;
  } catch (err) {
    console.log("Could not get prices for symbol:", symbol, err);
    throw new MyError(Errors.NOT_GET_PRICES);
  }
}

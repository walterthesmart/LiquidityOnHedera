"use server";

import axios from "axios";
import "../../../envConfig";
import { Errors, MyError } from "@/constants/errors";

export async function convertKESToHBAR(kes: number): Promise<number> {
  try {
    if (!process.env.CONVERSION_KEY) {
      console.log("Set CONVERSION_KEY in env variables");
      throw new MyError(Errors.INVALID_SETUP);
    }
    // Get conversion rates
    const response = await axios(
      `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${process.env.CONVERSION_KEY}`,
      {
        timeout: 5000,
      },
    );
    if (response.data) {
      if (response.data.rates) {
        const rates = response.data.rates;

        // Convert kes to usd
        const usdAmount = kes / rates.KES;
        const hbarAmount = usdAmount * rates.HBAR;
        return hbarAmount;
      }
    }

    throw "Could not use API";
  } catch (err) {
    if (err instanceof MyError) {
      if (err.message === Errors.INVALID_SETUP) {
        throw err;
      }
    }

    console.log(err);
    console.log("Using fallback value");
    return kes / 21.8;
  }
}

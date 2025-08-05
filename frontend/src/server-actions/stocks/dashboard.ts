"use server";

import { Errors, MyError } from "@/constants/errors";
import database from "@/db";
import { getStockPrices } from "./getStocks";
import { PaymentStatus } from "@/constants/status";

export async function getTotalPortfolioValue(
  user_address: string,
): Promise<number> {
  try {
    // Get prices of all stocks
    const priceStocks = await getStockPrices();

    // Get stocks of a user
    const userStocks = await database.getStocksOwnedByUser(user_address);

    // Multiply and sum price
    let value = 0;
    if (userStocks) {
      for (const s of userStocks.stocks) {
        for (const price of priceStocks) {
          if (s.symbol === price.symbol) {
            value += s.number_stocks * price.price;
          }
        }
      }
    }

    return value;
  } catch (err) {
    console.log("Error getting total portfolio value", err);
    if (err instanceof MyError) {
      throw err;
    }
    throw new MyError(Errors.UNKNOWN);
  }
}

// interface StocksList {
//   num: number;
//   price: number;
//   symbol: string;
// }

interface InitialInvestmentArgs {
  user_address: string;
  symbol?: string;
  date?: Date;
}

export async function getInitialInvestment(
  args: InitialInvestmentArgs,
): Promise<number> {
  try {
    // Get all stock transactions
    const transactions = await database.getStockPurchases(
      args.user_address,
      PaymentStatus.PAID,
    );
    let totalInvestment = 0;
    const sharesHeld: { [symbol: string]: number } = {};
    const currentHoldings = await database.getStocksOwnedByUser(
      args.user_address,
    );

    // Initialize sharesHeld with current holdings
    if (currentHoldings) {
      for (const stock of currentHoldings.stocks) {
        sharesHeld[stock.symbol] = stock.number_stocks;
      }
    }

    // Process transactions in reverse order (newest first)
    for (let i = transactions.length - 1; i >= 0; i--) {
      const trans = transactions[i];

      if (args.date && trans.purchase_date > args.date) {
        continue;
      }

      if (trans.transaction_type === "buy") {
        // Only count this buy if we still hold some of these shares
        const sharesStillHeld = sharesHeld[trans.stock_symbol] || 0;
        const sharesToCount = Math.min(sharesStillHeld, trans.amount_shares);

        if (sharesToCount > 0) {
          totalInvestment +=
            sharesToCount * (trans.buy_price / trans.amount_shares);
          sharesHeld[trans.stock_symbol] = sharesStillHeld - sharesToCount;
        }
      } else if (trans.transaction_type === "sell") {
        // For sells, add back the shares (since we're processing in reverse)
        sharesHeld[trans.stock_symbol] =
          (sharesHeld[trans.stock_symbol] || 0) + trans.amount_shares;
      }
    }

    return totalInvestment;
  } catch (err) {
    console.log("Error getting initial investment", err);
    if (err instanceof MyError) {
      throw err;
    }
    throw new MyError(Errors.UNKNOWN);
  }
}

// function removeStock(
//   args: { num: number; symbol: string },
//   stocks: StocksList[],
// ) {
//   try {
//     if (stocks.length <= 0) {
//       throw new MyError(Errors.MUST_STOCKS_SELL);
//     }

//     while (args.num > 0) {
//       if (stocks.length < 1) {
//         throw new MyError(Errors.TOO_MANY_SELL);
//       }
//       const oldest = stocks.find((f) => f.symbol === args.symbol);

//       if (oldest) {
//         const oldestIndex = stocks.indexOf(oldest);
//         if (oldest.num > args.num) {
//           oldest.num = oldest.num - args.num;
//           break;
//         } else if (oldest.num === args.num) {
//           stocks.splice(oldestIndex, 1);
//           break;
//         } else {
//           args.num = args.num - oldest.num;
//           stocks.splice(oldestIndex, 1);
//         }
//       } else {
//         throw new MyError(Errors.TOO_MANY_SELL);
//       }
//     }
//   } catch (err) {
//     console.log("Error removing items", err);
//     throw err;
//   }
// }

interface StockHoldings {
  tokenId: string;
  symbol: string;
  name: string;
  shares: number;
  buy_price_perShare: number;
  current_price: number;
  profit: number;
  total_value_bought: number;
}

export async function getStockHoldings(
  user_address: string,
): Promise<StockHoldings[]> {
  try {
    const stockHoldings: StockHoldings[] = [];
    const ownedStocks = await database.getStocksOwnedByUser(user_address);
    const stockPrices = await getStockPrices();
    const transactions = await database.getStockPurchases(
      user_address,
      PaymentStatus.PAID,
    );

    if (ownedStocks) {
      for (const stock of ownedStocks.stocks) {
        const price = stockPrices.find((f) => f.symbol === stock.symbol);
        if (price === undefined) {
          throw new MyError(Errors.NOT_GET_STOCK_PRICES);
        }
        const currentPrice = price.price;

        // Get all buy transactions for this stock, sorted by date (newest first)
        const buyTransactions = transactions
          .filter(
            (t) =>
              t.stock_symbol === stock.symbol && t.transaction_type === "buy",
          )
          .sort(
            (a, b) => b.purchase_date.getTime() - a.purchase_date.getTime(),
          );

        // Calculate remaining shares and track their purchase prices
        let remainingShares = stock.number_stocks;
        const purchaseLots: { pricePerShare: number; shares: number }[] = [];

        for (const trans of buyTransactions) {
          if (remainingShares <= 0) break;

          const sharesFromThisPurchase = Math.min(
            remainingShares,
            trans.amount_shares,
          );
          purchaseLots.push({
            pricePerShare: trans.buy_price / trans.amount_shares, // Actual price paid per share
            shares: sharesFromThisPurchase,
          });
          remainingShares -= sharesFromThisPurchase;
        }

        // Calculate total invested using actual purchase prices
        let totalInvested = 0;
        purchaseLots.forEach((lot) => {
          totalInvested += lot.pricePerShare * lot.shares;
        });

        // Use the price from the first purchase that contributed shares
        const actualBuyPricePerShare =
          purchaseLots.length > 0 ? purchaseLots[0].pricePerShare : 0;

        // Calculate profit/loss based on actual purchase price
        const profit =
          actualBuyPricePerShare > 0
            ? ((currentPrice - actualBuyPricePerShare) /
                actualBuyPricePerShare) *
              100
            : 0;

        if (stock.number_stocks > 0) {
          stockHoldings.push({
            tokenId: stock.tokenId,
            shares: stock.number_stocks,
            symbol: stock.symbol,
            buy_price_perShare: actualBuyPricePerShare, // Actual price paid per share
            name: stock.name,
            current_price: currentPrice,
            total_value_bought: totalInvested,
            profit,
          });
        }
      }
      return stockHoldings;
    }
    return [];
  } catch (err) {
    console.log("Error getting stock holdings", err);
    if (err instanceof MyError) {
      throw err;
    }
    throw new MyError(Errors.UNKNOWN);
  }
}

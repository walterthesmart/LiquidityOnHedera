"use server";

import { Errors, MyError } from "@/constants/errors";
import { GetGraphData, GraphDataMode } from "@/constants/types";
import { getInitialInvestment } from "../stocks/dashboard";

interface GraphData {
  value: number;
  date: Date;
}

export default async function getGraphData(
  args: GetGraphData,
): Promise<GraphData[]> {
  try {
    if (args.from > args.to) {
      console.log("From date can't be after to date");
      throw new MyError(Errors.INVALID_FROM_TO_DATE);
    }

    const dates = _getDatesInRange(args.from, args.to, args.mode);
    const graphData: GraphData[] = [];

    for (const date of dates) {
      const investmentAtPoint = await getInitialInvestment({
        user_address: args.user_address,
        date,
      });
      graphData.push({
        value: investmentAtPoint,
        date,
      });
    }

    return graphData;
  } catch (err) {
    console.log("Error getting graph data", err);
    if (err instanceof MyError) {
      throw err;
    }
    throw new MyError(Errors.NOT_GET_GRAPH_DATA);
  }
}

function _getDatesInRange(from: Date, to: Date, mode: GraphDataMode): Date[] {
  if (from === to) {
    return [from];
  }

  const dates = [];
  // First element is from date
  dates.push(from);

  let dateToAdd = new Date(from);
  // Get all dates that are beginning of next week or month but less than to
  while (dateToAdd < to) {
    const newDate = new Date(dateToAdd);

    if (mode === GraphDataMode.MONTHLY) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (mode === GraphDataMode.WEEKLY) {
      newDate.setDate(newDate.getDate() + 7);
    }

    if (newDate < to) {
      dates.push(newDate);
    }
    dateToAdd = new Date(newDate);
  }

  dates.push(to);

  return dates;
}

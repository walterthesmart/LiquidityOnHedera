import { getQueryClient } from "@/context/get-query-client";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Stocks } from "./_components/stocks";
import { getStocks } from "@/server-actions/stocks/getStocks";
export const dynamic = "force-dynamic";
export default async function MarketPlacePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
  });
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-16 mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mt-6 mb-4 sm:mb-2">
        Marketplace
      </h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Stocks /*stocks={stocks}*/ />
      </HydrationBoundary>
    </div>
  );
}

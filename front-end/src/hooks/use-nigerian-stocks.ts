import { useQuery } from '@tanstack/react-query';

export function useNigerianStocks() {
  return useQuery({
    queryKey: ['nigerian-stocks'],
    queryFn: async () => {
      const response = await fetch('/api/nigerian-stocks?action=stocks');
      if (!response.ok) {
        throw new Error('Failed to fetch Nigerian stocks');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
}

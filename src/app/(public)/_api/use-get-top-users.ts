import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

export const useGetTopUsers = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.TOP_USERS],
    staleTime: 2 * 60 * 1000, // 2 min: top creators list changes slowly
    queryFn: async () => {
      const response = await client.api.post['top-creators-today']['$get']();

      if (!response.ok) {
        throw new Error('Failed to fetch top users');
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};

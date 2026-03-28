import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

export const useGetPosts = (status?: string) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_POSTS, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (status) {
        params.append('status', status);
      }

      const response = await client.api.admin.post.$get({
        query: params.toString() ? Object.fromEntries(params) : undefined
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result.data;
    },
  });

  return query;
};

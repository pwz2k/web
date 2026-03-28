import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

export const useGetComments = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_COMMENTS],
    queryFn: async () => {
      const response = await client.api.admin.comment.$get();

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result.data;
    },
  });

  return query;
};

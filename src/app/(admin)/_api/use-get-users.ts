import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

export const useGetUsers = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_USERS],
    queryFn: async () => {
      const response = await client.api.admin.user.$get();

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result.data;
    },
  });

  return query;
};

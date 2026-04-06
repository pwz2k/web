import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

interface UseGetUsersProps {
  page?: number;
  limit?: number;
}

export const useGetUsers = ({ page = 1, limit = 50 }: UseGetUsersProps = {}) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_USERS, page, limit],
    queryFn: async () => {
      const response = await client.api.admin.user.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result;
    },
  });

  return query;
};

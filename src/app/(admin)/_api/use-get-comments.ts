import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

interface UseGetCommentsProps {
  page?: number;
  limit?: number;
}

export const useGetComments = ({ page = 1, limit = 50 }: UseGetCommentsProps = {}) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_COMMENTS, page, limit],
    queryFn: async () => {
      const response = await client.api.admin.comment.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result;
    },
  });

  return query;
};

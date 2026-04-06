import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

interface UseGetPostsProps {
  status?: string;
  page?: number;
  limit?: number;
}

export const useGetPosts = ({ status, page = 1, limit = 50 }: UseGetPostsProps = {}) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_GET_POSTS, status, page, limit],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (status) {
        params.status = status;
      }
      params.page = page.toString();
      params.limit = limit.toString();

      const response = await client.api.admin.post.$get({
        query: params
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const result = await response.json();
      // Return just the data array for backward compatibility
      return result;
    },
  });

  return query;
};

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';

export const useGetComments = (id?: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: [QUERY_KEYS.GET_COMMENTS_BY_POST, { id }],
    staleTime: 45 * 1000, // 45s: comments don't change every second
    queryFn: async () => {
      const response = await client.api.comment[':postId']['$get']({
        param: { postId: id },
      });

      if (!response.ok) {
        // GET comments is public; 401 can happen if cookies weren't sent or session expired
        const status = Number(response.status);
        if (status === 401) return [];
        throw new Error('Failed to fetch comments');
      }

      const json = await response.json();
      const data = json?.data ?? json;
      return Array.isArray(data) ? data : [];
    },
  });

  return query;
};

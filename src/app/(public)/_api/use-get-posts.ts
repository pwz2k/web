import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { PostWithRelations } from '@/types';
import { Gender } from '@prisma/client';
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsResponse {
  data: PostWithRelations[];
  hasMore: boolean;
  nextPage: number;
}

export const useGetPosts = (preference?: Gender, id?: string) => {
  return useInfiniteQuery<PostsResponse>({
    queryKey: [QUERY_KEYS.POST, preference, id],
    staleTime: 60 * 1000, // 1 min: avoid refetching feed too often (DB on different region)
    queryFn: async ({ pageParam = 1 }) => {
      const response = await client.api.post.$get({
        query: { page: String(pageParam), preference, id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      return await response.json();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  });
};

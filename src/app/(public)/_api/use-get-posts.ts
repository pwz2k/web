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
    // Preference is part of queryKey, so each MALE/FEMALE/BOTH has its own cache. Short stale avoids refetching on every focus (staleTime: 0 felt slow).
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
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

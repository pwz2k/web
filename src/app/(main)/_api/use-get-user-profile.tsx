import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

/**
 * @param forAuthPage - Profile, billing, etc.: layout already enforces `currentUser()` on the server.
 *   Always run the query (no `useSession` gate). The client session can incorrectly stay
 *   `loading`/`unauthenticated` after SPA navigation while cookies are valid — gating on it disabled
 *   the fetch and left the page spinning forever.
 */
export const useGetUserProfile = (options?: { forAuthPage?: boolean }) => {
  const forAuthPage = options?.forAuthPage === true;
  const { status } = useSession();

  const query = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    enabled: forAuthPage ? true : status === 'authenticated',
    queryFn: async () => {
      const response = await client.api.user.profile.$get();

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const { data } = await response.json();

      if (!data) {
        return data;
      }

      return {
        ...data,
        balance: convertAmountFromMiliunits(data.balance ?? 0),
        totalSpent: convertAmountFromMiliunits(data.totalSpent ?? 0),
      };
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: forAuthPage ? 0 : 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...(forAuthPage ? { refetchOnMount: 'always' as const } : {}),
  });

  return { ...query, sessionStatus: status };
};

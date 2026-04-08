import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

/**
 * @param eager - Use on server-protected pages (profile, billing). Fetches while `useSession` is still
 *   `loading` so the query isn't blocked after sign-in + client navigation (cookie is often valid already).
 */
export const useGetUserProfile = (options?: { eager?: boolean }) => {
  const eager = options?.eager === true;
  const { status } = useSession();

  const query = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    enabled: eager ? status !== 'unauthenticated' : status === 'authenticated',
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
    // Profile JSON is relatively stable; avoid refetching on every navigation.
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return { ...query, sessionStatus: status };
};

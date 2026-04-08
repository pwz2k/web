import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetUserProfile = () => {
  const { status } = useSession();

  const query = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const response = await client.api.user.profile.$get();

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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    // Profile JSON is relatively stable; avoid refetching on every navigation.
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return { ...query, sessionStatus: status };
};

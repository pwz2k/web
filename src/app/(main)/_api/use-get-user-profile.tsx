import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';
import { useEffect } from 'react';

export const useGetUserProfile = () => {
  const { status, update } = useSession();

  // Force session update when component mounts to ensure fresh data
  useEffect(() => {
    if (status === 'authenticated') {
      update();
    }
  }, [status, update]);

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
    staleTime: 0, // Always fetch fresh data
  });

  return { ...query, sessionStatus: status };
};

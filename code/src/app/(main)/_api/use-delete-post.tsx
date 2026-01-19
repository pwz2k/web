import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferResponseType } from 'hono';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { toast } from 'sonner';

type ResponseType = InferResponseType<
  (typeof client.api.post)[':id']['$delete']
>;

export const useDeletePost = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.post[':id']['$delete']({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Post deleted Successfully!');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_POSTS] });
    },
    onError: () => {
      toast.error('Failed to delete post!');
    },
  });

  return mutation;
};

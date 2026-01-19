import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { toast } from 'sonner';

type ResponseType = InferResponseType<typeof client.api.post.$post>;
type RequestType = InferRequestType<typeof client.api.post.$post>['json'];

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.post.$post({ json });

      if (!response.ok) {
        throw new Error('Failed to create the post');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_POSTS] });
      toast.success('Post created Successfully!');
    },
    onError: () => {
      toast.error('Failed to create the post!');
    },
  });

  return mutation;
};

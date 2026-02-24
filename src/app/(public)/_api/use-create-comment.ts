import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { QUERY_KEYS } from '@/constants/query-keys';
import { client } from '@/lib/hono';
import { toast } from 'sonner';

type ResponseType = InferResponseType<
  (typeof client.api.comment)[':postId']['$post']
>;
type RequestType = InferRequestType<
  (typeof client.api.comment)[':postId']['$post']
>['json'];

export const useCreateComment = (postId?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.comment[':postId']['$post']({
        json,
        param: { postId },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const err = new Error('Unauthorized') as Error & { statusCode?: number };
          err.statusCode = 401;
          throw err;
        }
        throw new Error('Failed to submit the comment');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS_BY_POST, { id: postId }],
      });
      toast.success('comment submitted Successfully!');
    },
    onError: (error: Error & { statusCode?: number }) => {
      if (error?.statusCode === 401) {
        toast.error('Please sign in to comment.');
        return;
      }
      toast.error('Failed to submit the comment!');
    },
  });

  return mutation;
};

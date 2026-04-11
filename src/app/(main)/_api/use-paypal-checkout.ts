import { client } from '@/lib/hono';
import { parseResponseJson } from '@/lib/parse-api-response';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Function to call the backend
const createCheckoutSession = async ({ amount }: { amount: number }) => {
  const response = await client.api.paypal.checkout.$post({ json: { amount } });

  const data = await parseResponseJson<{ approvalUrl?: string; message?: string }>(
    response
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create checkout session');
  }

  const { approvalUrl } = data;
  return approvalUrl;
};

// React Query Mutation Hook
export const usePaypalCheckoutMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: async (approvalUrl) => {
      if (approvalUrl) {
        router.push(approvalUrl);
      }
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      alert('Payment failed');
    },
  });
};

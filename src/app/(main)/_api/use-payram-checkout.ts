import { client } from '@/lib/hono';
import { parseResponseJson } from '@/lib/parse-api-response';
import { useMutation } from '@tanstack/react-query';

const createPayramCheckout = async ({ amount }: { amount: number }) => {
  const response = await client.api.payram.checkout.$post({
    json: { amount },
  });

  const data = await parseResponseJson<{
    url?: string;
    message?: string;
  }>(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to create Payram checkout session'
    );
  }

  if (!data.url) {
    throw new Error('No checkout URL returned from Payram');
  }

  return data.url;
};

export const usePayramCheckoutMutation = () => {
  return useMutation({
    mutationFn: createPayramCheckout,
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      console.error('Payram payment failed:', error);
      const msg =
        error instanceof Error ? error.message : 'Payment failed';
      alert(msg);
    },
  });
};

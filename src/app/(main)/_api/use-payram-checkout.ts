import { client } from '@/lib/hono';
import { useMutation } from '@tanstack/react-query';

const createPayramCheckout = async ({ amount }: { amount: number }) => {
  const response = await client.api.stripe.checkout.$post({
    json: { amount, provider: 'payram' },
  });

  if (!response.ok) {
    throw new Error('Failed to create Payram checkout session');
  }

  const data = (await response.json()) as { url?: string };
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
      alert('Payment failed');
    },
  });
};

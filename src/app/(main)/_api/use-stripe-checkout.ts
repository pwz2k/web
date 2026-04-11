import { client } from '@/lib/hono';
import { parseResponseJson } from '@/lib/parse-api-response';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';

// Only initialize Stripe if publishable key is available
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

// Function to call the backend
const createCheckoutSession = async ({ amount }: { amount: number }) => {
  const response = await client.api.stripe.checkout.$post({ json: { amount } });

  const data = await parseResponseJson<{
    sessionId?: string;
    message?: string;
  }>(response);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create checkout session');
  }

  if (!data.sessionId) {
    throw new Error('Failed to create checkout session');
  }

  return data.sessionId;
};

// React Query Mutation Hook
export const useStripeCheckoutMutation = () => {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: async (sessionId) => {
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        console.error('Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
        alert('Payment service is not configured. Please contact support.');
      }
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      alert('Payment failed');
    },
  });
};

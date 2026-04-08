const PAYRAM_CHECKOUT_URL = 'https://api.payram.com/v1/checkout';

export type PayramCheckoutParams = {
  amountUsd: number;
  customerEmail: string;
  customerId: string;
};

function pickCheckoutUrl(data: Record<string, unknown>): string | null {
  if (typeof data.url === 'string' && data.url) return data.url;
  if (typeof data.checkoutUrl === 'string' && data.checkoutUrl)
    return data.checkoutUrl;
  if (typeof data.checkout_url === 'string' && data.checkout_url)
    return data.checkout_url;
  const nested = data.data;
  if (
    nested &&
    typeof nested === 'object' &&
    nested !== null &&
    'url' in nested &&
    typeof (nested as { url: unknown }).url === 'string'
  ) {
    return (nested as { url: string }).url;
  }
  return null;
}

/**
 * Creates a Payram checkout session and returns the hosted payment URL.
 */
export async function createPayramCheckoutUrl(
  params: PayramCheckoutParams
): Promise<string> {
  const secret = process.env.PAYRAM_SECRET_KEY;
  if (!secret) {
    throw new Error('PAYRAM_SECRET_KEY is not configured');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const response = await fetch(PAYRAM_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      customerEmail: params.customerEmail,
      customerId: params.customerId,
      amountInUSD: params.amountUsd,
      successUrl: `${baseUrl}/billing`,
      cancelUrl: `${baseUrl}/billing`,
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : `Payram checkout failed (${response.status})`;
    throw new Error(msg);
  }

  const url = pickCheckoutUrl(data);
  if (!url) {
    throw new Error('Payram did not return a checkout URL');
  }

  return url;
}

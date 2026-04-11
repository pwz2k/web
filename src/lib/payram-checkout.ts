const PAYRAM_CLOUD_DEFAULT = 'https://api.payram.com';

/**
 * Self-hosted Payram (see https://docs.payram.com/api-integration/payments-api/create-payment):
 * - POST {BASE}/api/v1/payment
 * - Header: API-Key (not Bearer)
 * - Body: customerEmail, customerID, amountInUSD
 *
 * Payram Cloud uses a different contract (Bearer + /v1/checkout + customerId + redirect URLs).
 */
function isSelfHostedMode(): boolean {
  const v = process.env.PAYRAM_SELF_HOSTED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Checkout / create-payment URL.
 * - PAYRAM_CHECKOUT_URL: full URL (highest priority)
 * - PAYRAM_API_BASE_URL: origin only; path depends on PAYRAM_SELF_HOSTED
 * - Default: Payram Cloud https://api.payram.com/v1/checkout
 */
function resolvePayramCheckoutUrl(): string {
  const full = process.env.PAYRAM_CHECKOUT_URL?.trim();
  if (full) {
    return full.replace(/\/+$/, '');
  }
  const base = (
    process.env.PAYRAM_API_BASE_URL?.trim() || PAYRAM_CLOUD_DEFAULT
  ).replace(/\/+$/, '');

  if (isSelfHostedMode()) {
    return `${base}/api/v1/payment`;
  }

  return `${base}/v1/checkout`;
}

function payramHeaders(secret: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isSelfHostedMode()) {
    headers['API-Key'] = secret;
  } else {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

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

async function parsePayramResponse(response: Response): Promise<{
  ok: boolean;
  data: Record<string, unknown>;
  rawText: string;
}> {
  const rawText = await response.text();
  if (!rawText) {
    return { ok: response.ok, data: {}, rawText: '' };
  }
  try {
    const data = JSON.parse(rawText) as Record<string, unknown>;
    return { ok: response.ok, data, rawText };
  } catch {
    return {
      ok: response.ok,
      data: {},
      rawText,
    };
  }
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
  const checkoutUrl = resolvePayramCheckoutUrl();

  const body = isSelfHostedMode()
    ? {
        customerEmail: params.customerEmail,
        customerID: params.customerId,
        amountInUSD: params.amountUsd,
      }
    : {
        customerEmail: params.customerEmail,
        customerId: params.customerId,
        amountInUSD: params.amountUsd,
        successUrl: `${baseUrl}/billing`,
        cancelUrl: `${baseUrl}/billing`,
      };

  let response: Response;
  try {
    response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: payramHeaders(secret),
      body: JSON.stringify(body),
    });
  } catch (e) {
    const hint =
      e instanceof Error ? e.message : 'Network error calling Payram';
    throw new Error(
      `Could not reach Payram (${checkoutUrl}): ${hint}. Check PAYRAM_API_BASE_URL / PAYRAM_CHECKOUT_URL and that the server allows outbound HTTPS.`
    );
  }

  const { data, rawText } = await parsePayramResponse(response);

  if (!response.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : rawText && rawText.length < 500
            ? rawText
            : `Payram request failed (${response.status})`;
    throw new Error(msg);
  }

  const url = pickCheckoutUrl(data);
  if (!url) {
    throw new Error(
      'Payram did not return a payment URL. Check PAYRAM_SELF_HOSTED if you use self-hosted Payram (docs: /api/v1/payment + API-Key).'
    );
  }

  return url;
}

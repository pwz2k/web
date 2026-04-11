import { AvailablePayoutMethods } from '@prisma/client';

/** Simple Icons on jsDelivr — avoids missing files under `/public/company_logos/`. */
const SI = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons/icons/${slug}.svg`;

/** Deposit add-funds only — not stored on `AvailablePayoutMethods` (no DB enum migration). */
export const PAYRAM_DEPOSIT_METHOD = 'PAYRAM' as const;

export type AddFundsMethod = AvailablePayoutMethods | typeof PAYRAM_DEPOSIT_METHOD;

export function depositMethodLogoSrc(method: AddFundsMethod): string {
  if (method === PAYRAM_DEPOSIT_METHOD) {
    return '/company_logos/payram.png';
  }
  return PayoutMethodLogosSrc[method];
}

export const PayoutMethodLogosSrc: Record<
  keyof typeof AvailablePayoutMethods,
  string
> = {
  STRIPE: SI('stripe'),
  PAYPAL: '/company_logos/paypal-logo.svg',
  BTC: SI('bitcoin'),
  ETH: SI('ethereum'),
  LITECOIN: SI('litecoin'),
  // No dedicated USDC glyph in Simple Icons CDN set; Circle is the USDC issuer.
  USDC_ERC_20: SI('circle'),
  CARDANO_ON_ADA_NETWORK: SI('cardano'),
  POLYGON: SI('polygon'),
  XRP: SI('ripple'),
  TETHER: SI('tether'),
  DOGECOIN: SI('dogecoin'),
  VENMO: SI('venmo'),
  ZELLE: SI('zelle'),
};

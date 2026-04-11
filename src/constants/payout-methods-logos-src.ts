import { AvailablePayoutMethods } from '@prisma/client';

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
  STRIPE: '/company_logos/stripe.jpeg',
  PAYPAL: '/company_logos/paypal-logo.svg',
  BTC: '/company_logos/btc.png',
  ETH: '/company_logos/eth.png',
  LITECOIN: '/company_logos/litecoin.png',
  USDC_ERC_20: '/company_logos/usdc_erc_20.png',
  CARDANO_ON_ADA_NETWORK: '/company_logos/cardano_on_ada_network.png',
  POLYGON: '/company_logos/polygon.png',
  XRP: '/company_logos/xrp.png',
  TETHER: '/company_logos/tether.png',
  DOGECOIN: '/company_logos/dogecoin.png',
  VENMO: '/company_logos/vimeo.png',
  ZELLE: '/company_logos/zelle.png',
};

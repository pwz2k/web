import { Client } from 'bitpay-sdk';
import { Environment } from 'bitpay-sdk/dist/Environment';
import { TokenContainer } from 'bitpay-sdk/dist/TokenContainer';

let bitpayClient: ReturnType<typeof Client.createClientByPrivateKey> | null = null;

// Only initialize BitPay client if required environment variables are present
if (process.env.BITPAY_MERCHANT_ID && process.env.BITPAY_PRIVATE_KEY) {
  try {
    const tokenContainer = new TokenContainer();
    tokenContainer.addMerchant(process.env.BITPAY_MERCHANT_ID);

    bitpayClient = Client.createClientByPrivateKey(
      process.env.BITPAY_PRIVATE_KEY,
      tokenContainer,
      process.env.PAYMENT_STATUS === 'LIVE' ? Environment.Prod : Environment.Test
    );
  } catch (error) {
    console.warn('Failed to initialize BitPay client:', error);
  }
} else {
  console.warn('BitPay environment variables not set. BitPay features will be disabled.');
}

export { bitpayClient };

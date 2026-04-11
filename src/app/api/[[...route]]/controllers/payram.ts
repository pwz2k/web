import { currentUser } from '@/lib/auth';
import { createPayramCheckoutUrl } from '@/lib/payram-checkout';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const checkoutSchema = z.object({
  amount: z.number(),
});

const app = new Hono().post(
  '/checkout',
  zValidator('json', checkoutSchema),
  async (c) => {
    const user = await currentUser();

    if (!user || !user?.id) {
      return c.json({ message: 'You are not logged in!' }, 401);
    }

    const { amount } = c.req.valid('json');

    if (!amount) {
      return c.json({ message: 'Amount is required!' }, 400);
    }

    try {
      const amountUsd = amount / 100;
      const url = await createPayramCheckoutUrl({
        amountUsd,
        customerEmail: user.email as string,
        customerId: user.id as string,
      });
      return c.json({ url });
    } catch (error) {
      console.error('Payram checkout error:', error);
      const message =
        error instanceof Error ? error.message : 'Payram checkout failed';
      return c.json({ message }, 502);
    }
  }
);

export default app;

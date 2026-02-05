import { hc } from 'hono/client';

import { AppType } from '@/app/api/[[...route]]/route';

// Use same origin in browser so API calls work on any port (e.g. 3000 or 3001)
const baseUrl =
  typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL ?? '';

export const client = hc<AppType>(baseUrl);

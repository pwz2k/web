import { hc } from 'hono/client';

import { AppType } from '@/app/api/[[...route]]/route';

// Use same origin in browser so API calls work on any port (e.g. 3000 or 3001)
const baseUrl =
  typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL ?? '';

// Always send cookies so auth and session work for protected APIs (comment POST, profile, etc.)
export const client = hc<AppType>(baseUrl, {
  fetch: (input, init) =>
    fetch(input, { ...init, credentials: 'include' }),
});

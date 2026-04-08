'use client';

import { Toaster } from '@/components/ui/sonner';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { QueryProvider } from './query-provider';
import { ReactDayPickerProviders } from './react-day-picker-providers';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchOnWindowFocus={false}
    >      <QueryProvider>
        <ReactDayPickerProviders>
          <Toaster richColors />
          {children}
        </ReactDayPickerProviders>
      </QueryProvider>
    </SessionProvider>
  );
}

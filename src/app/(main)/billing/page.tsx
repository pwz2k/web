'use client';

import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { useGetUserProfile } from '../_api/use-get-user-profile';
import MilestonesCard from '../_components/milestones-card';
import PayoutMethodCard from '../_components/payout-method-card';
import TransactionCard from '../_components/transactions-card';
import { useNewAddFunds } from '../_hooks/use-new-add-funds';
import { useNewRequestAPayout } from '../_hooks/use-new-request-a-payout';
import { useEffect, useState } from 'react';

export default function BillingPage() {
  const {
    data: user,
    isLoading: isUserLoading,
    isError,
    refetch,
    sessionStatus,
  } = useGetUserProfile();

  const { onOpen: onOpenRequestAPayout } = useNewRequestAPayout();
  const { onOpen: onOpenAddFunds } = useNewAddFunds();

  const sessionLoading = sessionStatus === 'loading';
  const profileLoading = sessionStatus === 'authenticated' && isUserLoading;
  
  // Add timeout state to prevent infinite loading
  const [timedOut, setTimedOut] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (sessionLoading || profileLoading) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timer);
    }
  }, [sessionLoading, profileLoading]);

  // If timed out, try to refresh
  if (timedOut && (sessionLoading || profileLoading)) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 px-4 py-8'>
        <p className='text-muted-foreground text-center'>
          Taking too long? Try refreshing the page.
        </p>
        <Button variant='secondary' onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show loading while session is loading or profile is loading
  if (sessionLoading || profileLoading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <Loader2 className='size-12 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 px-4 py-8'>
        <p className='text-muted-foreground text-center'>
          Could not load billing. Please try again.
        </p>
        <Button variant='secondary' onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!user) {
    return notFound();
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <div className='flex flex-col gap-4'>
        <Card className='border border-white/10 bg-white/[0.03] px-4 py-6 backdrop-blur-xl'>
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
            <span className='text-tertiary text-5xl font-black'>
              {formatCurrency(user.balance)}
            </span>
          </CardHeader>
          <CardFooter className='space-x-4'>
            <Button
              onClick={onOpenAddFunds}
              variant='tertiary'
              className='px-8'
            >
              Add Funds
            </Button>
            <Button
              onClick={onOpenRequestAPayout}
              variant='quaternary'
              className='px-8'
            >
              Request payout
            </Button>
          </CardFooter>
        </Card>

        <MilestonesCard />
      </div>
      <div className='flex flex-col gap-4'>
        <TransactionCard />
        <PayoutMethodCard />
      </div>
    </div>
  );
}

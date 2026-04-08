import Header from '@/components/header';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import MainProvider from './_components/main-providers';

/** Auth layout must not use cached RSC from a logged-out prefetch (breaks client nav to /profile). */
export const dynamic = 'force-dynamic';

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const user = await currentUser();
  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <main className='w-full p-4 mx-auto max-w-[4000px]'>
      <Header />
      <MainProvider />
      {children}
    </main>
  );
}

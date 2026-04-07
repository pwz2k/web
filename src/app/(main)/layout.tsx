import Header from '@/components/header';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MainProvider from './_components/main-providers';

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

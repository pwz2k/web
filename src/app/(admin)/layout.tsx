import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { currentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import React from 'react';
import AdminProvider from './_components/admin-providers';
import { AppSidebar } from './_components/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/');
  }

  return (
    <SidebarProvider>
      <AdminProvider />
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 border-b'>
          <div className='flex flex-1 items-center gap-2 px-3'>
            <SidebarTrigger />
          </div>
        </header>
        <main className='p-4'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

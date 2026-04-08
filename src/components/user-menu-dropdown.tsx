'use client';

import { LogoutButton } from '@/app/auth/_components/logout-button';
import { UserRole } from '@prisma/client';
import { ChevronDown, CreditCard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/user-avatar';

export type UserMenuDropdownProps = {
  image?: string | null;
  name?: string | null;
  username?: string | null;
  role: UserRole;
};

export function UserMenuDropdown({
  image,
  name,
  username,
  role,
}: UserMenuDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center gap-2'>
        <UserAvatar src={image} name={name} />
        {username || name}
        <ChevronDown className='size-6 text-white' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/*
          Full load for profile/billing: client-side navigation + SessionProvider often leaves
          `useSession` out of sync with the cookie until refresh; `router.refresh` + soft nav
          still fails on some hosts. Hard assign matches “refresh fixes it”.
        */}
        <DropdownMenuItem
          className='cursor-pointer flex items-center'
          onSelect={(e) => {
            e.preventDefault();
            window.location.assign('/profile');
          }}
        >
          <User className='size-4 mr-2' />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer flex items-center'
          onSelect={(e) => {
            e.preventDefault();
            window.location.assign('/billing');
          }}
        >
          <CreditCard className='size-4 mr-2' />
          Billing
        </DropdownMenuItem>
        {role === UserRole.MODERATOR && (
          <DropdownMenuItem
            asChild
            className='cursor-pointer'
            onSelect={(e) => e.preventDefault()}
          >
            <Link prefetch={false} href='/moderator/posts'>
              Moderator Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {role === UserRole.ADMIN && (
          <DropdownMenuItem
            asChild
            className='cursor-pointer'
            onSelect={(e) => e.preventDefault()}
          >
            <Link prefetch={false} href='/admin'>
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <LogoutButton>
            <span className='flex items-center cursor-pointer'>
              <LogOut className='rotate-180 size-4 mr-2' />
              Sign out
            </span>
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

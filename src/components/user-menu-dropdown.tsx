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
        <DropdownMenuItem
          className='cursor-pointer'
          asChild
          onSelect={(e) => e.preventDefault()}
        >
          <Link href='/profile' className='flex items-center gap-2'>
            <User className='size-4' />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer'
          asChild
          onSelect={(e) => e.preventDefault()}
        >
          <Link href='/billing' className='flex items-center gap-2'>
            <CreditCard className='size-4' />
            Billing
          </Link>
        </DropdownMenuItem>
        {role === UserRole.MODERATOR && (
          <DropdownMenuItem
            className='cursor-pointer'
            asChild
            onSelect={(e) => e.preventDefault()}
          >
            <Link href='/moderator/posts'>Moderator Dashboard</Link>
          </DropdownMenuItem>
        )}
        {role === UserRole.ADMIN && (
          <DropdownMenuItem
            className='cursor-pointer'
            asChild
            onSelect={(e) => e.preventDefault()}
          >
            <Link href='/admin'>Admin Dashboard</Link>
          </DropdownMenuItem>
        )}
        <LogoutButton>
          <DropdownMenuItem className='cursor-pointer'>
            <LogOut className='rotate-180 size-4' />
            Sign out
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

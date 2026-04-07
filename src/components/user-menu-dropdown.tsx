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
        <DropdownMenuItem asChild>
          <Link href='/profile' className='flex items-center cursor-pointer'>
            <User className='size-4 mr-2' />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/billing' className='flex items-center cursor-pointer'>
            <CreditCard className='size-4 mr-2' />
            Billing
          </Link>
        </DropdownMenuItem>
        {role === UserRole.MODERATOR && (
          <DropdownMenuItem asChild>
            <Link href='/moderator/posts' className='cursor-pointer'>
              Moderator Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {role === UserRole.ADMIN && (
          <DropdownMenuItem asChild>
            <Link href='/admin' className='cursor-pointer'>
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

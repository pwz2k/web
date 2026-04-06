'use client';

import { LogoutButton } from '@/app/auth/_components/logout-button';
import { UserRole } from '@prisma/client';
import { ChevronDown, CreditCard, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleNavigation = (path: string) => {
    // Use replace to avoid adding to history stack and force a fresh page load
    router.push(path);
    // Refresh the router cache to ensure fresh data
    router.refresh();
  };

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
          onClick={() => handleNavigation('/profile')}
        >
          <User className='size-4 mr-2' />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => handleNavigation('/billing')}
        >
          <CreditCard className='size-4 mr-2' />
          Billing
        </DropdownMenuItem>
        {role === UserRole.MODERATOR && (
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={() => handleNavigation('/moderator/posts')}
          >
            Moderator Dashboard
          </DropdownMenuItem>
        )}
        {role === UserRole.ADMIN && (
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={() => handleNavigation('/admin')}
          >
            Admin Dashboard
          </DropdownMenuItem>
        )}
        <LogoutButton>
          <DropdownMenuItem className='cursor-pointer'>
            <LogOut className='rotate-180 size-4 mr-2' />
            Sign out
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

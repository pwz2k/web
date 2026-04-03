import { LogoutButton } from '@/app/auth/_components/logout-button';
import { currentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Logo from './logo';
import { buttonVariants } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import UserAvatar from './user-avatar';

const Header = async () => {
  const user = await currentUser();

  return (
    <div className='mx-auto py-4 max-w-[4000px] '>
      <div className='w-full rounded-full border-2 border-white/10 bg-white/[0.03] p-4 px-8 backdrop-blur-xl'>
        <div className='flex items-center justify-between'>
          <Logo />
          <div className=''>
            {!!user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className='flex items-center gap-2'>
                  <UserAvatar src={user.image} name={user.name} />
                  {user.username || user.name}
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
                  {user.role === UserRole.MODERATOR && (
                    <DropdownMenuItem
                      className='cursor-pointer'
                      asChild
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Link href='/moderator/posts'>
                        Moderator Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === UserRole.ADMIN && (
                    <DropdownMenuItem
                      className='cursor-pointer'
                      asChild
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Link href='/admin'>
                        Admin Dashboard
                      </Link>
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
            ) : (
              <div className='flex items-center gap-4'>
                <Link
                  href='/auth/sign-in'
                  className={buttonVariants({
                    variant: 'ghost',
                    className: '!rounded-full',
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href='/auth/sign-up'
                  className={buttonVariants({
                    variant: 'tertiary',
                    className: '!rounded-full',
                  })}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

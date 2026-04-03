import { currentUser } from '@/lib/auth';
import Link from 'next/link';
import Logo from './logo';
import { UserMenuDropdown } from './user-menu-dropdown';
import { buttonVariants } from './ui/button';

const Header = async () => {
  const user = await currentUser();

  return (
    <div className='mx-auto py-4 max-w-[4000px] '>
      <div className='w-full rounded-full border-2 border-white/10 bg-white/[0.03] p-4 px-8 backdrop-blur-xl'>
        <div className='flex items-center justify-between'>
          <Logo />
          <div className=''>
            {!!user ? (
              <UserMenuDropdown
                image={user.image}
                name={user.name}
                username={user.username}
                role={user.role}
              />
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

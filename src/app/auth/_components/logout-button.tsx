'use client';

import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = async () => {
    // Sign out without redirect, then manually redirect to avoid localhost issue
    await signOut({ redirect: false });
    // Manually redirect to the home page on the current domain
    window.location.href = '/';
  };

  return (
    <span onClick={onClick} className='w-full cursor-pointer'>
      {children}
    </span>
  );
};

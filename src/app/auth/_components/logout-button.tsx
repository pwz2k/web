'use client';

import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = async () => {
    // redirect: false so we control the redirect; server might use NEXTAUTH_URL (localhost) otherwise
    await signOut({ redirect: false });
    window.location.href = '/';
  };

  return (
    <span onClick={onClick} className='cursor-pointer'>
      {children}
    </span>
  );
};

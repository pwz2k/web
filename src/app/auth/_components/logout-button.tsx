'use client';

import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = async () => {
    // Use current origin so logout always redirects to this site's home (avoids localhost on production)
    const callbackUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
    await signOut({ callbackUrl, redirect: true });
  };

  return (
    <span onClick={onClick} className='cursor-pointer'>
      {children}
    </span>
  );
};

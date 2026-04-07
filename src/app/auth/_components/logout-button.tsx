'use client';

import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = () => {
    // Use the current origin to ensure proper redirect
    const callbackUrl = window.location.origin;
    signOut({ callbackUrl });
  };

  return (
    <span onClick={onClick} className='w-full cursor-pointer'>
      {children}
    </span>
  );
};

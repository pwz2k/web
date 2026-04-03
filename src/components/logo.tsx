import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

type LogoProps = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href?: React.ComponentProps<typeof Link>['href'];
};

const Logo = ({ className, href = '/', ...props }: LogoProps) => {
  return (
    <Link
      href={href}
      className={cn('inline-flex shrink-0 items-center', className)}
      {...props}
    >
      <Image
        src='/images/pyp6-logo.png'
        alt='pyp6'
        width={250}
        height={100}
        className='h-9 w-auto sm:h-10'
        priority
      />
    </Link>
  );
};

export default Logo;

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
        src='/images/pyp6-logo.jpg'
        alt='pyp6'
        width={1024}
        height={585}
        className='h-9 w-auto sm:h-10'
        priority
      />
    </Link>
  );
};

export default Logo;

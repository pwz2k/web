import type { Metadata } from 'next';
import Link from 'next/link';
import { PrivacyContent } from './privacy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for pyp6.com and the CAMMJ Service.',
};

export default function PrivacyPage() {
  return (
    <article className='mx-auto max-w-3xl px-4 py-8 md:py-12'>
      <div className='mb-8 space-y-2 border-b border-white/10 pb-8'>
        <p className='text-sm text-muted-foreground'>
          <Link href='/' className='text-tertiary hover:underline'>
            Home
          </Link>
          <span className='mx-2 text-white/30'>/</span>
          Privacy
        </p>
        <h1 className='text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
          Privacy Policy
        </h1>
      </div>
      <div className='text-sm leading-relaxed text-muted-foreground md:text-base'>
        <PrivacyContent />
      </div>
    </article>
  );
}

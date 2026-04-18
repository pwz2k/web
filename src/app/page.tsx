import Header from '@/components/header';
import LeftSideGrid from './(public)/_components/left-side-grid';
import MainGrid from './(public)/_components/main-grid';
import RightSideGrid from './(public)/_components/right-side-grid';
import { PostsProvider } from './(public)/_hooks/post-context';
import { SwiperProvider } from './(public)/_hooks/swiper-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'PYP6',
  description: 'Rating site that allows users to submit photos of themselves to be rated by strangers on a scale of 1 to 10.',
  openGraph: {
    title: 'PYP6',
    description: 'Rating site that allows users to submit photos of themselves to be rated by strangers on a scale of 1 to 10.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/default-og.png`,
        width: 1200,
        height: 630,
        alt: 'PYP6 Default Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PYP6',
    description: 'Rating site that allows users to submit photos of themselves to be rated by strangers on a scale of 1 to 10.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/default-og.png`],
  },
};

export default function HomePage() {
  return (
    <main className='mx-auto w-full max-w-[4000px] p-4'>
      <Header />
      <SwiperProvider>
        <PostsProvider>
          <div className='grid grid-cols-1 xl:grid-cols-5'>
            <div className='order-2 xl:order-1'>
              <LeftSideGrid />
            </div>
            <div className='order-1 overflow-x-hidden lg:col-span-3 xl:order-2'>
              <MainGrid />
            </div>
            <div className='order-3'>
              <RightSideGrid />
            </div>
          </div>
        </PostsProvider>
      </SwiperProvider>
    </main>
  );
}

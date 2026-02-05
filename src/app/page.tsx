import Header from '@/components/header';
import LeftSideGrid from './(public)/_components/left-side-grid';
import MainGrid from './(public)/_components/main-grid';
import RightSideGrid from './(public)/_components/right-side-grid';
import { PostsProvider } from './(public)/_hooks/post-context';
import { SwiperProvider } from './(public)/_hooks/swiper-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Uploto',
  description: 'Discover creative content on Uploto.',
  openGraph: {
    title: 'Uploto',
    description: 'Discover creative content on Uploto.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/default-og.png`,
        width: 1200,
        height: 630,
        alt: 'Uploto Default Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uploto',
    description: 'Discover creative content on Uploto.',
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
            <div className='hidden xl:block'>
              <LeftSideGrid />
            </div>
            <div className='overflow-x-hidden lg:col-span-3'>
              <MainGrid />
            </div>
            <div className='xl:hidden'>
              <LeftSideGrid />
            </div>
            <div>
              <RightSideGrid />
            </div>
          </div>
        </PostsProvider>
      </SwiperProvider>
    </main>
  );
}

import { Metadata } from 'next';
import LeftSideGrid from './_components/left-side-grid';
import MainGrid from './_components/main-grid';
import RightSideGrid from './_components/right-side-grid';
import { PostsProvider } from './_hooks/post-context';
import { SwiperProvider } from './_hooks/swiper-context';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
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

export default function Home() {
  return (
    <SwiperProvider>
      <PostsProvider>
        <div className='grid grid-cols-1 xl:grid-cols-5'>
          <div className='hidden xl:block'>
            <LeftSideGrid />
          </div>
          <div className='lg:col-span-3 overflow-x-hidden'>
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
  );
}

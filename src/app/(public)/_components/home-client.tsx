'use client';

import { PostsProvider } from '../_hooks/post-context';
import { SwiperProvider } from '../_hooks/swiper-context';
import LeftSideGrid from './left-side-grid';
import MainGrid from './main-grid';
import RightSideGrid from './right-side-grid';

export default function HomeClient() {
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

'use client';

import { useGetPosts } from '../../_api/use-get-posts';
import { PostsTable } from './_components/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function PostsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPosts({ page, limit: 50 });

  const posts = data?.data ?? [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <>loading...</>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Posts Management</h1>
      </div>
      <div>
        <PostsTable posts={posts} />
      </div>
      
      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className='h-4 w-4' />
            Previous
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}

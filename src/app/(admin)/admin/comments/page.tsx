'use client';

import { useGetComments } from '../../_api/use-get-comments';
import { columns } from './_components/colums';
import { CommentsTable } from './_components/comments-table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function CommentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetComments({ page, limit: 50 });

  const comments = data?.data ?? [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-2xl font-bold mb-4'>Manage Comments</h1>
      <CommentsTable
        columns={columns}
        data={
          comments?.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            commenter: comment.user.name,
            postId: comment.postId,
          })) ?? []
        }
      />
      
      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-4 mt-4'>
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

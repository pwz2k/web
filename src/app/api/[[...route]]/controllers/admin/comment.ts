import { db } from '@/lib/db';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      })
    ),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '50', 10);
      const skip = (pageNum - 1) * limitNum;

      // Use Promise.all for parallel queries
      const [comments, total] = await Promise.all([
        db.comment.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            postId: true,
            userId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          skip,
          take: limitNum,
        }),
        db.comment.count(),
      ]);

      return c.json({
        data: comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  )
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json(
          {
            success: false,
            message: 'Comment id is required',
          },
          400
        );
      }

      const comment = await db.comment.delete({
        where: {
          id,
        },
      });

      return c.json({ success: true, data: comment });
    }
  );

export default app;

import { db } from '@/lib/db';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono()
  .get('/', async (c) => {
    // Use Promise.all for parallel queries
    const comments = await db.comment.findMany({
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
    });

    return c.json({ data: comments });
  })
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

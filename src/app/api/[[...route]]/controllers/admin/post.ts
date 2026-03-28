import { db } from '@/lib/db';
import { ApprovalStatus } from '@prisma/client';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono()
  .get('/', async (c) => {
    // Use include to fetch all fields for backward compatibility with existing components
    const posts = await db.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true,
      },
    });

    return c.json({ data: posts });
  })
  .get(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json({ error: 'Missing id!' }, 400);
      }

      const post = await db.post.findUnique({
        where: {
          id,
        },
        include: {
          creator: true,
        },
      });

      return c.json({ data: post });
    }
  )
  .patch(
    '/:id',
    zValidator('json', z.object({ approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() })),
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const data = c.req.valid('json');
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json({ error: 'Missing id!' }, 400);
      }

      // Check if post exists
      const existingPost = await db.post.findUnique({
        where: { id },
      });

      if (!existingPost) {
        return c.json({ error: 'Post not found!' }, 404);
      }

      const post = await db.post.update({
        where: {
          id,
        },
        data,
      });

      return c.json({ data: post });
    }
  )
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json({ error: 'Missing id!' }, 400);
      }

      await db.$transaction(async (tx) => {
        // Delete tips for this post
        await tx.tip.deleteMany({
          where: { postId: id },
        });

        // Delete votes for this post
        await tx.vote.deleteMany({
          where: { postId: id },
        });

        // Delete comments on this post
        await tx.comment.deleteMany({
          where: { postId: id },
        });

        // Delete reports on this post (first get IDs for FAQ deletion)
        const reports = await tx.reports.findMany({
          where: { postId: id },
          select: { id: true },
        });

        if (reports.length > 0) {
          const reportIds = reports.map((r) => r.id);

          // Delete FAQs for these reports
          await tx.fAQ.deleteMany({
            where: { reportId: { in: reportIds } },
          });

          // Delete report update logs
          await tx.reportUpdateLog.deleteMany({
            where: { reportId: { in: reportIds } },
          });

          // Delete the reports
          await tx.reports.deleteMany({
            where: { id: { in: reportIds } },
          });
        }

        // Finally delete the post
        await tx.post.delete({
          where: { id },
        });
      });

      return c.json({ success: true });
    }
  );

export default app;

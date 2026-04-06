import { db } from '@/lib/db';
import { adminUpdateUserSchema } from '@/schemas/admin';
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

      // Use select to only fetch needed fields for better performance
      const [users, total] = await Promise.all([
        db.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            role: true,
            gender: true,
            dateOfBirth: true,
            location: true,
            bio: true,
            sexualOrientation: true,
            banned: true,
            suspended: true,
            createdAt: true,
          },
          skip,
          take: limitNum,
        }),
        db.user.count(),
      ]);

      return c.json({
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  )
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

      const user = await db.user.findUnique({
        where: {
          id,
        },
      });

      return c.json({ data: user });
    }
  )
  .patch(
    '/:id',
    zValidator('json', adminUpdateUserSchema),
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const data = c.req.valid('json');
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json({ error: 'Missing userId!' }, 400);
      }

      const user = await db.user.update({
        where: {
          id,
        },
        data,
      });

      return c.json({ data: user });
    }
  )
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const { id } = c.req.valid('param');

      if (!id) {
        return c.json({ error: 'Missing userId!' }, 400);
      }

      try {
        // Delete all related records in a transaction to ensure data integrity
        await db.$transaction(async (tx) => {
          // First, get all posts by this user to handle post-related deletions
          const userPosts = await tx.post.findMany({
            where: { creatorId: id },
            select: { id: true },
          });
          const postIds = userPosts.map((p) => p.id);

          // Get all reports on user's posts (need to get IDs before deleting)
          const reportsOnUserPosts = await tx.reports.findMany({
            where: { postId: { in: postIds } },
            select: { id: true },
          });
          const reportIdsOnPosts = reportsOnUserPosts.map((r) => r.id);

          // Get all reports created by the user
          const reportsByUser = await tx.reports.findMany({
            where: { userId: id },
            select: { id: true },
          });
          const reportIdsByUser = reportsByUser.map((r) => r.id);

          // Combine all report IDs
          const allReportIds = [...reportIdsOnPosts, ...reportIdsByUser];

          // Delete FAQs for all related reports FIRST (before deleting reports)
          if (allReportIds.length > 0) {
            await tx.fAQ.deleteMany({
              where: { reportId: { in: allReportIds } },
            });
          }

          // Delete ReportUpdateLogs for reports on user's posts
          if (reportIdsOnPosts.length > 0) {
            await tx.reportUpdateLog.deleteMany({
              where: { reportId: { in: reportIdsOnPosts } },
            });
          }

          // Delete ReportUpdateLogs created by user
          await tx.reportUpdateLog.deleteMany({
            where: { userId: id },
          });

          // Delete PostImpressions by user
          await tx.postImpression.deleteMany({
            where: { userId: id },
          });

          // Delete Notifications
          await tx.notification.deleteMany({
            where: { userId: id },
          });

          // Delete UserMilestones
          await tx.userMilestone.deleteMany({
            where: { userId: id },
          });

          // Delete PayoutMethods
          await tx.payoutMethod.deleteMany({
            where: { userId: id },
          });

          // Delete UserActivityLogs
          await tx.userActivityLog.deleteMany({
            where: { userId: id },
          });

          // Delete Tips where user is tipper
          await tx.tip.deleteMany({
            where: { userId: id },
          });

          // Delete Tips where user is creator (receiver of tips)
          await tx.tip.deleteMany({
            where: { creatorId: id },
          });

          // Delete Transactions
          await tx.transactions.deleteMany({
            where: { userId: id },
          });

          // Delete Reports created by user (FAQs already deleted above)
          await tx.reports.deleteMany({
            where: { userId: id },
          });

          // Delete Comments by user
          await tx.comment.deleteMany({
            where: { userId: id },
          });

          // Delete Votes by user
          await tx.vote.deleteMany({
            where: { voterId: id },
          });

          // Handle posts and their related data
          if (postIds.length > 0) {
            // Delete post impressions for user's posts
            await tx.postImpression.deleteMany({
              where: { postId: { in: postIds } },
            });

            // Delete tips for user's posts
            await tx.tip.deleteMany({
              where: { postId: { in: postIds } },
            });

            // Delete votes for user's posts
            await tx.vote.deleteMany({
              where: { postId: { in: postIds } },
            });

            // Delete comments on user's posts
            await tx.comment.deleteMany({
              where: { postId: { in: postIds } },
            });

            // Delete reports on user's posts (FAQs and logs already deleted above)
            await tx.reports.deleteMany({
              where: { postId: { in: postIds } },
            });

            // Delete the posts
            await tx.post.deleteMany({
              where: { creatorId: id },
            });
          }

          // Delete Account (OAuth accounts)
          await tx.account.deleteMany({
            where: { userId: id },
          });

          // Finally delete the user
          await tx.user.delete({
            where: { id },
          });
        });

        return c.json({ success: true });
      } catch (error) {
        console.error('Error deleting user:', error);
        return c.json({ error: 'Failed to delete user. There may be related records that need to be removed first.' }, 500);
      }
    }
  );

export default app;

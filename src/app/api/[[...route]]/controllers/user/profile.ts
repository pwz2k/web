import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  updateUserPicSchema,
  updateUserSchema,
  updateUserSettingsSchema,
} from '@/schemas';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { unstable_cache } from 'next/cache';

/** Expensive: scans aggregates per creator — cached briefly to keep profile loads fast. */
const computePercentileForUser = async (userId: string, userAvgRating: number) => {
  const creatorsWithRatings = await db.post.groupBy({
    by: ['creatorId'],
    where: {
      NOT: {
        creatorId: userId,
      },
    },
    _avg: {
      weightedRating: true,
    },
  });

  const totalCreators = creatorsWithRatings.length + 1;
  if (totalCreators <= 1) return null;

  const creatorsWithLowerRating = creatorsWithRatings.filter(
    (creator) => (creator._avg.weightedRating || 0) < userAvgRating
  ).length;

  return Math.round((creatorsWithLowerRating / (totalCreators - 1)) * 100);
};

const app = new Hono()
  .get('/', async (c) => {
    try {
      const user = await currentUser();
      const userId = user?.id;
      if (!user || !userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      /** Percentile runs a heavy `groupBy` over creators — off by default. Set PROFILE_INCLUDE_PERCENTILE=true to enable. */
      const includePercentile =
        process.env.PROFILE_INCLUDE_PERCENTILE === '1' ||
        process.env.PROFILE_INCLUDE_PERCENTILE === 'true';
      const forceSkipPercentile =
        process.env.SKIP_PROFILE_PERCENTILE === '1' ||
        process.env.SKIP_PROFILE_PERCENTILE === 'true';

      // Run independent queries in parallel (was sequential — added noticeable latency).
      const [dbUser, receivedVotes, userPostsStats] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          include: {
            PayoutMethod: true,
            _count: {
              select: {
                post: true,
              },
            },
          },
        }),
        db.vote.count({
          where: {
            post: {
              creatorId: userId,
            },
          },
        }),
        db.post.aggregate({
          where: { creatorId: userId },
          _avg: {
            weightedRating: true,
          },
          _count: true,
        }),
      ]);

      if (!dbUser) {
        return c.json({ message: 'User not found' }, 404);
      }

      const userAvgRating = userPostsStats._avg.weightedRating || 0;

      let percentileStat: number | null = null;
      if (
        includePercentile &&
        !forceSkipPercentile &&
        userPostsStats._count > 0 &&
        userAvgRating > 0
      ) {
        const avgKey = String(Math.round(userAvgRating * 1e6));
        percentileStat = await unstable_cache(
          () => computePercentileForUser(userId, userAvgRating),
          ['profile-percentile', userId, avgKey],
          { revalidate: 180 }
        )();
      }

      return c.json({
        data: {
          ...dbUser,
          stats: {
            receivedVotes,
            averageRating: userAvgRating,
            percentileStat,
          },
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes("Can't reach database server") || err?.code === 'P1001') {
        return c.json(
          { message: 'Database connection failed. Please check your database configuration.' },
          503
        );
      }
      return c.json({ message: 'Internal server error' }, 500);
    }
  })

  .patch('/', zValidator('json', updateUserSchema), async (c) => {
    const user = await currentUser();

    if (!user || !user?.id) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const data = c.req.valid('json');

    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data,
    });

    return c.json({ data: updatedUser });
  })
  .patch('/pic', zValidator('json', updateUserPicSchema), async (c) => {
    const user = await currentUser();

    if (!user || !user?.id) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const data = c.req.valid('json');

    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data,
    });

    return c.json({ success: true, data: updatedUser });
  })
  .patch(
    '/settings',
    zValidator('json', updateUserSettingsSchema),
    async (c) => {
      const user = await currentUser();

      if (!user || !user?.id) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const data = c.req.valid('json');

      const updatedUser = await db.user.update({
        where: {
          id: user.id,
        },
        data,
      });

      return c.json({ success: true, data: updatedUser });
    }
  );

export default app;

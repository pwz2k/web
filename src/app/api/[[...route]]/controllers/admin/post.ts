import { db } from '@/lib/db';
import { NotificationHandlers } from '@/lib/notifications/handlers';
import { managePostStatusSchema } from '@/schemas/admin';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const ADMIN_POSTS_CACHE_KEY = 'admin:posts:list';
const ADMIN_POSTS_CACHE_TTL_MS = 30_000; // 30s

type CacheEntry<T> = { value: T; expiresAt: number };
const memCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = memCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function fetchAdminPosts() {
  return db.post.findMany({
    include: {
      creator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

const app = new Hono()
  .get('/', async (c) => {
    const cached = getCached<Awaited<ReturnType<typeof fetchAdminPosts>>>(ADMIN_POSTS_CACHE_KEY);
    if (cached) return c.json({ data: cached });

    const posts = await fetchAdminPosts();
    setCached(ADMIN_POSTS_CACHE_KEY, posts, ADMIN_POSTS_CACHE_TTL_MS);
    return c.json({ data: posts });
  })
  .patch(
    '/:id',
    zValidator('json', managePostStatusSchema),
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      if (!id) {
        return c.json(
          {
            success: false,
            message: 'Post id is required',
          },
          400
        );
      }

      const post = await db.post.findUnique({
        where: {
          id,
        },
        include: {
          creator: true,
        },
      });

      if (!post) {
        return c.json(
          {
            success: false,
            message: 'Post not found',
          },
          404
        );
      }

      await db.post.update({
        where: {
          id,
        },
        data,
      });

      memCache.delete(ADMIN_POSTS_CACHE_KEY);

      if (post.creator.sent_email_notifications) {
        await NotificationHandlers.sendPostStatusNotification(post.id);
      }

      return c.json(
        {
          success: true,
          message: 'Post Updated successfully',
        },
        200
      );
    }
  );

export default app;

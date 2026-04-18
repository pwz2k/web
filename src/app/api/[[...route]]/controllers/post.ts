/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PostSchema } from '@/schemas';
import { zValidator } from '@hono/zod-validator';
import { Gender } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import { Hono } from 'hono';
import { cookies } from 'next/headers';
import { z } from 'zod';

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

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z
          .string()
          .regex(/^\d+$/)
          .transform(Number)
          .default('1')
          .refine((n) => n > 0, {
            message: 'Page must be greater than 0',
          }),
        preference: z.nativeEnum(Gender).optional(),
        id: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const { page, preference, id } = c.req.valid('query');
        const limit = 10;
        const skip = (page - 1) * limit;

        // Get user from auth
        const user = await currentUser();

      // Build base filter - show APPROVED and PENDING (so existing/moderated posts appear)
      const baseFilter: any = {
        approvalStatus: { in: ['APPROVED', 'PENDING'] },
      };

      // Add preference filter if provided
      if (preference) {
        baseFilter.creator = { gender: preference };
      }

      // Track user history for both auth and non-auth users
      let viewedPostIds: string[] = [];
      const impressionMap: Map<string, Date> = new Map();

      // Get previously seen post IDs from session storage
      const sessionStore = cookies();
      const seenPostsKey = user ? `seenPosts_${user.id}` : 'seenPosts_anon';
      const seenPostsCookie = sessionStore.get(seenPostsKey);
      let previouslySeenPosts: string[] = [];

      if (seenPostsCookie) {
        try {
          previouslySeenPosts = JSON.parse(seenPostsCookie.value);
          if (!Array.isArray(previouslySeenPosts)) {
            previouslySeenPosts = [];
          }
          // Cap cookie-driven exclusions so `notIn` + request stays small (avoids DB timeouts → nginx 502).
          previouslySeenPosts = previouslySeenPosts.slice(0, 200);
        } catch (e) {
          console.error('Error parsing seenPosts cookie:', e);
          previouslySeenPosts = [];
        }
      }

      // Handle auth user specific data fetching (parallelize to cut one RTT)
      if (user) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Do not load all vote IDs into memory / `notIn` — heavy accounts can exceed query limits and time out.
        const userImpressions = await db.postImpression.findMany({
          where: {
            userId: user.id,
            viewedAt: { gte: thirtyDaysAgo },
          },
          select: { postId: true, viewedAt: true },
          orderBy: { viewedAt: 'desc' },
          take: 50,
        });

        userImpressions.forEach((imp) => {
          impressionMap.set(imp.postId, new Date(imp.viewedAt));
        });

        viewedPostIds = userImpressions.map((imp) => imp.postId);
      } else {
        // For anonymous users, get viewed posts from cookies
        const viewedPostsCookie = cookies().get('viewedPosts');

        if (viewedPostsCookie) {
          try {
            viewedPostIds = JSON.parse(viewedPostsCookie.value);
            if (!Array.isArray(viewedPostIds)) {
              viewedPostIds = [];
            } else {
              viewedPostIds = viewedPostIds.slice(0, 200);
            }
          } catch (e) {
            console.error('Error parsing viewedPosts cookie:', e);
            viewedPostIds = [];
          }
        }
      }

      // Cookie-based “already shown” IDs only (votes excluded via relation below).
      const excludePostIds = [...new Set(previouslySeenPosts)];

      // Build auth filter with exclusions
      const authFilter: Record<string, unknown> = {
        ...baseFilter,
        ...(excludePostIds.length > 0 && { id: { notIn: excludePostIds } }),
        ...(user && { creatorId: { not: user.id } }),
        ...(user && {
          NOT: {
            vote: {
              some: { voterId: user.id },
            },
          },
        }),
      };

      const postListSelect = {
        id: true,
        caption: true,
        tags: true,
        image: true,
        approvalStatus: true,
        averageRating: true,
        totalVotes: true,
        weightedRating: true,
        ratingDistribution: true,
        impressions: true,
        sharesCount: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: { id: true, gender: true, name: true, image: true, username: true },
        },
        _count: { select: { vote: true } },
        vote: {
          select: {
            id: true,
            voterId: true,
            ipAddress: true,
            voter: { select: { id: true, name: true, image: true } },
          },
          take: 3,
        },
      } as const;

      // Deep link + main feed in parallel (same RTT budget as one findMany)
      const fetchMultiplier = 5;
      const candidatePromise = db.post.findMany({
        where: authFilter,
        select: postListSelect,
        take: Math.min(limit * fetchMultiplier, 100),
        skip,
        orderBy: [
          { createdAt: 'desc' },
          { weightedRating: 'desc' },
        ],
      });

      let requestedPost: any = null;
      const [requestedPostResult, candidatePosts] = await Promise.all([
        id
          ? db.post.findFirst({
              where: { AND: [{ id }, { creatorId: { not: user?.id } }] },
              include: {
                creator: {
                  select: {
                    id: true,
                    gender: true,
                    name: true,
                    image: true,
                    username: true,
                  },
                },
                _count: { select: { vote: true } },
                vote: {
                  include: {
                    voter: { select: { id: true, name: true, image: true } },
                  },
                  take: 3,
                },
              },
            })
          : Promise.resolve(null),
        candidatePromise,
      ]);
      requestedPost = requestedPostResult;

      // If no unseen posts are available, get random posts
      let randomPosts: any[] = [];
      if (candidatePosts.length === 0) {
        // Try progressively looser filters: gender+exclude votes → gender only → all genders+exclude votes → all posts.
        // Preference alone can match zero rows (no creators with that gender, or null gender in DB).
        const makeRandomFilter = (includeGender: boolean, excludeVotes: boolean) =>
          ({
            approvalStatus: { in: ['APPROVED', 'PENDING'] },
            ...(includeGender && preference ? { creator: { gender: preference } } : {}),
            ...(user && { creatorId: { not: user.id } }),
            ...(excludeVotes &&
              user && {
                NOT: {
                  vote: { some: { voterId: user.id } },
                },
              }),
          }) as any;

        const f1 = makeRandomFilter(true, true);
        let randomFilter: any = f1;
        let totalPostCount = await db.post.count({ where: f1 });

        // If strict filter matches nothing, try remaining combinations in one parallel batch (fewer RTTs than 3 sequential counts).
        if (totalPostCount === 0) {
          const f2 = makeRandomFilter(true, false);
          const f3 = makeRandomFilter(false, true);
          const f4 = makeRandomFilter(false, false);
          const [c2, c3, c4] = await Promise.all([
            db.post.count({ where: f2 }),
            db.post.count({ where: f3 }),
            db.post.count({ where: f4 }),
          ]);
          const ordered: [any, number][] = [
            [f2, c2],
            [f3, c3],
            [f4, c4],
          ];
          const hit = ordered.find(([, c]) => c > 0);
          if (hit) {
            randomFilter = hit[0];
            totalPostCount = hit[1];
          }
        }

        if (totalPostCount > 0 && randomFilter) {
          // Calculate how many posts to skip to get a random slice
          // Using a random offset for true randomization
          const maxSkip = Math.max(0, totalPostCount - limit);
          const randomSkip =
            maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0;

          randomPosts = await db.post.findMany({
            where: randomFilter as any,
            select: {
              id: true,
              caption: true,
              tags: true,
              image: true,
              approvalStatus: true,
              averageRating: true,
              totalVotes: true,
              weightedRating: true,
              ratingDistribution: true,
              impressions: true,
              sharesCount: true,
              creatorId: true,
              createdAt: true,
              updatedAt: true,
              creator: {
                select: { id: true, gender: true, name: true, image: true, username: true },
              },
              _count: { select: { vote: true } },
              vote: {
                select: {
                  id: true,
                  voterId: true,
                  ipAddress: true,
                  voter: { select: { id: true, name: true, image: true } },
                },
                take: 3,
              },
            },
            take: limit * 2,
            skip: randomSkip,
          });

          // Shuffle the posts for true randomness
          randomPosts = randomPosts.sort(() => Math.random() - 0.5);
        }
      }

      // Combine candidate posts with random posts (if needed)
      let allCandidates = [...candidatePosts, ...randomPosts];

      // `?id=` deep link: main query can return nothing (seen/voted everything) but post still exists
      if (allCandidates.length === 0 && requestedPost) {
        allCandidates = [requestedPost];
      }

      // If the viewer is also the main/only uploader, excluding `creatorId: user.id` leaves zero rows.
      // Fall back to their own posts so the home feed is not empty after login (common for brand accounts).
      if (allCandidates.length === 0 && user && page === 1) {
        const ownPosts = await db.post.findMany({
          where: {
            approvalStatus: { in: ['APPROVED', 'PENDING'] },
            creatorId: user.id,
          },
          select: postListSelect,
          take: Math.min(limit * fetchMultiplier, 100),
          orderBy: [{ createdAt: 'desc' }],
        });
        if (ownPosts.length > 0) {
          allCandidates = ownPosts;
        }
      }

      // If still no posts, return 200
      if (allCandidates.length === 0) {
        return c.json(
          {
            message: 'No posts available',
            data: [],
            hasMore: false,
            nextPage: page,
          },
          200
        );
      }

      // Process and score posts
      const processedPosts = allCandidates.map((post) => {
        // Calculate a recency score (higher = less recently viewed)
        let recencyScore = 100; // Default high score for never viewed
        let viewedRecently = false;
        let daysSinceLastView = 30; // Default to 30 days if never viewed

        if (impressionMap.has(post.id)) {
          const lastViewed = impressionMap.get(post.id)!;
          daysSinceLastView = Math.floor(
            (new Date().getTime() - lastViewed.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Exponential decay function - score increases as days pass
          recencyScore = Math.min(
            100,
            Math.floor(20 * Math.log(daysSinceLastView + 1))
          );

          // Mark as recently viewed if seen in the last 3 days
          if (daysSinceLastView < 3) {
            viewedRecently = true;
          }
        } else if (viewedPostIds.includes(post.id)) {
          // For anonymous users
          recencyScore = 25;
          viewedRecently = true;
          daysSinceLastView = 1; // Assume recently viewed
        }

        // Add significant randomness factor (0-60)
        // Higher randomness for random fallback posts to ensure variety
        const randomFactor = Math.random() * 60;

        // Weight quality and recency
        const qualityWeight = (post._count.vote || 0) / 5; // Up to 20 points for 100 votes

        // Assign higher scores to posts not viewed recently
        const recencyBonus = daysSinceLastView * 2; // 2 points per day since last view

        return {
          ...post,
          recencyScore,
          viewedRecently,
          daysSinceLastView,
          // Combine scores with significant randomness
          combinedScore:
            recencyScore + qualityWeight + randomFactor + recencyBonus,
        };
      });

      // Apply a Fisher-Yates shuffle for true randomization
      const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      // Group posts by recency (recently viewed vs not)
      const recentlyViewed = processedPosts.filter((p) => p.viewedRecently);
      const notRecentlyViewed = processedPosts.filter((p) => !p.viewedRecently);

      // Shuffle both groups separately
      shuffle(recentlyViewed);
      shuffle(notRecentlyViewed);

      // Sort not recently viewed by score, but keep shuffle order within score bands
      notRecentlyViewed.sort((a, b) => {
        // Round scores to nearest 10 to create score bands
        const aBand = Math.floor(a.combinedScore / 10);
        const bBand = Math.floor(b.combinedScore / 10);

        if (aBand === bBand) return 0; // Keep shuffle order within bands
        return bBand - aBand; // Higher bands first
      });

      // For recently viewed posts, prioritize those seen longest ago
      recentlyViewed.sort((a, b) => b.daysSinceLastView - a.daysSinceLastView);

      // Prioritize not recently viewed, then add recently viewed at the end
      const sortedPosts = [...notRecentlyViewed, ...recentlyViewed];

      // Create final posts array enforcing creator diversity
      const finalPosts: any[] = [];
      const seenCreators = new Set<string>();
      const lastThreeCreators: string[] = [];

      // Add requested post first if specified
      if (requestedPost) {
        finalPosts.push(requestedPost);
        seenCreators.add(requestedPost.creatorId);
        lastThreeCreators.push(requestedPost.creatorId);
      }

      // Select posts ensuring creator diversity
      for (const post of sortedPosts) {
        // Skip if already included
        if (finalPosts.some((p) => p.id === post.id)) continue;

        // Skip if this creator appears in the last 2 posts (prevents back-to-back)
        if (lastThreeCreators.slice(-2).includes(post.creatorId)) continue;

        // Skip if this would make 3 posts from same creator in the final set
        const creatorPostCount = finalPosts.filter(
          (p) => p.creatorId === post.creatorId
        ).length;
        if (creatorPostCount >= 2) continue;

        // Add post
        finalPosts.push(post);
        lastThreeCreators.push(post.creatorId);

        // Keep lastThreeCreators to the last 3 entries
        if (lastThreeCreators.length > 3) {
          lastThreeCreators.shift();
        }

        // Break when we have enough
        if (finalPosts.length >= limit) break;
      }

      // If we don't have enough posts yet, try again with less strict rules
      if (finalPosts.length < limit) {
        for (const post of sortedPosts) {
          // Skip if already included
          if (finalPosts.some((p) => p.id === post.id)) continue;

          // Only avoid immediate back-to-back posts from same creator
          if (lastThreeCreators.slice(-1)[0] === post.creatorId) continue;

          finalPosts.push(post);
          lastThreeCreators.push(post.creatorId);

          if (lastThreeCreators.length > 3) {
            lastThreeCreators.shift();
          }

          if (finalPosts.length >= limit) break;
        }
      }

      // If still less than limit, add any remaining posts
      if (finalPosts.length < limit) {
        for (const post of sortedPosts) {
          // Skip if already included
          if (finalPosts.some((p) => p.id === post.id)) continue;

          finalPosts.push(post);

          if (finalPosts.length >= limit) break;
        }
      }

      // Determine if this was a fallback to random posts
      const usedRandomFallback =
        candidatePosts.length === 0 && randomPosts.length > 0;

      // Update seen posts list for future queries
      // Only update if we're not in random fallback mode
      if (!usedRandomFallback) {
        const newlySeenPostIds = finalPosts.map((post) => post.id);
        const allSeenPosts = [
          ...newlySeenPostIds,
          ...previouslySeenPosts,
        ].slice(0, 100);

        // Store the updated seen posts in the session
        cookies().set({
          name: seenPostsKey,
          value: JSON.stringify(allSeenPosts),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60, // 1 hour for session storage
          sameSite: 'lax',
          path: '/',
        });
      }

      // Update impressions in the background (avoid slowing down feed response)
      const newlySeenPostIds = finalPosts.map((post) => post.id);
      if (newlySeenPostIds.length > 0) {
        void db
          .$transaction(async (tx) => {
            await tx.post.updateMany({
              where: { id: { in: newlySeenPostIds } },
              data: { impressions: { increment: 1 } },
            });

            if (user) {
              const now = new Date();
              await tx.postImpression.createMany({
                data: newlySeenPostIds.map((postId) => ({
                  postId,
                  userId: user.id,
                  viewedAt: now,
                })),
                skipDuplicates: true,
              });
            }
          })
          .catch((err) => console.error('Error updating impressions:', err));
      }

      // Update cookie for anonymous users
      if (!user) {
        const updatedViewedPosts = [
          ...newlySeenPostIds,
          ...viewedPostIds,
        ].slice(0, 100); // Limit size

        cookies().set({
          name: 'viewedPosts',
          value: JSON.stringify(updatedViewedPosts),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          sameSite: 'lax',
          path: '/',
        });
      }

      // Clean up posts before returning
      const cleanPosts = finalPosts.map((post) => {
        // Use destructuring to remove scoring fields
        const {
          recencyScore,
          combinedScore,
          viewedRecently,
          daysSinceLastView,
          ...cleanPost
        } = post;
        return cleanPost;
      });

      // Avoid an extra COUNT query (big perf win on remote DB)
      const hasMore = usedRandomFallback ? false : finalPosts.length >= limit;

        return c.json({
          data: cleanPosts,
          hasMore,
          nextPage: hasMore ? page + 1 : 1,
          isRandomized: usedRandomFallback,
        });
        } catch (error: unknown) {
          console.error('Error fetching posts:', error);
          const err = error as { message?: string; code?: string };
          if (err?.message?.includes("Can't reach database server") || err?.code === 'P1001') {
          return c.json(
            { message: 'Database connection failed. Please check your database configuration.', data: [], hasMore: false, nextPage: 1 },
            503
          );
        }
        return c.json({ message: 'Internal server error', data: [], hasMore: false, nextPage: 1 }, 500);
      }
    }
  )
  .get('/top-creators-today', async (c) => {
    try {
      const cacheKey = `top-creators-today:${new Date()
        .toISOString()
        .slice(0, 10)}`;
      const cached = getCached<unknown>(cacheKey);
      if (cached) return c.json(cached);

      // Get the start and end of the current day
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      // Perf: sample the top N posts for today (avoid scanning all today's posts)
      const todayPosts = await db.post.findMany({
        where: {
          AND: [
            {
              updatedAt: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            {
              approvalStatus: { in: ['APPROVED', 'PENDING'] },
            },
          ],
        },
        select: {
          id: true,
          caption: true,
          image: true,
          impressions: true,
          averageRating: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              isVerified: true,
              activityScore: true,
              votingPattern: true,
              gender: true,
            },
          },
          _count: {
            select: {
              vote: true,
              comment: true,
            },
          },
          vote: {
            select: {
              weight: true,
              rating: true,
            },
            where: {
              isOutlier: false,
            },
          },
        },
        orderBy: [{ impressions: 'desc' }, { updatedAt: 'desc' }],
        take: 50,
      });

    // Calculate engagement score for each post using weighted algorithm
    const postsWithScores = todayPosts.map((post) => {
      // Use vote weights from the voting algorithm
      const weightedVotes = post.vote.reduce(
        (acc, vote) => acc + vote.rating * vote.weight,
        0
      );

      const totalVoteWeight =
        post.vote.reduce((acc, vote) => acc + vote.weight, 0) || 1; // Avoid division by zero

      // Calculate weighted average rating
      const weightedAverageRating =
        post.vote.length > 0
          ? weightedVotes / totalVoteWeight
          : post.averageRating;

      // Creator reputation factor based on verification status and activity score
      const creatorFactor = post.creator.isVerified ? 1.2 : 1.0;
      const activityBonus = Math.min(post.creator.activityScore * 0.001, 0.5);

      // Calculate enhanced engagement score
      const voteWeight = 2; // Each vote is worth 2 points
      const commentWeight = 3; // Each comment is worth 3 points
      const impressionWeight = 0.5; // Each impression is worth 0.5 points
      const ratingMultiplier = 5; // Multiply rating by 5 to give it more weight

      // Use vote weight to calculate vote score (incorporating vote quality)
      const voteScore =
        post._count.vote *
        voteWeight *
        (totalVoteWeight / post._count.vote || 1);
      const commentScore = post._count.comment * commentWeight;
      const impressionScore = post.impressions * impressionWeight;
      const ratingScore = weightedAverageRating * ratingMultiplier;

      // Combined score considers weighted factors
      const engagementScore =
        (voteScore + commentScore + impressionScore + ratingScore) *
        (creatorFactor + activityBonus);

      return {
        ...post,
        engagementScore,
        weightedAverageRating,
        creatorId: post.creator.id,
        creatorWeight: creatorFactor + activityBonus,
      };
    });

    // Sort posts by engagement score
    const topPosts = postsWithScores
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 3);

    // If we have exactly 3 top posts today, return them
    if (topPosts.length === 3) {
      const payload = {
        data: topPosts.map((post) => ({
          id: post.id,
          caption: post.caption,
          image: post.image,
          creator: post.creator,
          engagementScore: post.engagementScore,
          weightedRating: post.weightedAverageRating,
          totalVotes: post._count.vote,
          totalComments: post._count.comment,
          impressions: post.impressions,
        })),
        message: "Top 3 posts based on today's engagement and vote quality",
      };
      setCached(cacheKey, payload, 60_000);
      return c.json(payload);
    }

    // If we have fewer than 3, get additional recent top posts
    if (topPosts.length < 3) {
      // Get post IDs to exclude from the supplemental query
      const existingPostIds = topPosts.map((post) => post.id);

      // Get recent top posts from previous days, using weightedRating
      // which already incorporates vote quality from the voting algorithm
      const recentPosts = await db.post.findMany({
        where: {
          AND: [
            {
              approvalStatus: { in: ['APPROVED', 'PENDING'] },
            },
            {
              id: {
                notIn: existingPostIds,
              },
            },
            // Exclude posts from today
            {
              createdAt: {
                lt: todayStart,
              },
            },
          ],
        },
        select: {
          id: true,
          caption: true,
          image: true,
          impressions: true,
          averageRating: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              isVerified: true,
              activityScore: true,
              votingPattern: true,
              gender: true,
            },
          },
          _count: {
            select: {
              vote: true,
              comment: true,
            },
          },
          vote: {
            select: {
              weight: true,
              rating: true,
            },
            where: {
              isOutlier: false,
            },
          },
        },
        orderBy: [{ weightedRating: 'desc' }, { createdAt: 'desc' }],
        take: 20, // Take more posts to ensure we have quality options
      });

      // Calculate engagement scores for recent posts using the same algorithm
      const recentPostsWithScores = recentPosts.map((post) => {
        // Use vote weights from the voting algorithm
        const weightedVotes = post.vote.reduce(
          (acc, vote) => acc + vote.rating * vote.weight,
          0
        );

        const totalVoteWeight =
          post.vote.reduce((acc, vote) => acc + vote.weight, 0) || 1;

        // Calculate weighted average rating
        const weightedAverageRating =
          post.vote.length > 0
            ? weightedVotes / totalVoteWeight
            : post.averageRating;

        // Creator reputation factor
        const creatorFactor = post.creator.isVerified ? 1.2 : 1.0;
        const activityBonus = Math.min(post.creator.activityScore * 0.001, 0.5);

        // Apply recency penalty to older content
        const daysSinceCreation = Math.max(
          1,
          Math.ceil(
            (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
        const recencyFactor = Math.max(
          0.5,
          1 - Math.log10(daysSinceCreation) * 0.1
        );

        // Calculate enhanced engagement score with recency penalty
        const voteWeight = 2;
        const commentWeight = 3;
        const impressionWeight = 0.5;
        const ratingMultiplier = 5;

        const voteScore =
          post._count.vote *
          voteWeight *
          (totalVoteWeight / post._count.vote || 1);
        const commentScore = post._count.comment * commentWeight;
        const impressionScore = post.impressions * impressionWeight;
        const ratingScore = weightedAverageRating * ratingMultiplier;

        const engagementScore =
          (voteScore + commentScore + impressionScore + ratingScore) *
          (creatorFactor + activityBonus) *
          recencyFactor;

        return {
          ...post,
          engagementScore,
          weightedAverageRating,
          recencyFactor,
          creatorWeight: creatorFactor + activityBonus,
        };
      });

      // Sort by engagement score and take needed number
      const topRecentPosts = recentPostsWithScores
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 3 - topPosts.length);

      // Combine today's top posts with supplemental posts
      const combinedTopPosts = [...topPosts, ...topRecentPosts];

      // Format posts for response
      const formattedPosts = combinedTopPosts.map((post) => ({
        id: post.id,
        caption: post.caption,
        image: post.image,
        creator: post.creator,
        engagementScore: post.engagementScore,
        weightedRating: post.weightedAverageRating || post.averageRating,
        totalVotes: post._count.vote,
        totalComments: post._count.comment,
        impressions: post.impressions,
        recent: post.hasOwnProperty('recencyFactor') ? true : false,
      }));

      const payload = {
        data: formattedPosts,
        message:
          topPosts.length === 0
            ? 'No top posts today. Showing recent top posts based on weighted engagement.'
            : `Showing ${topPosts.length} top post(s) from today and ${topRecentPosts.length} recent top post(s).`,
      };
      setCached(cacheKey, payload, 60_000);
      return c.json(payload);
    }

      // This code should never be reached, but included for safety
      const payload = {
        data: topPosts.map((post) => ({
          id: post.id,
          caption: post.caption,
          image: post.image,
          creator: post.creator,
          engagementScore: post.engagementScore,
          weightedRating: post.weightedAverageRating,
          totalVotes: post._count.vote,
          totalComments: post._count.comment,
          impressions: post.impressions,
        })),
        message: 'Top posts based on engagement and vote quality',
      };
      setCached(cacheKey, payload, 60_000);
      return c.json(payload);
    } catch (error: unknown) {
      console.error('Error fetching top creators:', error);
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes("Can't reach database server") || err?.code === 'P1001') {
        return c.json(
          { message: 'Database connection failed. Please check your database configuration.', data: [] },
          503
        );
      }
      return c.json({ message: 'Internal server error', data: [] }, 500);
    }
  })
  .get(
    '/:id',
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const postId = c.req.param('id');

      if (!postId) {
        return c.json({ error: 'Missing id!' }, 400);
      }

      const cacheKey = `post:${postId}`;
      const cached = getCached<unknown>(cacheKey);
      if (cached) return c.json({ success: true, data: cached }, 200);

      const post = await db.post.findUnique({
        where: {
          id: postId,
        },
        select: {
          id: true,
          caption: true,
          tags: true,
          image: true,
          approvalStatus: true,
          averageRating: true,
          totalVotes: true,
          weightedRating: true,
          ratingDistribution: true,
          impressions: true,
          sharesCount: true,
          creatorId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              vote: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              gender: true,
            },
          },
          vote: {
            select: {
              id: true,
              rating: true,
              weight: true,
              voterId: true,
              ipAddress: true,
              createdAt: true,
              voter: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      if (!post) {
        return c.json({ message: 'Post not found' }, 404);
      }

      setCached(cacheKey, post, 10_000);
      return c.json({ success: true, data: post }, 200);
    }
  )
  .post('/', zValidator('json', PostSchema), async (c) => {
    const data = c.req.valid('json');

    const user = await currentUser();

    if (!user || !user?.id) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const post = await db.post.create({
      data: {
        creatorId: user.id,

        ...data,
      },
    });

    return c.json(
      {
        success: true,
        data: post,
      },
      201
    );
  })
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().optional() })),
    async (c) => {
      const postId = c.req.param('id');

      if (!postId) {
        return c.json({ error: 'Missing id!' }, 400);
      }

      const user = await currentUser();

      if (!user || !user?.id) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const post = await db.post.findUnique({
        where: {
          id: postId,
        },
      });

      if (!post) {
        return c.json({ message: 'Post not found' }, 404);
      }

      if (post.creatorId !== user.id) {
        return c.json(
          { message: 'You are not authorized to delete this post' },
          401
        );
      }

      await db.post.delete({
        where: {
          id: postId,
        },
      });

      return c.json(
        { success: true, message: 'Post deleted Successfully!' },
        200
      );
    }
  );

export default app;

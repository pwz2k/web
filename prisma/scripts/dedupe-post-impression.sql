-- Run BEFORE `prisma db push` / migrate if @@unique([postId, userId]) fails on duplicate rows.
-- Keeps one impression per (postId, userId) for logged-in users (earliest viewedAt, then id).

DELETE FROM "PostImpression" AS pi
WHERE pi."userId" IS NOT NULL
  AND pi.id NOT IN (
    SELECT DISTINCT ON ("postId", "userId") id
    FROM "PostImpression"
    WHERE "userId" IS NOT NULL
    ORDER BY "postId", "userId", "viewedAt" ASC, id ASC
  );

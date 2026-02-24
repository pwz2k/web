/**
 * Migrate Vote.id from Int (sequence) to String (cuid) so the app no longer needs
 * sequence permissions. Run once: node prisma/scripts/vote-id-to-cuid.mjs
 * Uses DATABASE_URL from .env (app user must own the Vote table).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../../.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const prisma = new PrismaClient();

const steps = [
  `ALTER TABLE "Vote" ADD COLUMN IF NOT EXISTS "id_new" TEXT`,
  `UPDATE "Vote" SET "id_new" = 'v-' || "id"::text WHERE "id_new" IS NULL`,
  `ALTER TABLE "Vote" ALTER COLUMN "id_new" SET NOT NULL`,
  `ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_pkey"`,
  `ALTER TABLE "Vote" DROP COLUMN IF EXISTS "id"`,
  `ALTER TABLE "Vote" RENAME COLUMN "id_new" TO "id"`,
  `ALTER TABLE "Vote" ADD PRIMARY KEY ("id")`,
];

async function main() {
  console.log('Migrating Vote.id from Int to String (cuid)...');
  for (let i = 0; i < steps.length; i++) {
    try {
      await prisma.$executeRawUnsafe(steps[i]);
      console.log('OK', i + 1, '/', steps.length);
    } catch (e) {
      if (e.meta?.code === '42701') {
        console.log('Skip', i + 1, '(already applied)');
        continue;
      }
      if (e.meta?.code === '42P16') {
        console.log('Skip', i + 1, '(constraint exists)');
        continue;
      }
      console.error('Step', i + 1, 'failed:', e.meta?.message || e.message);
      throw e;
    }
  }
  console.log('Done. Vote.id is now String (cuid). Run: npx prisma generate');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Grant sequence ownership to app user (fixes "permission denied for sequence Vote_id_seq").
 * Run from project root. Uses DATABASE_ADMIN_URL if set (superuser), else DATABASE_URL.
 *
 * With admin URL in .env:
 *   DATABASE_ADMIN_URL="postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db"
 * Then: node prisma/scripts/grant-sequences.mjs
 *
 * Or one-shot:
 *   DATABASE_ADMIN_URL="postgresql://postgres:adminpass@host:5433/myapp_db" node prisma/scripts/grant-sequences.mjs
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

const adminUrl = process.env.DATABASE_ADMIN_URL;
const appUser = process.env.APP_DB_USER || 'app_admin_user';

if (!adminUrl || adminUrl.trim() === '') {
  console.error('');
  console.error('DATABASE_ADMIN_URL is not set. This script must run as a PostgreSQL superuser.');
  console.error('');
  console.error('Option A - Add to .env then run again:');
  console.error('  DATABASE_ADMIN_URL="postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db"');
  console.error('  (Get the postgres/admin password from Hostinger: Databases → PostgreSQL → your DB)');
  console.error('');
  console.error('Option B - Fix in Hostinger without .env:');
  console.error('  1. Log in to Hostinger → Databases → open your PostgreSQL / myapp_db');
  console.error('  2. Open the SQL or phpPgAdmin tab');
  console.error('  3. Paste and run the contents of: prisma/scripts/grant-sequences-hostinger.sql');
  console.error('');
  process.exit(1);
}

const url = adminUrl;

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const sequences = await prisma.$queryRawUnsafe(
    `SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname = 'public'`
  );

  if (!Array.isArray(sequences) || sequences.length === 0) {
    console.log('No sequences found in public schema.');
    return;
  }

  for (const row of sequences) {
    const { schemaname, sequencename } = row;
    const sql = `ALTER SEQUENCE "${schemaname}"."${sequencename}" OWNER TO ${appUser}`;
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', sequencename);
    } catch (e) {
      console.error('Failed:', sequencename, e.message);
      if (e.message && e.message.includes('must be owner')) {
        console.error('\nUse a superuser URL: set DATABASE_ADMIN_URL in .env to your postgres admin connection string, then run again.');
      }
      throw e;
    }
  }

  console.log('\nDone. Sequence ownership granted to', appUser);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

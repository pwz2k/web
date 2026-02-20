-- Run this as a PostgreSQL superuser (e.g. postgres or admin) on myapp_db.
-- This grants ownership of all tables in public schema to app_admin_user
-- so Prisma (as app_admin_user) can run db push and create indexes.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('ALTER TABLE %I OWNER TO app_admin_user', r.tablename);
  END LOOP;
END $$;

-- Also sequences (for serial/bigserial columns)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('ALTER SEQUENCE %I OWNER TO app_admin_user', r.sequencename);
  END LOOP;
END $$;

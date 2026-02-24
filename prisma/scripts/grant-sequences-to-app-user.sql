-- Run as PostgreSQL SUPERUSER (e.g. postgres or Hostinger admin) on myapp_db.
-- Fixes: "permission denied for sequence Vote_id_seq" (and any other sequence).
-- Run this in Hostinger's database SQL console (you are superuser there).

-- Give ownership of all sequences to app_admin_user
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO app_admin_user', r.schemaname, r.sequencename);
  END LOOP;
END $$;

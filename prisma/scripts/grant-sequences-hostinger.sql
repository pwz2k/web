-- Paste this into Hostinger's SQL / phpPgAdmin and run it once.
-- Fixes: "permission denied for sequence Vote_id_seq" so voting works.

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

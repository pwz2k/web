-- Add PAYRAM to AvailablePayoutMethods. Run as PostgreSQL superuser OR as the
-- owner of type "AvailablePayoutMethods" (often the user that created the DB).
--
-- If `npx prisma db push` fails with: must be owner of type "AvailablePayoutMethods",
-- run this script with elevated credentials, then run `db push` again.
--
-- Example:
--   PGPASSWORD=... psql -h HOST -p PORT -U postgres -d myapp_db -f prisma/scripts/add-payram-enum-value.sql

ALTER TYPE "AvailablePayoutMethods" ADD VALUE 'PAYRAM';

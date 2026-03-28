# Database scripts

## grant-ownership-to-app-user.sql

Makes `app_admin_user` the owner of all tables and sequences in `public` so Prisma can run `db push` and create indexes.

**You must run this as a PostgreSQL superuser** (e.g. `postgres`), not as `app_admin_user`.

### Option 1: Hostinger panel

1. In Hostinger, open your database (e.g. phpPgAdmin or “Manage” for PostgreSQL).
2. Log in as the admin/superuser (often `postgres` or the user that created the DB).
3. Select database `myapp_db`.
4. Open a SQL query window and paste the contents of `grant-ownership-to-app-user.sql`.
5. Execute the query.

### Option 2: Command line (if you have superuser credentials)

```bash
# Replace POSTGRES_PASSWORD with the actual postgres/admin password
PGPASSWORD=POSTGRES_PASSWORD psql -h 72.61.8.11 -p 5433 -U postgres -d myapp_db -f prisma/scripts/grant-ownership-to-app-user.sql
```

Then from the app directory:

```bash
npx prisma generate
npx prisma db push
```

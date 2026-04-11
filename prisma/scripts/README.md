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

---

## add-payram-enum-value.sql

Adds the `PAYRAM` value to the `AvailablePayoutMethods` enum. **Required** if `npx prisma db push` fails with `must be owner of type "AvailablePayoutMethods"`. Use the **postgres (or admin) user**, not `app_admin_user`.

### Option 1: Hostinger database panel

1. Open your PostgreSQL database in Hostinger (phpPgAdmin / SQL / “Manage”).
2. Log in as **admin / postgres** (not the app user).
3. Select database **`myapp_db`**.
4. Run the SQL from `add-payram-enum-value.sql` (or paste `ALTER TYPE "AvailablePayoutMethods" ADD VALUE 'PAYRAM';`).

### Option 2: `psql` from your laptop or the VPS

Install `psql` if needed (`sudo apt install postgresql-client` on Ubuntu). Use the **admin password** from Hostinger (the same user that can run owner-level SQL, usually `postgres`):

```bash
cd /var/www/web   # or your app path

PGPASSWORD='YOUR_POSTGRES_ADMIN_PASSWORD' psql \
  -h 72.61.8.11 -p 5433 -U postgres -d myapp_db \
  -f prisma/scripts/add-payram-enum-value.sql
```

One-liner without a file:

```bash
PGPASSWORD='YOUR_POSTGRES_ADMIN_PASSWORD' psql \
  -h 72.61.8.11 -p 5433 -U postgres -d myapp_db \
  -c 'ALTER TYPE "AvailablePayoutMethods" ADD VALUE '\''PAYRAM'\'';'
```

If your admin user is not named `postgres`, replace `-U postgres` with that username.

### After the enum exists

```bash
cd /var/www/web
npx prisma db push
```

If `ADD VALUE` errors because `PAYRAM` already exists, skip the script and only run `npx prisma db push`.

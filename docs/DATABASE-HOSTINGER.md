# Hostinger PostgreSQL connection

Use these values for the app when the database is on Hostinger.

| Setting    | Value                  |
|-----------|-------------------------|
| Server    | srv1279053.hstgr.cloud  |
| Host      | 72.61.8.11              |
| Port      | 5433                    |
| Database  | myapp_db                |
| User      | app_admin_user         |
| PostgreSQL| 17.8                    |

### If `psql -U postgres` says “password authentication failed”

Hostinger’s **managed** PostgreSQL often does **not** allow the `postgres` role over the network, or the password is only available inside **hPanel** (not the same as `app_admin_user`). Do **not** rely on `sudo -u postgres psql` on your VPS unless Postgres is actually installed **on that VPS**; your app uses host `72.61.8.11` (remote DB), so fixes must use **hPanel SQL / phpPgAdmin** or credentials Hostinger lists for an **admin** user, or open a ticket for them to run owner-only SQL.

For enum changes (e.g. adding `PAYRAM`), use the **SQL / Query** tab in hPanel (see “Prisma: must be owner of type …” below) if remote `postgres` login is not available.

## .env

Add or update in `.env`:

```env
# Hostinger PostgreSQL (no SSL – local/private network; add ?sslmode=require if your host requires SSL)
DATABASE_URL="postgresql://app_admin_user:YOUR_PASSWORD_HERE@72.61.8.11:5433/myapp_db"
```

Replace `YOUR_PASSWORD_HERE` with the actual password for `app_admin_user`.

If Hostinger requires SSL:

```env
DATABASE_URL="postgresql://app_admin_user:YOUR_PASSWORD_HERE@72.61.8.11:5433/myapp_db?sslmode=require"
```

## Connect and apply schema

After setting `DATABASE_URL` in `.env`:

```bash
# Test connection
npx prisma db pull

# If you use migrations (schema already in repo)
npx prisma migrate deploy

# Or push current schema (no migrations)
npx prisma db push
```

Then regenerate the client:

```bash
npx prisma generate
```

## Prisma: `must be owner of type "AvailablePayoutMethods"` (enum changes)

`app_admin_user` usually **cannot** `ALTER TYPE` to add enum values. Someone with **owner or superuser** rights must run owner-level SQL, or use Hostinger’s admin SQL tool with an owner account.

**Payram in “Add funds”:** the app treats **Payram as a deposit-only option** (`PAYRAM` in the UI) **without** adding `PAYRAM` to the PostgreSQL enum, so **`npx prisma db push` does not need a new enum value for Payram**. If you still see this error for another schema change, use an admin user or support as above.

If you previously added `PAYRAM` to the enum manually, `db push` should align; if you never could, the current code does not require it for Payram checkout.

## Permission denied for sequence (e.g. Vote_id_seq)

If the app returns **500** when voting and logs show:

`permission denied for sequence Vote_id_seq`

the DB user needs to own the sequences. You must run the fix as **superuser** (Hostinger’s admin session or your postgres admin account).

### Option 1: Run from project with Prisma (recommended)

1. Get the **postgres (or admin) connection string** from Hostinger for `myapp_db`.
2. In project root, add to `.env` (only for this one-time run; remove after if you like):

   ```env
   DATABASE_ADMIN_URL="postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db"
   ```

3. Run:

   ```bash
   npm run db:grant-sequences
   ```

   Or without adding to `.env`:

   ```bash
   DATABASE_ADMIN_URL="postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db" npm run db:grant-sequences
   ```

4. Voting should work. You can delete `DATABASE_ADMIN_URL` from `.env` afterward.

### Option 2: Run in Hostinger SQL console

1. Log in to **Hostinger** → **Databases** → open **PostgreSQL** / **myapp_db**.
2. Open **phpPgAdmin** or the **SQL** / **Query** tab (whatever Hostinger provides).
3. Paste and run this (one block):

```sql
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
```

4. Confirm it runs without errors. Voting should then work.

### Option 3: On the server (PostgreSQL running on the same server)

If PostgreSQL is on the **same machine** as your app (e.g. Hostinger VPS at `/var/www/web`):

1. SSH into the server:
   ```bash
   ssh root@72.61.8.11
   ```
2. Go to the app directory and run the fix:
   ```bash
   cd /var/www/web
   sudo -u postgres psql -d myapp_db -f prisma/scripts/grant-sequences-hostinger.sql
   ```
   If Postgres uses port 5433 on the same host:
   ```bash
   sudo -u postgres psql -p 5433 -d myapp_db -f prisma/scripts/grant-sequences-hostinger.sql
   ```
   Or use the helper script (tries common options):
   ```bash
   cd /var/www/web && bash prisma/scripts/run-grant-sequences-on-server.sh
   ```
3. Ensure the SQL file is on the server (e.g. `git pull` or upload `prisma/scripts/grant-sequences-hostinger.sql`).

### Option 4: From your machine with psql (superuser)

If you have the **postgres (or admin) password** and `psql` installed locally:

```bash
psql "postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db" -f prisma/scripts/grant-sequences-hostinger.sql
```

Or run the full grant script (all tables + sequences):

```bash
psql "postgresql://postgres:YOUR_ADMIN_PASSWORD@72.61.8.11:5433/myapp_db" -f prisma/scripts/grant-ownership-to-app-user.sql
```

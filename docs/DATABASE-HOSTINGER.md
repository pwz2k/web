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

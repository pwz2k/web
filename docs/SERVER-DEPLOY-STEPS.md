# Server deployment steps (Hostinger VPS + Hostinger DB)

Use this checklist when deploying or updating the app on your server (e.g. Hostinger VPS at `/var/www/web`).

---

## 1. SSH into the server

```bash
ssh root@72.61.8.11
# or: ssh your_user@srv1279053.hstgr.cloud
```

---

## 2. Go to the app directory

```bash
cd /var/www/web
```

(If the app is elsewhere, use that path.)

---

## 3. Update code

**If you use Git:**

```bash
git fetch origin
git pull origin main
```

**If you upload files:**  
Upload the latest project (or at least updated files) to `/var/www/web` (e.g. via SFTP/rsync).

---

## 4. Update `.env` on the server

Edit the server’s `.env` so it matches your current setup (especially the **Hostinger database**):

```bash
nano .env
```

**Required for Hostinger DB:**

```env
# Hostinger PostgreSQL (password URL-encoded if it contains & → %26)
DATABASE_URL="postgresql://app_admin_user:YOUR_DB_PASSWORD@72.61.8.11:5433/myapp_db"

# NextAuth
AUTH_SECRET="your-existing-or-new-secret"

# App URL (your domain)
NEXT_PUBLIC_APP_URL="https://pyp6.com"

# Production
NODE_ENV="production"
```

- Replace `YOUR_DB_PASSWORD` with the real `app_admin_user` password. If the password has `&`, use `%26` in the URL (e.g. `x4YgrK%26fxMBPe`).
- Keep or generate a strong `AUTH_SECRET` (e.g. `openssl rand -base64 32`).
- Save and exit (Ctrl+O, Enter, Ctrl+X in nano).

---

## 5. Install deps, Prisma, and build

```bash
cd /var/www/web

npm install --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 6. Restart the app (PM2)

```bash
pm2 restart web
# or, if the process name is different:
# pm2 restart all
```

**If PM2 isn’t set up yet:**

```bash
pm2 start npm --name "web" -- start
pm2 save
pm2 startup
# Run the command that pm2 startup prints (usually with sudo)
```

---

## 7. Quick checks

```bash
pm2 status
pm2 logs web --lines 20
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000
```

- `pm2 status`: app should be **online**.
- `pm2 logs web`: no repeated errors.
- `curl`: should return **200**.

---

## Summary

| Step | Command / action |
|------|-------------------|
| 1 | SSH to server |
| 2 | `cd /var/www/web` |
| 3 | `git pull origin main` (or upload code) |
| 4 | Update `.env` (DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL, NODE_ENV) |
| 5 | `npm install --legacy-peer-deps` → `npx prisma generate` → `npm run build` |
| 6 | `pm2 restart web` |
| 7 | `pm2 status` and `pm2 logs web` |

---

**Note:** You do **not** need to run `prisma db push` on the server if the database schema is already applied (e.g. you ran it locally). Only run it on the server if you are applying schema changes from there.

---

## Fix voting 500 (permission denied for sequence Vote_id_seq)

If voting returns 500 and logs show `permission denied for sequence Vote_id_seq`, run the sequence fix **once** on the server as the postgres superuser.

**If PostgreSQL is on the same server:**

```bash
cd /var/www/web
sudo -u postgres psql -d myapp_db -f prisma/scripts/grant-sequences-hostinger.sql
```

If your Postgres listens on port 5433:

```bash
sudo -u postgres psql -p 5433 -d myapp_db -f prisma/scripts/grant-sequences-hostinger.sql
```

Then restart the app: `pm2 restart web`. See also `docs/DATABASE-HOSTINGER.md` (Options 1–4).

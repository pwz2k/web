# Deploy Uploto (Next.js) on Ubuntu Server

This guide covers deploying the application on an Ubuntu server (20.04 LTS or 22.04 LTS) using either **Node.js + PM2** or **Docker**. The app uses a **DigitalOcean PostgreSQL** database (or optional local Postgres).

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Clone and install](#2-clone-and-install)
3. [Environment variables](#3-environment-variables)
4. [Database](#4-database)
5. [Option A: Deploy with Node.js and PM2](#5-option-a-deploy-with-nodejs-and-pm2)
6. [Option B: Deploy with Docker](#6-option-b-deploy-with-docker)
7. [Nginx reverse proxy (recommended)](#7-nginx-reverse-proxy-recommended)
8. [SSL with Let's Encrypt](#8-ssl-with-lets-encrypt)
9. [Useful commands](#9-useful-commands)

---

## 1. Prerequisites

On your Ubuntu server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v20.x.x
npm -v    # 10.x.x

# Optional: Install Docker (for Option B)
# curl -fsSL https://get.docker.com | sudo sh
# sudo usermod -aG docker $USER
```

---

## 2. Clone and install

```bash
# Create app directory
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git uploto
cd uploto

# Or upload the project via scp/rsync, then:
# cd /var/www/uploto

# Install dependencies
npm install --legacy-peer-deps

# Copy CA certificate if using DigitalOcean PostgreSQL
# (Upload ca-certificate.crt to the server and keep path in .env)
```

---

## 3. Environment variables

Create a production `.env` file (never commit this):

```bash
nano .env
```

**Required variables:**

```env
# Database (DigitalOcean PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full&sslrootcert=/var/www/uploto/ca-certificate.crt"

# NextAuth – use a strong random secret in production
AUTH_SECRET="GENERATE_A_STRONG_SECRET_HERE"

# Your app URL (use your domain or server IP)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Production
NODE_ENV="production"
```

**Generate a secure AUTH_SECRET:**

```bash
openssl rand -base64 32
```

**Optional (for payments, emails, etc.):**

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `BITPAY_MERCHANT_ID`, `BITPAY_PRIVATE_KEY`
- `PAYMENT_STATUS` (e.g. `LIVE` or `TEST`)

**Important:** For DigitalOcean DB, upload `ca-certificate.crt` to the server and set `sslrootcert` in `DATABASE_URL` to its full path (e.g. `/var/www/uploto/ca-certificate.crt`).

---

## 4. Database

### Using DigitalOcean PostgreSQL

1. In DigitalOcean, create a managed PostgreSQL database.
2. Add your **server’s public IP** to the database **Trusted sources**.
3. Copy the connection string and CA certificate.
4. Put the CA cert on the server (e.g. `/var/www/uploto/ca-certificate.crt`) and set `DATABASE_URL` and `sslrootcert` as above.
5. Run migrations / push schema (see step 5 or 6 below).

### Using local PostgreSQL (e.g. Docker)

If you run Postgres on the same server, set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
```

Then create the DB and run Prisma (see next sections).

---

## 5. Option A: Deploy with Node.js and PM2

### Build and run

```bash
cd /var/www/uploto

# Generate Prisma client
npx prisma generate

# Optional: push schema (if DB is empty or you use db push)
npx prisma db push --accept-data-loss   # only if starting fresh

# Build for production
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Install PM2 globally
sudo npm install -g pm2

# Start the app with PM2
pm2 start npm --name "uploto" -- start

# Save PM2 process list so it restarts on reboot
pm2 save
pm2 startup
# Run the command that pm2 startup prints (usually with sudo)
```

### PM2 useful commands

```bash
pm2 status          # List processes
pm2 logs uploto     # View logs
pm2 restart uploto  # Restart app
pm2 stop uploto     # Stop app
```

### Updating the app

```bash
cd /var/www/uploto
git pull
npm install --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 restart uploto
```

---

## 6. Option B: Deploy with Docker

### Production Dockerfile

Create `Dockerfile.prod` in the project root:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps
RUN npx prisma generate
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
EXPOSE 3000
CMD ["npm", "run", "start"]
```

(To use a smaller image later, you can enable `output: 'standalone'` in `next.config.mjs` and use a multi-stage build with `node server.js`.)

### Build and run with Docker

```bash
cd /var/www/uploto

# Build image
docker build -f Dockerfile.prod -t uploto:latest .

# Run (replace with your real .env or use --env-file)
docker run -d \
  --name uploto \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/ca-certificate.crt:/app/ca-certificate.crt:ro \
  --restart unless-stopped \
  uploto:latest
```

For Docker Compose, add a `docker-compose.prod.yml` that uses the production image and your `.env`.

---

## 7. Nginx reverse proxy (recommended)

Serving the app behind Nginx gives you a single entry point, optional static caching, and a place to add SSL.

### Install Nginx

```bash
sudo apt install -y nginx
```

### Site configuration

```bash
sudo nano /etc/nginx/sites-available/uploto
```

**HTTP (replace `yourdomain.com` and port if different):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/uploto /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Set `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com` (or `http://` if you don’t use SSL yet).

---

## 8. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will adjust your Nginx config for HTTPS. Set `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com` and restart the app (e.g. `pm2 restart uploto` or restart the Docker container).

---

## 9. Useful commands

| Task              | Command |
|-------------------|--------|
| View app logs     | `pm2 logs uploto` or `docker logs -f uploto` |
| Restart app       | `pm2 restart uploto` or `docker restart uploto` |
| Prisma push       | `npx prisma db push` |
| Prisma migrate    | `npx prisma migrate deploy` |
| Regenerate client | `npx prisma generate` |
| Rebuild           | `NODE_OPTIONS="--max-old-space-size=4096" npm run build` |

---

## Checklist

- [ ] Ubuntu server with Node 20 (or Docker) installed
- [ ] Repository cloned (or code uploaded) under e.g. `/var/www/uploto`
- [ ] `.env` created with `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV=production`
- [ ] CA certificate on server and `sslrootcert` in `DATABASE_URL` (for DigitalOcean DB)
- [ ] Database reachable (IP allowlisted on DigitalOcean if needed)
- [ ] `npm run build` succeeds
- [ ] App running (PM2 or Docker) on port 3000
- [ ] Nginx proxying to the app (optional but recommended)
- [ ] SSL enabled (optional; Certbot)
- [ ] `NEXT_PUBLIC_APP_URL` matches the URL users use (http or https)

---

For issues, check:

- App logs: `pm2 logs uploto` or `docker logs uploto`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- Database: `npx prisma db pull` or connect with `psql` to verify connectivity

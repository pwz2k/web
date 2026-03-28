#!/usr/bin/env bash
# Run this ON THE SERVER where PostgreSQL is running (e.g. after: ssh root@72.61.8.11).
# Fixes "permission denied for sequence Vote_id_seq" so voting works.
# Usage (from app directory on server):
#   cd /var/www/web && bash prisma/scripts/run-grant-sequences-on-server.sh
# Or with explicit postgres connection:
#   PGPASSWORD=your_postgres_password psql -h 127.0.0.1 -p 5433 -U postgres -d myapp_db -f prisma/scripts/grant-sequences-hostinger.sql

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/grant-sequences-hostinger.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Not found: $SQL_FILE"
  exit 1
fi

# If postgres is local and you have sudo access to postgres user:
if command -v psql &>/dev/null; then
  if sudo -u postgres psql -d myapp_db -f "$SQL_FILE" 2>/dev/null; then
    echo "Done. Sequence ownership granted to app_admin_user."
    exit 0
  fi
  # Try with port 5433 (common when postgres runs on non-default port)
  if sudo -u postgres psql -p 5433 -d myapp_db -f "$SQL_FILE" 2>/dev/null; then
    echo "Done. Sequence ownership granted to app_admin_user."
    exit 0
  fi
fi

# Otherwise run manually (paste the commands below)
echo "Run the SQL as postgres superuser. Examples:"
echo ""
echo "  # If postgres user can connect locally:"
echo "  sudo -u postgres psql -d myapp_db -f $SQL_FILE"
echo ""
echo "  # Or with host/port/password (set PGPASSWORD or use .pgpass):"
echo "  psql -h 127.0.0.1 -p 5433 -U postgres -d myapp_db -f $SQL_FILE"
echo ""
exit 1

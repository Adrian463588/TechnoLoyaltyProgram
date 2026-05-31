#!/bin/sh
set -e

# Fail-fast validation
if [ -z "$DATABASE_URL" ]; then
  echo "[FATAL] DATABASE_URL environment variable is missing or empty."
  echo "Ensure DATABASE_URL is set in Coolify as a 'Runtime' environment variable."
  exit 1
fi

echo "=> Running Prisma migrations..."
npx prisma migrate deploy

echo "=> Running database seeds..."
npm run seed

echo "=> Starting application..."
exec "$@"

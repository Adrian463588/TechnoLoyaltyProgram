#!/bin/sh
set -e

echo "=> Running Prisma migrations..."
npx prisma migrate deploy

echo "=> Running database seeds..."
npm run seed

echo "=> Starting application..."
exec "$@"

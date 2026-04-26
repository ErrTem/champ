#!/bin/sh
set -e

echo "[entrypoint] waiting for database + applying schema"

TRIES=30
until npx prisma migrate deploy >/dev/null 2>&1; do
  TRIES=$((TRIES - 1))
  if [ "$TRIES" -le 0 ]; then
    echo "[entrypoint] prisma migrate deploy failed (timeout)"
    npx prisma migrate deploy
    exit 1
  fi
  sleep 2
done

if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  echo "[entrypoint] admin provisioning enabled for: ${ADMIN_EMAIL}"
else
  echo "[entrypoint] admin provisioning disabled (set ADMIN_EMAIL and ADMIN_PASSWORD)"
fi

echo "[entrypoint] seeding"
npx prisma db seed >/dev/null 2>&1 || npx prisma db seed

echo "[entrypoint] starting app: $*"
exec "$@"


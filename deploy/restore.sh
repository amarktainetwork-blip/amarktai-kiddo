#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

[ "${CONFIRM_RESTORE:-}" = "YES" ] || {
  echo "Refusing destructive restore. Run with CONFIRM_RESTORE=YES." >&2
  exit 1
}
[ "$#" -eq 2 ] || { echo "Usage: CONFIRM_RESTORE=YES $0 <db.sql.gz> <media.tar.gz>" >&2; exit 1; }
DB_BACKUP="$1"
MEDIA_BACKUP="$2"
[ -f "$DB_BACKUP" ] && [ -f "$MEDIA_BACKUP" ] || { echo "Backup file missing." >&2; exit 1; }
[ -f .env ] || { echo ".env missing." >&2; exit 1; }

set -a
. ./.env
set +a

ABS_MEDIA="$(CDPATH= cd -- "$(dirname -- "$MEDIA_BACKUP")" && pwd)/$(basename "$MEDIA_BACKUP")"
MEDIA_DIR="$(dirname "$ABS_MEDIA")"
MEDIA_NAME="$(basename "$ABS_MEDIA")"

docker compose stop app caddy

echo "Resetting database schema..."
docker compose exec -T db psql -U "${DB_USER:-kiddo}" -d "${DB_NAME:-kiddo}"   -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

echo "Restoring PostgreSQL..."
gunzip -c "$DB_BACKUP" | docker compose exec -T db psql -U "${DB_USER:-kiddo}" -d "${DB_NAME:-kiddo}" -v ON_ERROR_STOP=1

echo "Restoring media..."
docker compose run --rm --no-deps -v "$MEDIA_DIR:/restore:ro" app   sh -c "rm -rf /data/media/* && tar -xzf /restore/$MEDIA_NAME -C /data/media"

docker compose up -d app caddy
echo "RESTORE_COMPLETE=YES"

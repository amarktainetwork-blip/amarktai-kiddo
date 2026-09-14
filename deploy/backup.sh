#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
[ -f .env ] || { echo ".env missing" >&2; exit 1; }

set -a
. ./.env
set +a

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/kiddo-db-$STAMP.sql.gz"
MEDIA_FILE="$BACKUP_DIR/kiddo-media-$STAMP.tar.gz"

echo "Backing up PostgreSQL..."
docker compose exec -T db pg_dump -U "${DB_USER:-kiddo}" "${DB_NAME:-kiddo}" | gzip -9 > "$DB_FILE"
test -s "$DB_FILE"

echo "Backing up private media..."
docker compose run --rm --no-deps -v "$BACKUP_DIR:/backup" app   sh -c "tar -czf /backup/$(basename "$MEDIA_FILE") -C /data/media ."
test -s "$MEDIA_FILE"

sha256sum "$DB_FILE" "$MEDIA_FILE" > "$BACKUP_DIR/kiddo-$STAMP.sha256"
echo "BACKUP_OK=$STAMP"
echo "$DB_FILE"
echo "$MEDIA_FILE"

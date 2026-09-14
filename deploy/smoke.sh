#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
[ -f .env ] || { echo ".env missing" >&2; exit 1; }
set -a
. ./.env
set +a

BASE="https://${DOMAIN}"
echo "Checking $BASE"
curl -fsS "$BASE/health"
echo
curl -fsS "$BASE/ready"
echo
curl -fsSI "$BASE/" | grep -Ei 'HTTP/|strict-transport-security|content-security-policy|x-content-type-options'
echo "PUBLIC_SMOKE_OK=YES"

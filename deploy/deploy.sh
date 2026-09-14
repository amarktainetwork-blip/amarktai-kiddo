#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[ -f .env ] || fail ".env is missing. Copy .env.example to .env and fill production values."

set -a
. ./.env
set +a

[ "${NODE_ENV:-}" = "production" ] || fail "NODE_ENV must be production."
[ -n "${DOMAIN:-}" ] || fail "DOMAIN is required."
[ -n "${PUBLIC_ORIGIN:-}" ] || fail "PUBLIC_ORIGIN is required."
[ "${PUBLIC_ORIGIN}" = "https://${DOMAIN}" ] || fail "PUBLIC_ORIGIN must equal https://$DOMAIN."
[ "${#JWT_SECRET}" -ge 32 ] || fail "JWT_SECRET must be at least 32 characters."
[ -n "${POSTGRES_PASSWORD:-}" ] || fail "POSTGRES_PASSWORD is required."

case "${AI_PROVIDER:-auto}" in
  genx) [ -n "${GENX_API_KEY:-}" ] || fail "AI_PROVIDER=genx requires GENX_API_KEY." ;;
  openrouter) [ -n "${OPENROUTER_API_KEY:-}" ] || fail "AI_PROVIDER=openrouter requires OPENROUTER_API_KEY." ;;
  auto) [ -n "${GENX_API_KEY:-}${OPENROUTER_API_KEY:-}" ] || fail "AI_PROVIDER=auto requires at least one provider key." ;;
  *) fail "AI_PROVIDER must be auto, genx, or openrouter." ;;
esac

if grep -Eq 'replace-with|kiddo\.example\.com|your[_-]?key|YOUR_' .env; then
  fail ".env still contains example/placeholder values."
fi

echo "== Kiddo release =="
git rev-parse HEAD
git status --short

echo "== Compose validation =="
docker compose config >/dev/null

echo "== Build and start =="
docker compose build --pull
docker compose up -d --remove-orphans

echo "== Containers =="
docker compose ps

echo "== Internal readiness =="
ready=0
i=0
while [ "$i" -lt 30 ]; do
  if docker compose exec -T app wget -qO- http://127.0.0.1:3001/ready >/tmp/kiddo-ready.json 2>/dev/null; then
    cat /tmp/kiddo-ready.json
    ready=1
    break
  fi
  i=$((i+1))
  sleep 2
done
[ "$ready" -eq 1 ] || { docker compose logs --tail=120 app db; fail "Kiddo did not become AI-ready."; }

echo "== HTTPS readiness =="
curl -fsS --retry 10 --retry-delay 3 "https://${DOMAIN}/ready"
echo

echo "KIDDO_DEPLOYMENT_READY=YES"
echo "RELEASE_SHA=$(git rev-parse HEAD)"

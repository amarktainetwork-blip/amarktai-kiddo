# Amarktai Kiddo

A parent-controlled creative AI companion for children ages 3–12.

## Production architecture

- React/Vite PWA frontend
- One Express API served from the same origin
- PostgreSQL for parent accounts, child profiles, conversations, usage limits, credits and media metadata
- HTTP-only parent session cookie plus password-protected Parent Controls
- Private generated media on the Webdock VPS volume
- GenX **or** OpenRouter server-side AI adapter
- Docker Compose + Caddy HTTPS for Webdock
- Automatic async GenX media reconciliation
- GitHub CI with frontend build/typecheck, dependency audit, PostgreSQL integration testing and dual-provider acceptance

Provider/model choices are never exposed to a child.

## AI provider parity

Set one of:

```env
AI_PROVIDER=genx
GENX_API_KEY=...
```

or:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
```

or configure both and use:

```env
AI_PROVIDER=auto
GENX_API_KEY=...
OPENROUTER_API_KEY=...
```

The visible Kiddo feature set is the same whichever provider is selected:

- chat
- stories
- image generation
- music generation
- parent-controlled voice input/read-aloud UI
- emotional companion reactions
- private media library

Default provider models are defined in `.env.example`. GenX image/music models may be left blank so Kiddo discovers a compatible current model from the GenX catalog. OpenRouter defaults are explicitly pinned in environment configuration.

Voice input/read-aloud uses browser speech capabilities so the child experience does not change with the AI provider. Parent Controls can disable voice entirely or enable automatic read-aloud.

## First Webdock deployment

Clone the repository **only after the approved recovery PR is merged to `main`**.

```bash
sudo mkdir -p /opt/amarktai-kiddo
sudo chown "$USER":"$USER" /opt/amarktai-kiddo
cd /opt/amarktai-kiddo
git clone https://github.com/amarktainetwork-blip/amarktai-kiddo.git .
git checkout main
git pull --ff-only
git rev-parse HEAD
```

Create the production environment:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Required values:

```env
NODE_ENV=production
DOMAIN=kiddo.example.com
PUBLIC_ORIGIN=https://kiddo.example.com
JWT_SECRET=<strong random value>
POSTGRES_PASSWORD=<strong random value>
DB_HOST=db
DB_PORT=5432
DB_NAME=kiddo
DB_USER=kiddo

AI_PROVIDER=genx
GENX_API_KEY=<key>
```

Generate a JWT secret on the VPS:

```bash
openssl rand -hex 64
```

Then use the guarded deployment script:

```bash
./deploy/deploy.sh
```

The script refuses example placeholders, validates Compose, builds the exact lockfile-controlled dependency tree, starts the stack, checks internal AI readiness, then checks HTTPS readiness.

## Health endpoints

- `/health` — process/database health
- `/ready` — database + private media storage + a live valid configured AI key

A deployment is not accepted until `/ready` returns HTTP 200.

Manual public smoke test:

```bash
./deploy/smoke.sh
```

## Backups

Create a database and private-media backup:

```bash
./deploy/backup.sh
```

By default backups go into `./backups/`, which is Git-ignored. Copy production backups off the application VPS as part of operations.

A destructive restore requires explicit confirmation:

```bash
CONFIRM_RESTORE=YES ./deploy/restore.sh backups/kiddo-db-<timestamp>.sql.gz backups/kiddo-media-<timestamp>.tar.gz
```

Test restore on staging before client handover.

## Required live acceptance

After entering a real GenX or OpenRouter key on the Webdock VPS:

1. `/health` and `/ready` return 200 over HTTPS.
2. Parent registers and consent is required.
3. Parent creates at least two child profiles and can edit name, age, language and companion.
4. Parent gate locks when entering child Chat.
5. Wrong parent password is rejected; correct password unlocks controls.
6. English, Afrikaans and Zulu profiles receive replies in their configured language.
7. Saved conversations remain bound to the correct child in multi-child families.
8. Normal chat returns a real AI response and emotion.
9. Story mode persists the complete user/assistant exchange.
10. Push-to-talk fills the composer on a supported browser.
11. Read-aloud speaks a reply; parent voice-off hides/disables voice controls.
12. Image generation produces a private image.
13. Music generation produces playable audio.
14. GenX async media finishes automatically without requiring the user to keep polling.
15. Failed provider requests refund Kiddo credits and do not consume the daily parent message limit.
16. The daily limit cannot be bypassed by concurrent requests.
17. Generated media is available to the owning parent session and denied to logged-out/other-family sessions.
18. Parent can disable image/music generation.
19. Family data export works.
20. Parent password change works.
21. Full family account deletion removes database records and stored private media.
22. App/database/media survive a normal container restart.
23. Backup and restore are proven.

## Release gate

Do not call the product client-handover ready based only on `docker compose ps`.

Required release evidence is:

- exact Git commit SHA
- green Kiddo CI on that exact SHA
- Webdock `/ready` = 200 with the real configured provider
- full live acceptance above
- tested backup/restore
- jurisdiction-specific child privacy/parental-consent review before broad public registration

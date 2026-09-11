# Amarktai Kiddo

Parent-controlled creative AI companion for children ages 3–12.

## Architecture

- React/Vite PWA frontend
- Express API served from the same origin
- PostgreSQL for parent accounts, child profiles, conversations, credits and media metadata
- HTTP-only parent session cookie
- Server-only AI keys
- GenX and OpenRouter provider adapter
- Private generated media stored on the VPS volume and served only after an ownership check
- Docker Compose + Caddy for a Webdock VPS

## AI configuration

Set `AI_PROVIDER=auto`, `genx`, or `openrouter` in `.env`.

`auto` prefers `GENX_API_KEY` and falls back to `OPENROUTER_API_KEY` for text requests. GenX also enables image and music generation. OpenRouter enables chat/stories and image generation through its dedicated image API. The UI never exposes provider or model selection to a child.

Copy `.env.example` to `.env`, set `DOMAIN`, `PUBLIC_ORIGIN`, `POSTGRES_PASSWORD`, `JWT_SECRET`, and at least one AI API key.

## Webdock deployment

```bash
git clone https://github.com/amarktainetwork-blip/amarktai-kiddo.git
cd amarktai-kiddo
cp .env.example .env
# edit .env
docker compose up -d --build
docker compose ps
curl -fsS https://YOUR_DOMAIN/health
```

Point the domain A/AAAA record to the VPS before starting Caddy. Ports 80 and 443 must be open.

## Required launch acceptance

1. Parent registers and gives consent.
2. Parent creates a child profile.
3. Parent logs out/in and the child profile persists.
4. Child chat returns a real provider response and emotion.
5. Story mode persists conversation history.
6. Credits deduct only after successful backend actions.
7. Parent daily limits block additional child messages.
8. Parent can disable generated media.
9. Generated picture/music is only accessible while signed in to the owning parent account.
10. `/health` reports database and AI capability state.

A jurisdiction-specific child privacy/legal review is still required before opening registration to the public.

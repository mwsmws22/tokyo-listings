# Docker — full stack (Postgres + API + Web)

Run from the **repository root** so Compose resolves `env_file` paths and variable substitution against the root `.env`:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Prerequisites

- Docker Engine (or Docker Desktop) with Compose v2
- A root `.env` file (`cp .env.template .env` and fill values). Compose loads `../.env` relative to `docker/docker-compose.yml`, which resolves to the repo root when this file lives under `docker/`.
- **`BETTER_AUTH_SECRET`**: must be **non-empty** in root `.env` for the API container (the image runs with `NODE_ENV=production`). Compose passes it via `env_file`; it is not overridden by empty shell interpolation. To generate one: `openssl rand -hex 32` → paste into `.env`.

## Ports

| Service    | Default host port | Container |
|------------|-------------------|-----------|
| Postgres   | 5432              | 5432      |
| API (Hono) | 4001              | 4001      |
| Web (Next) | 3000              | 3000      |

Override the web bind with `WEB_PUBLISH_PORT` (e.g. `WEB_PUBLISH_PORT=3001`). Override the API bind with `API_LISTEN_PORT`.

## Environment and Better Auth URL

- **`BETTER_AUTH_URL`** must equal the **browser origin** users open (scheme + host + port), e.g. `http://localhost:3000` when you publish the web service on port 3000. The API uses it for CORS; the Better Auth client uses **`NEXT_PUBLIC_BETTER_AUTH_URL`** with the **same value**.
- **`NEXT_PUBLIC_*` variables** are fixed at **web image build time**. After changing them in `.env`, rebuild the web image:  
  `docker compose -f docker/docker-compose.yml build web --no-cache`
- Inside the Compose network, the Next server proxies `/api` and `/trpc` to **`http://api:4001`**; that value is baked in at build via `API_DEV_ORIGIN` (see `docker/Dockerfile.web`).

## Database migrations

The API container **runs Drizzle migrations on startup** (`docker/api-entrypoint.sh`) before listening, so a fresh Postgres volume gets schema applied automatically.

## Smoke checklist

1. `curl -sSf http://localhost:4001/health` → JSON with `"ok": true` (adjust port if `API_LISTEN_PORT` differs).
2. Open `http://localhost:3000` (or your `WEB_PUBLISH_PORT`) — Next.js responds.
3. Register / sign-in — cookies stay on the web origin; `/api/*` and `/trpc/*` are rewritten to the API.

## Postgres only (host Bun dev)

```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

Then use root scripts with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tokyo_listings` (see `quickstart.md`).

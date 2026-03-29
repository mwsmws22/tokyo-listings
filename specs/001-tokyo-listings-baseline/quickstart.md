# Quickstart (local) — Tokyo Listings Baseline

**Target**: Operator machine with **Docker Desktop** (or Docker Engine) + **Bun** (optional for
host-side scripts) + **Node 22** (if not using Docker for dev).

## 1. Clone and branch

```bash
git checkout 001-tokyo-listings-baseline
```

## 2. Environment

Create `.env` / `.env.local` files as documented in the repo root after implementation. Typical
variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `API_DEV_ORIGIN` | Local API origin for Next rewrites (default `http://localhost:4001`) |
| `BETTER_AUTH_SECRET` | Long random secret for session signing (required in production) |
| `BETTER_AUTH_URL` | Public URL of the **web** app (e.g. `http://localhost:3000`). Must match the origin in the browser. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same value as `BETTER_AUTH_URL` for the Better Auth **client** (`apps/web`). |
| SMTP vars | Verification and password reset email (optional in dev; without `SMTP_HOST`, mail is skipped) |
| `GOOGLE_MAPS_*` | Map + geocoding keys (restricted per Google guidance) |

## 3. Start infrastructure

```bash
docker compose up -d postgres
# After implementation:
docker compose up --build
```

## 4. Migrations

From the repository root (with `DATABASE_URL` set, e.g. from `.env.example`):

```bash
bun run db:generate   # when schema changes — creates/updates packages/db/migrations/
bun run db:migrate    # apply migrations to Postgres
```

## 5. Run tests / lint

```bash
bun run lint
bun run test
```

## 6. Open app

- Web: `http://localhost:3000` (Next.js default)
- API (local dev): `http://localhost:4001` by default (`PORT` / `API_DEV_ORIGIN`); health at `GET /health`

### Local dev: API + web (auth)

1. Copy `.env.example` to `.env` at the repo root and set secrets. For Next, also add `NEXT_PUBLIC_*` vars to `apps/web/.env.local` (or root `.env` if you load it) so the Better Auth client matches `BETTER_AUTH_URL`.
2. Start Postgres (`docker compose up -d postgres`) and run migrations (`bun run db:migrate`).
3. Terminal A — API: `DATABASE_URL=... BETTER_AUTH_URL=http://localhost:3000 PORT=4001 bun run --cwd apps/api dev`
4. Terminal B — Web: `bun run --cwd apps/web dev` (ensure `API_DEV_ORIGIN=http://localhost:4001` for rewrites)

**Cookies**: Session cookies are **HTTP-only** and scoped to the web origin. The browser talks to **Next on `:3000`**; `/api/*` and `/trpc/*` are rewritten to the API on `:4001`, so cookies stay on the app origin. Do not set `BETTER_AUTH_URL` to the API port unless you serve the UI from there.

## Agents / automation

Do **not** run `bun install` from unattended automation. When dependencies or the lockfile change, the operator should run at the repository root:

`bun install`

## Notes

- **Do not** commit real API keys.
- DNS / reverse proxy / Nginx Proxy Manager are **out of scope** for this document; production
  TLS terminates at your proxy.

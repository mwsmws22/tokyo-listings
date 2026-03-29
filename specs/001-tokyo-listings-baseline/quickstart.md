# Quickstart (local) — Tokyo Listings Baseline

**Target**: Operator machine with **Docker Desktop** (or Docker Engine) + **Bun** (optional for
host-side scripts) + **Node 22** (if not using Docker for dev).

## 1. Clone and branch

```bash
git checkout 001-tokyo-listings-baseline
```

## 2. Environment

Use **one** file at the repo root: copy `.env.template` → `.env` and set values. Root `package.json` scripts load it with `bun run --cwd <app-or-package> --env-file ../../.env …` so the path resolves from each workspace package to the repo root (Bun resolves `--env-file` relative to `--cwd`). Do **not** maintain separate `apps/web/.env.local` or `apps/api/.env` for normal dev. Docker Compose should use the same file (e.g. `env_file: .env` from the repo root). Typical variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `API_LISTEN_PORT` | TCP port the **API** server listens on (default `4001`). Required for a predictable bind address (no generic `PORT` fallback in app code). |
| `API_DEV_ORIGIN` | Full origin for Next rewrites to the API (default `http://localhost:4001`) — must match `API_LISTEN_PORT` |
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

From the repository root (with a root `.env` containing `DATABASE_URL`; `bun run db:*` loads it automatically):

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
- API (local dev): `http://localhost:4001` by default (`API_LISTEN_PORT` / `API_DEV_ORIGIN`); health at `GET /health`

### Styling (Tamagui / Rosé Pine)

The web app uses **Tamagui only** (no Tailwind). Themes are generated with **`createThemes`** from `@tamagui/theme-builder` (see [Creating Themes with Tamagui](https://tamagui.dev/docs/guides/theme-builder)). **`rosePineThemes`** in `apps/web/src/themes/rose-pine-themes.ts` defines three variants — **`rose-pine`**, **`rose-pine-moon`**, **`rose-pine-dawn`** — from the official palette at [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/). They are merged in `apps/web/tamagui.config.ts`; **`TamaguiProvider`** defaults to **`rose-pine-moon`**.

### Local dev: API + web (auth)

1. Copy `.env.template` to `.env` at the repo root and set secrets (including `NEXT_PUBLIC_*` so the Better Auth client matches `BETTER_AUTH_URL`; Next inherits them from the process env when using `bun run dev:web`).
2. Start Postgres (`docker compose up -d postgres`) and run migrations (`bun run db:migrate`).
3. From the **repository root**, terminal A — API: `bun run dev:api` (`--env-file=.env` is relative to cwd).
4. From the **repository root**, terminal B — Web: `bun run dev:web` (ensure `API_DEV_ORIGIN` matches `http://localhost:<API_LISTEN_PORT>` for rewrites)

If you previously used `apps/web/.env.local` or `apps/api/.env`, merge those values into the root `.env` once.

**Cookies**: Session cookies are **HTTP-only** and scoped to the web origin. The browser talks to **Next on `:3000`**; `/api/*` and `/trpc/*` are rewritten to the API on `:4001`, so cookies stay on the app origin. Do not set `BETTER_AUTH_URL` to the API port unless you serve the UI from there.

## Agents / automation

Cursor agents are expected to run `bun install` at the repository root when dependencies or the lockfile change (see `.cursor/rules/specify-rules.mdc`).

## Notes

- **Bun version**: Prefer **Bun 1.2.x** (e.g. **1.2.23**) for this repo. **Bun 1.3.11** has been observed to make `bun install` slow or appear to hang; see [this comment on Bun issue #23969](https://github.com/oven-sh/bun/issues/23969#issuecomment-4149520781) for tracking.
- Dev and DB scripts expect a root `.env`. If Bun reports a missing env file, run `cp .env.template .env` from the repo root and fill in values.
- **Do not** commit real API keys.
- DNS / reverse proxy / Nginx Proxy Manager are **out of scope** for this document; production
  TLS terminates at your proxy.

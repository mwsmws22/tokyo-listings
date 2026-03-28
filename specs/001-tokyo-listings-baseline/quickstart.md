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
| `BETTER_AUTH_SECRET` | Long random secret for session cookies |
| `BETTER_AUTH_URL` | Public URL of the app (e.g. `http://localhost:3000`) |
| SMTP vars | Verification and password reset email |
| `GOOGLE_MAPS_*` | Map + geocoding keys (restricted per Google guidance) |

## 3. Start infrastructure

```bash
docker compose up -d postgres
# After implementation:
docker compose up --build
```

## 4. Migrations

```bash
# After implementation — example:
bun run db:migrate
```

## 5. Run tests / lint

```bash
bun run lint
bun run test
```

## 6. Open app

- Web: `http://localhost:3000` (or port chosen in compose)
- API health: path defined in implementation (e.g. `/api/health`)

## Agents / automation

Do **not** run `bun install` from unattended automation. When dependencies or the lockfile change, the operator should run at the repository root:

`bun install`

## Notes

- **Do not** commit real API keys.
- DNS / reverse proxy / Nginx Proxy Manager are **out of scope** for this document; production
  TLS terminates at your proxy.

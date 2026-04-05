# Tokyo Listings

Multi-tenant Tokyo rental listings workspace: **Next.js** (`apps/web`) and **Hono + tRPC** (`apps/api`) with **PostgreSQL** and **Better Auth**.

## Governance and baseline spec

- [Tokyo Listings Constitution](.specify/memory/constitution.md) — project principles and workflow expectations.
- [Feature specification — baseline](specs/001-tokyo-listings-baseline/spec.md) — user stories and requirements for this rebuild.

## Quick start

1. Copy [`.env.template`](.env.template) to `.env` at the repo root and fill secrets.
2. Use **Node.js Active LTS** on PATH when running **Vitest** (e.g. `bun run test`). See [docs/dev-environment.md](docs/dev-environment.md) and [`.nvmrc`](.nvmrc).
3. Install dependencies: `bun install` (prefer **Bun 1.2.x**; see `.cursor/rules/specify-rules.mdc`).
4. Follow [specs/001-tokyo-listings-baseline/quickstart.md](specs/001-tokyo-listings-baseline/quickstart.md) for local dev, migrations, and ports.
5. For Docker: [docker/README.md](docker/README.md).

## Scripts (repo root)

| Script        | Purpose                          |
|---------------|----------------------------------|
| `bun run lint` | Biome check across the monorepo |
| `bun run typecheck` | TypeScript project references + web |
| `bun run test` | Vitest (`vitest run` in `packages/scraping`; Node Active LTS on PATH) |
| `bun run dev:api` / `bun run dev:web` | API / web dev servers (with root `.env`) |

CI runs `bun install`, `bun run lint`, `bun run typecheck`, and `bun run test` (see `.github/workflows/ci.yml`).

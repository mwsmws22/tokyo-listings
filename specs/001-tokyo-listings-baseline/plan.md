# Implementation Plan: Tokyo Listings Platform Rebuild (Baseline & Roadmap)

**Branch**: `001-tokyo-listings-baseline` | **Date**: 2026-03-28 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-tokyo-listings-baseline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Rebuild **Tokyo Listings** as a **multi-tenant** web product: **auth-first**, then **map shell**,
then **user-scoped listings** with geocoding and manual pins, then **filters**, then **URL
ingestion / dedupe / merge** parity with the legacy app’s described behavior. **T4-aligned**
tooling with **self-hosted PostgreSQL** and **Docker**—no dependency on Cloudflare Workers, D1, or
Cloudflare-only hosting. Split **Next.js** (`apps/web`) and **Hono + tRPC + Drizzle + Better Auth**
(`apps/api`) behind one Docker Compose stack; **Tamagui** with **Rosé Pine** themes (`rose-pine`, `rose-pine-moon`, `rose-pine-dawn` via `@tamagui/theme-builder`; hex values from [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/); no Tailwind), **tRPC**, **TanStack Query**, **Jotai**,
**Bun** (tooling), **Biome** lint/format. Legacy repo remains **read-only reference**; extensions,
bat files, and DB backups are out of scope.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 22 LTS for Next.js; Bun 1.x for package manager
and scripts; API service may run on Node or Bun (pin in Docker and CI)

**Primary Dependencies**: Next.js (App Router), Tamagui (**`createThemes`**, Rosé Pine themes from [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/)), tRPC, TanStack Query, Jotai, Hono,
Drizzle ORM, Better Auth, Biome, Vitest; Google Maps JS + Geocoding APIs

**Storage**: PostgreSQL 16 (self-hosted / Docker), Drizzle migrations

**Testing**: Vitest (unit + domain), Playwright optional smoke later; integration tests against
Postgres in CI profile

**Target Platform**: Linux containers (Docker) on operator server. Local dev is SSH based in Cursor, so you can develop, test, and run freely on my server.

**Project Type**: Multi-package web application (web UI + HTTP API)

**Performance Goals**: Subjective “snappy” UI for &lt;500 listings per user; API p95 &lt;500ms for
list/filter on typical LAN/WAN excluding third-party map/geocode latency

**Constraints**: No edge-only database as sole store; secrets never logged; SMTP for auth email in
production; map keys restricted per Google guidance

**Scale/Scope**: Small multi-user (&lt;100 accounts) personal deployment first; schema supports
growth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md` (Tokyo Listings):

- [x] **Data integrity**: Rent, location, and dedupe rules live in **Drizzle + domain helpers**
  with tests; scraped rows store **sourceUrl** and **fetchedAt**; UI does not own uniqueness logic.
- [x] **Contracts**: **tRPC `AppRouter`** + `contracts/` docs; Better Auth routes documented via
  upstream; procedure list in `contracts/trpc-procedures.md`.
- [x] **Test-first**: Vitest for **filter math**, **URL normalization**, **geocode status**
  transitions; integration tests for **tenant isolation** on listing queries; visual-only work
  exempt per constitution with no domain change.
- [x] **Integration**: Compose-based **Postgres + API** tests for migrations and tRPC procedures;
  geocoding adapter mocked in CI; real Google calls optional manual/staging.
- [x] **Observability**: **Pino** or **structured JSON logs** in `apps/api` (exact lib in
  implementation); no secrets in log fields.
- [x] **Domain/product**: UI copy documents **JPY** and **㎡**; Tokyo default viewport; JP/EN
  labels follow a single glossary file in `apps/web` (add during implementation).

## Project Structure

### Documentation (this feature)

```text
specs/001-tokyo-listings-baseline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # Phase 2: /speckit.tasks
```

### Source Code (repository root)

```text
apps/
├── web/                  # Next.js + Tamagui (Rosé Pine Moon dark theme) + tRPC client + maps
└── api/                  # Hono + tRPC + Drizzle + Better Auth

packages/
├── db/                   # Drizzle schema, migrations, shared types
└── validators/           # Optional shared Zod / domain helpers

docker/
├── Dockerfile.web
├── Dockerfile.api
└── docker-compose.yml

tests/
├── integration/          # API + DB (scoped)
└── unit/
```

**Structure Decision**: **Split** `web` and `api` so **Hono** remains the HTTP/tRPC boundary
(satisfying T4 backend expectations) while **Next.js** ships the UI. Shared **Drizzle** schema in
`packages/db` avoids drift. **Expo/Solito** omitted until a mobile milestone; **Jotai** stays in
`apps/web` only.

### UI styling: Tamagui with Rosé Pine Moon (no Tailwind)

**Decision**: **Tamagui only** for styling; **no Tailwind** dependency.

- **Tamagui**: component primitives, forms, layouts, and theme tokens (`$background`, `$color`, `$borderColor`, scales, accents).
- **Rosé Pine**: three themes — **`rose-pine`**, **`rose-pine-moon`**, **`rose-pine-dawn`** — are generated with **`createThemes`** (`@tamagui/theme-builder`) from 12-step palettes whose hex values match the official ingredients at [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/); see `apps/web/src/themes/rose-pine-themes.ts` and [Tamagui ThemeBuilder](https://tamagui.dev/docs/guides/theme-builder).
- **Default theme**: `TamaguiProvider` uses **`defaultTheme="rose-pine-moon"`** unless overridden.

**Rationale**: One styling system (Tamagui); palettes are maintained as data aligned with the Rosé Pine project, not Tailwind CSS.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations requiring justification at this stage. (If the team later collapses
`api` into Next Route Handlers only, record the rationale and update contracts accordingly.)

## Post-Design Constitution Check (Phase 1 complete)

- [x] Data integrity rules reflected in `data-model.md` and API outline
- [x] Contracts documented under `contracts/`
- [x] Test and integration strategy stated in `research.md` and Technical Context
- [x] Observability and domain labeling called out in plan and quickstart

## Phase Outputs

| Phase | Artifact | Path |
|-------|----------|------|
| 0 | Research | `specs/001-tokyo-listings-baseline/research.md` |
| 1 | Data model | `specs/001-tokyo-listings-baseline/data-model.md` |
| 1 | Contracts | `specs/001-tokyo-listings-baseline/contracts/*` |
| 1 | Quickstart | `specs/001-tokyo-listings-baseline/quickstart.md` |

**Next command**: `/speckit.tasks` to break work into tasks, then implementation.

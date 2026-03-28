---
description: "Task list for Tokyo Listings baseline implementation"
---

# Tasks: Tokyo Listings Platform Rebuild (Baseline & Roadmap)

**Input**: Design documents from `/specs/001-tokyo-listings-baseline/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: The feature spec does not mandate TDD-only delivery; **no standalone test-task phases** are included. Vitest may be added later for domain helpers (`plan.md`); optional polish task references CI typecheck only.

**Organization**: Phases follow user stories **US1 → US5** (spec priorities). Setup and foundational work must complete before user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `[US1]`…`[US5]` on user-story phases only
- Paths are **repository-relative** from `tokyo-listings/` root

## Path Conventions (this repo)

- **Web**: `apps/web/`
- **API**: `apps/api/`
- **DB**: `packages/db/`
- **Validators**: `packages/validators/`
- **Docker**: `docker/`

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Monorepo skeleton, tooling, Docker **Postgres**, and workspace layout per `plan.md`.

- [X] T001 Create root `package.json` with Bun workspaces `["apps/*","packages/*"]` and shared scripts placeholders
- [X] T002 [P] Add `biome.json` at repository root with TypeScript/React formatting rules
- [X] T003 [P] Add `.env.example` at repository root listing `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, SMTP vars, `GOOGLE_MAPS_*` keys
- [X] T004 [P] Extend root `.gitignore` for `node_modules`, `.env*`, Next.js, Docker, and Drizzle artifacts
- [X] T005 Create `docker/docker-compose.yml` with `postgres:16` service, named volume, and published port `5432`
- [X] T006 [P] Add `docker/Dockerfile.api` stub for `apps/api` multi-stage build
- [X] T007 [P] Add `docker/Dockerfile.web` stub for `apps/web` Next.js standalone output
- [X] T008 Create `packages/db/package.json` and `packages/db/tsconfig.json`
- [X] T009 Create `apps/api/package.json` and `apps/api/tsconfig.json` with Hono, tRPC, Drizzle, Better Auth dependencies
- [X] T010 Create `apps/web/package.json` and `apps/web/tsconfig.json` with Next.js 15, Tamagui, TanStack Query, tRPC client, Jotai

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: **Drizzle schema**, **Hono API** with **Better Auth** + **tRPC**, **Next.js** shell with **Tamagui** + **tRPC provider**—required before any user story UI.

### Phase 2 — install unblock (resolved)

**Date**: 2026-03-29

**Status**: Operator confirmed **`bun install` completed successfully** at the repo root (workspace symlinks / prior `EACCES` / `root`-owned nested `node_modules` issues addressed).

**Remaining verification** (operator on dev machine with **Bun + Node 22** on `PATH`; agent policy: do **not** run `bun install` in agent sessions — ask the operator — see `.cursor/rules/specify-rules.mdc`):

1. `bun run lint` and `bun run typecheck` (fix any errors).
2. **T014**: from repo root, `bun run --cwd packages/db db:generate` so `packages/db/migrations/` exists; then `bun run --cwd packages/db db:migrate` against Docker Postgres (with `DATABASE_URL` set).
3. Smoke-test: API `GET /health`, Better Auth under `/api/auth/*` (via Next rewrite), tRPC `/trpc`; web loads with Tamagui + tRPC providers.

If nested `node_modules` break again: fix ownership or remove those trees, then operator runs `bun install` again (never use `sudo` for routine installs).

---

**Progress** (implementation in tree; **static checks + DB migrate + smoke tests** still to confirm on operator host):

- [X] T011 Add Drizzle `listing` and `property` tables in `packages/db/src/schema/listings.ts` per `data-model.md` (include `userId`, `sourceUrl`, rent JPY, lat/lng, geocode status)
- [X] T012 Add Better Auth tables in `packages/db/src/schema/auth.ts` (or follow Better Auth + Drizzle generator output) and export from `packages/db/src/schema/index.ts`
- [X] T013 Create `packages/db/src/index.ts` exporting schema types and table objects for `apps/api`
- [ ] T014 Add `packages/db/drizzle.config.ts` and generate initial migration under `packages/db/migrations/` — **`drizzle.config.ts` exists; `migrations/` not generated yet** — operator: `bun run --cwd packages/db db:generate` then migrate
- [X] T015 Implement PostgreSQL connection helper in `apps/api/src/lib/db.ts` using Drizzle `drizzle-orm/node-postgres` (or `postgres.js`) with `DATABASE_URL`
- [X] T016 Implement structured logger in `apps/api/src/lib/logger.ts` (pino or compatible; no secret logging)
- [X] T017 Configure Better Auth in `apps/api/src/lib/auth.ts` with Drizzle adapter, email/password, verification, and reset hooks using SMTP env vars
- [X] T018 Create Hono entry `apps/api/src/index.ts` with health check `GET /health`, global error handler, and CORS/cookie settings for `apps/web` origin
- [X] T019 Mount Better Auth handler in `apps/api/src/routes/auth.ts` and attach to Hono under `/api/auth/*` (path aligned with Better Auth docs)
- [X] T020 Create `apps/api/src/trpc/context.ts` building `{ db, session, userId }` from Better Auth session
- [X] T021 Create `apps/api/src/trpc/trpc.ts` with `router`, `publicProcedure`, and `protectedProcedure` requiring `userId`
- [X] T022 Create root `apps/api/src/trpc/router.ts` exporting type `AppRouter` (empty routers initially)
- [X] T023 Mount tRPC in `apps/api/src/routes/trpc.ts` at `/trpc` using `@hono/trpc-server` and wire in `apps/api/src/index.ts`
- [X] T024 Create TanStack Query + tRPC client in `apps/web/src/lib/trpc/Provider.tsx` and `apps/web/src/lib/trpc/client.ts` pointing at public API URL
- [X] T025 Add `apps/web/next.config.ts` with `rewrites()` to forward `/api` and `/trpc` to `apps/api` during local dev (port from env)
- [X] T026 Add Tamagui compiler config `apps/web/tamagui.config.ts` and wrap `apps/web/src/app/layout.tsx` with Tamagui + tRPC providers

**Phase 2 — still to test** (operator; `bun install` already confirmed):

- [X] Install / lockfile: `bun install` at repo root (confirmed by operator).
- [ ] Static checks: root `bun run lint`, `bun run typecheck` (and fix React 19 peer warnings if they break the build).
- [ ] DB: generate migration (**T014**), run against Docker Postgres, confirm tables (`user`, `session`, `account`, `verification`, `listing`, `property`, enums).
- [ ] API: `PORT=8787`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — `GET /health` = `{ ok: true }`; spot-check CORS origin vs `BETTER_AUTH_URL`.
- [ ] Auth: hit `/api/auth/*` through Next rewrite (or direct API); SMTP optional — without `SMTP_HOST`, emails are skipped but routes should still load.
- [ ] Web: `API_DEV_ORIGIN` rewrite; home page renders Tamagui shell; tRPC client instantiates (empty `AppRouter` ok).
- Optional: sign-up/sign-in end-to-end waits for **US1**; Phase 2 checkpoint is “stack runs,” not full auth UX.

**Checkpoint**: API boots with `/health`, auth routes respond, web renders a blank authenticated shell page (optional stub route) — unblock US1. **Lint / typecheck / migrate / smoke not yet validated** — complete the checklist above on the dev host.

---

## Phase 3: User Story 1 — Secure multi-user access (Priority: P1)

**Goal**: Registration, login, logout, email verification, password reset; sessions via HTTP-only cookies; no listing data yet beyond schema.

**Independent test**: Two accounts cannot see each other’s data once listings exist (verified in US3); for US1 alone, confirm protected routes redirect and sign-out clears session.

- [ ] T027 [US1] Add Better Auth client utilities in `apps/web/src/lib/auth-client.ts` (signIn, signUp, signOut, session hooks)
- [ ] T028 [P] [US1] Implement `apps/web/src/app/(auth)/login/page.tsx` with email/password form and error display
- [ ] T029 [P] [US1] Implement `apps/web/src/app/(auth)/register/page.tsx` with validation messages
- [ ] T030 [US1] Add `apps/web/src/app/(app)/layout.tsx` that redirects unauthenticated users to `/login` using session from Better Auth client
- [ ] T031 [US1] Add `apps/web/src/components/AuthToolbar.tsx` with current user email and **Sign out** action
- [ ] T032 [US1] Configure verification and password-reset email content in `apps/api/src/lib/auth.ts` (templates or hooks) and env-driven SMTP
- [ ] T033 [P] [US1] Add `apps/web/src/app/(auth)/forgot-password/page.tsx` and `apps/web/src/app/(auth)/reset-password/page.tsx` wired to Better Auth flows
- [ ] T034 [US1] Update `specs/001-tokyo-listings-baseline/quickstart.md` with actual dev ports, cookie same-site notes, and env var table

**Checkpoint**: Manual walkthrough: register → verify (if enabled) → login → access protected page → logout → blocked.

---

## Phase 4: User Story 2 — Map-first shell (Priority: P2)

**Goal**: Signed-in user sees interactive **Google Map** centered on Tokyo, pan/zoom, empty state (no pins required).

**Independent test**: Open `/map` as signed-in user; pan/zoom works; empty state visible with zero listings.

- [ ] T035 [US2] Create Jotai atoms in `apps/web/src/state/mapViewport.ts` for center, zoom, and map ready flag
- [ ] T036 [US2] Implement `apps/web/src/components/MapShell.tsx` loading Maps JavaScript API using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and rendering a full-height map
- [ ] T037 [US2] Add `apps/web/src/app/(app)/map/page.tsx` composing `MapShell` with default center near Tokyo Station and zoom level per `labels.ts`
- [ ] T038 [US2] Add `apps/web/src/components/MapEmptyState.tsx` explaining no listings yet with link to add listing (link target can be stub until US3)
- [ ] T039 [US2] Add `apps/web/src/content/labels.ts` for consistent JP/EN strings and **JPY / ㎡** unit hints per constitution

**Checkpoint**: Map loads without console errors; empty state shows when no listings.

---

## Phase 5: User Story 3 — Own listings on the map (Priority: P3)

**Goal**: CRUD listings scoped by `userId`; server-side geocode; pins on map; manual pin adjust persists lat/lng.

**Independent test**: User A creates listing with address → pin appears → drag pin → refresh persists; User B never sees A’s listings.

- [ ] T040 [US3] Implement `listing` tRPC router in `apps/api/src/trpc/routers/listing.ts` with `create`, `list`, `getById`, `update`, `delete` enforcing `ctx.userId` on all queries
- [ ] T041 [P] [US3] Add Zod schemas in `packages/validators/src/listing.ts` for create/update/list filters (initially optional filter fields)
- [ ] T042 [US3] Implement `map` tRPC router in `apps/api/src/trpc/routers/map.ts` with `geocode` calling Google Geocoding API using server-side key in `apps/api/src/lib/geocoding.ts`
- [ ] T043 [US3] Register `listing` and `map` routers in `apps/api/src/trpc/router.ts` and export updated `AppRouter` type
- [ ] T044 [US3] Build `apps/web/src/components/ListingForm.tsx` for create/edit (title, monthly rent JPY, address text) calling `listing.create` / `update`
- [ ] T045 [US3] Build `apps/web/src/components/ListingMarkers.tsx` plotting markers from `listing.list` results onto `MapShell`
- [ ] T046 [US3] Add `apps/web/src/app/(app)/listings/page.tsx` combining list panel + map + form entry point
- [ ] T047 [US3] Add `apps/web/src/components/PinAdjustControls.tsx` to drag marker and save lat/lng via `listing.update` when user overrides geocode

**Checkpoint**: Two test accounts validate isolation (cross-check `listing.list` and map pins).

---

## Phase 6: User Story 4 — Find and narrow listings (Priority: P4)

**Goal**: Combined filters: rent range, station distance cap, interest/tag — server-side filtering; UI drives query input.

**Independent test**: Seed multiple listings; change rent slider/tag; list and markers stay consistent.

- [ ] T048 [US4] Extend Zod list input in `packages/validators/src/listing.ts` with `minRent`, `maxRent`, `tag`, `maxStationDistanceMinutes` (names aligned to `data-model.md`)
- [ ] T049 [US4] Apply Drizzle `where` clauses for filters in `apps/api/src/trpc/routers/listing.ts` `list` procedure
- [ ] T050 [US4] Add `apps/web/src/state/listFilters.ts` Jotai atoms and derive tRPC `listing.list` input from atoms
- [ ] T051 [US4] Build `apps/web/src/components/ListingFilterBar.tsx` and wire into `apps/web/src/app/(app)/listings/page.tsx` with TanStack Query invalidation

**Checkpoint**: Filters narrow both sidebar list and visible markers.

---

## Phase 7: User Story 5 — Listing ingestion and deduplication (Priority: P5)

**Goal**: Ingest from at least one listing URL with **Cheerio**; reject duplicate URLs per user; merge listings under one `property`.

**Independent test**: Same URL twice → error; two URLs merged → single property group in UI.

- [ ] T052 [US5] Implement URL normalization helper in `packages/validators/src/url.ts` used by API before uniqueness check
- [ ] T053 [US5] Implement `ingest` tRPC router in `apps/api/src/trpc/routers/ingest.ts` with `fromUrl` using `fetch` + `cheerio` and persisting `sourceUrl` + `sourceFetchedAt`
- [ ] T054 [US5] Enforce unique `(userId, normalizedSourceUrl)` constraint in `ingest.fromUrl` and surface friendly `CONFLICT` error
- [ ] T055 [US5] Implement `property` tRPC router in `apps/api/src/trpc/routers/property.ts` with `mergeListings` updating `listing.propertyId` transactionally
- [ ] T056 [US5] Register `ingest` and `property` routers in `apps/api/src/trpc/router.ts`
- [ ] T057 [US5] Add `apps/web/src/components/IngestFromUrlForm.tsx` and `apps/web/src/components/MergeListingsDialog.tsx` wired to new procedures

**Checkpoint**: Duplicate URL rejected; merge associates listings for same user.

---

## Phase 8: Polish & cross-cutting concerns

**Purpose**: Documentation, Docker wiring for **api + web + postgres**, CI lint/typecheck, contract doc sync.

- [ ] T058 Add root `README.md` linking `.specify/memory/constitution.md` and `specs/001-tokyo-listings-baseline/spec.md`
- [ ] T059 [P] Extend `docker/docker-compose.yml` (or root `compose.yaml`) with `api` and `web` services, env files, and dependency on `postgres`
- [ ] T060 [P] Add root script `lint` running `biome check .` and `typecheck` running `tsc -b` across workspaces
- [ ] T061 Add `.github/workflows/ci.yml` installing Bun, caching, running `bun install`, `bun run lint`, `bun run typecheck`
- [ ] T062 Update `specs/001-tokyo-listings-baseline/contracts/trpc-procedures.md` to match final router procedure names
- [ ] T063 Final pass on `specs/001-tokyo-listings-baseline/quickstart.md` for exact commands (`bun install`, compose up, migrate)

---

## Dependencies & execution order

### Phase dependencies

- **Phase 1** → **Phase 2** → **US1** → **US2** → **US3** → **US4** → **US5** → **Polish**
- **US2** depends on **US1** (authenticated routing and session)
- **US3+** depend on **US2** only for map components/paths (can mock map briefly if needed, not recommended)

### User story dependencies

- **US1**: After Phase 2 only
- **US2**: After US1
- **US3**: After US2 (uses map surface)
- **US4**: After US3 (needs listings)
- **US5**: After US3 (needs listings/property schema); merge UI needs `property` router

### Parallel opportunities

- **Phase 1**: T002–T004, T006–T007 in parallel after T001
- **US1**: T028 and T029 in parallel after T027
- **US1**: T033 parallelizable after T032
- **Polish**: T059 and T060 in parallel after T058

---

## Parallel example: User Story 1

```bash
# After T027 completes, launch UI pages together:
Task: "apps/web/src/app/(auth)/login/page.tsx"
Task: "apps/web/src/app/(auth)/register/page.tsx"
```

---

## Implementation strategy

### MVP first (US1 only)

1. Complete Phase 1 and Phase 2 (T001–T026)
2. Complete US1 (T027–T034) — **stop** and validate auth flows on real SMTP/staging
3. Then US2 map shell

### Incremental delivery

1. US1 → secure product shell
2. US2 → trust map integration
3. US3 → core product value (listings + pins)
4. US4 → power-user filtering
5. US5 → parity with legacy scraping/dedupe spirit
6. Polish → production-like Docker + CI

---

## Notes

- **IDs**: T001–T063 (63 tasks). Renumber if inserting tasks; keep chronological order.
- **Security**: Never log passwords, tokens, or raw `DATABASE_URL` in `apps/api` logging.
- **Contracts**: When routers stabilize, mirror exports for `AppRouter` in `packages/api-types` if introduced later (optional; not required above).

---
description: "Task list for Tokyo Listings baseline implementation"
---

# Tasks: Tokyo Listings Platform Rebuild (Baseline & Roadmap)

**Input**: Design documents from `/specs/001-tokyo-listings-baseline/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: The feature spec does not mandate TDD-only delivery; **no standalone test-task phases** are included. Vitest may be added later for domain helpers (`plan.md`); optional polish task references CI typecheck only.

**Organization**: Phases follow user stories **US1 → US5** (spec priorities). Setup and foundational work must complete before user stories.

**Runtime policy**: Development may use **local Bun + Next** for fast iteration. **Docker Compose** is a **first-class path**: after **US1**, the repo must support **postgres + api + web** in Compose, and new features should remain verifiable in containers (see Phase 4). Do not treat Docker as end-of-project polish only.

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
- [X] T003 [P] Add `.env.template` at repository root listing `DATABASE_URL`, `API_LISTEN_PORT`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, SMTP vars, `GOOGLE_MAPS_*` keys (operators copy to `.env`)
- [X] T004 [P] Extend root `.gitignore` for `node_modules`, `.env*`, Next.js, Docker, and Drizzle artifacts
- [X] T005 Create `docker/docker-compose.yml` with `postgres:16` service, named volume, and published port `5432`
- [X] T006 [P] Add `docker/Dockerfile.api` stub for `apps/api` multi-stage build
- [X] T007 [P] Add `docker/Dockerfile.web` stub for `apps/web` Next.js standalone output
- [X] T008 Create `packages/db/package.json` and `packages/db/tsconfig.json`
- [X] T009 Create `apps/api/package.json` and `apps/api/tsconfig.json` with Hono, tRPC, Drizzle, Better Auth dependencies
- [X] T010 Create `apps/web/package.json` and `apps/web/tsconfig.json` with Next.js 15, **Uniwind**, **Tailwind v4**, **@expo/next-adapter**, **react-native** + **react-native-web**, TanStack Query, tRPC client, Jotai

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: **Drizzle schema**, **Hono API** with **Better Auth** + **tRPC**, **Next.js** shell with **Uniwind/Tailwind** (global CSS, PostCSS, `withUniwind`/`withExpo` in `next.config`) + **tRPC provider**—required before any user story UI. Verify against **Docker Postgres** (`docker compose`); host Postgres is optional.

### Phase 2 — verification (complete)

**Date**: 2026-03-29

**Status**: Phase 2 checks run in dev: **lint**, **typecheck**, **Drizzle generate + migrate** against Docker Postgres, **API smoke** (`/health`, `/api/auth/get-session`, `GET /trpc/health`), **`next build`** for `apps/web`. Root scripts use **`bun ./node_modules/...`** for Biome, TypeScript, Drizzle Kit, and Next so a legacy system `node` (e.g. v12) does not break CLI tools.

**Dependencies**: If `package.json` or `bun.lock` changes, run `bun install` at the repo root (agents should run it — see `.cursor/rules/specify-rules.mdc`).

---

**Progress** (implementation verified):

- [X] T011 Add Drizzle `listing` and `property` tables in `packages/db/src/schema/listings.ts` per `data-model.md` (include `userId`, `sourceUrl`, rent JPY, lat/lng, geocode status)
- [X] T012 Add Better Auth tables in `packages/db/src/schema/auth.ts` (or follow Better Auth + Drizzle generator output) and export from `packages/db/src/schema/index.ts`
- [X] T013 Create `packages/db/src/index.ts` exporting schema types and table objects for `apps/api`
- [X] T014 Add `packages/db/drizzle.config.ts` and generate initial migration under `packages/db/migrations/` — initial SQL under `packages/db/migrations/`; use `DATABASE_URL=... bun run db:migrate` from repo root (or `--cwd packages/db`)
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
- [X] T026 Add `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css` (`tailwindcss` + `uniwind` + Rosé Pine import from `src/styles/rose-pine-tailwind-v4/`), `withUniwind`/`withExpo` in `apps/web/next.config.ts`, and wrap `apps/web/src/app/layout.tsx` with global CSS import + tRPC `Providers`

**Phase 2 — verification checklist** (done in dev):

- [X] Install / lockfile: `bun install` at repo root.
- [X] Static checks: `bun run lint`, `bun run typecheck`.
- [X] DB: migration generated and applied; tables `user`, `session`, `account`, `verification`, `listing`, `property`; enum `geocode_status`.
- [X] API: `GET /health` → `{ "ok": true }`; `GET /api/auth/get-session` → `null` without cookies (200); `GET /trpc/health` → tRPC JSON with `{ ok: true }` (default **`API_LISTEN_PORT=4001`** / **`API_DEV_ORIGIN=http://localhost:4001`**).
- [X] CORS: `OPTIONS` / responses include `Access-Control-Allow-Credentials` and `Vary: Origin` for `BETTER_AUTH_URL` origin.
- [X] Web: `bun run build` in `apps/web` succeeds (Uniwind + Next + PostCSS); `uniwind-types.d.ts` is generated at `apps/web/` when building or running dev.
- Optional: sign-up/sign-in E2E is **US1**; Phase 2 checkpoint is “stack runs.”

**Checkpoint**: API boots with `/health`, auth routes respond, tRPC exposes `health` query, web production build passes — **unblock US1**.

---

## Phase 3: User Story 1 — Secure multi-user access (Priority: P1)

**Goal**: Registration, login, logout, email verification, password reset; sessions via HTTP-only cookies; no listing data yet beyond schema.

**Independent test**: Two accounts cannot see each other’s data once listings exist (verified in US3); for US1 alone, confirm protected routes redirect and sign-out clears session.

- [X] T027 [US1] Add Better Auth client utilities in `apps/web/src/lib/auth-client.ts` (signIn, signUp, signOut, session hooks)
- [X] T028 [P] [US1] Implement `apps/web/src/app/(auth)/login/page.tsx` with email/password form and error display
- [X] T029 [P] [US1] Implement `apps/web/src/app/(auth)/register/page.tsx` with validation messages
- [X] T030 [US1] Add `apps/web/src/app/(app)/layout.tsx` that redirects unauthenticated users to `/login` using session from Better Auth client
- [X] T031 [US1] Add `apps/web/src/components/AuthToolbar.tsx` with current user email and **Sign out** action
- [X] T032 [US1] Configure verification and password-reset email content in `apps/api/src/lib/auth.ts` (templates or hooks) and env-driven SMTP
- [X] T033 [P] [US1] Add `apps/web/src/app/(auth)/forgot-password/page.tsx` and `apps/web/src/app/(auth)/reset-password/page.tsx` wired to Better Auth flows
- [X] T034 [US1] Update `specs/001-tokyo-listings-baseline/quickstart.md` with actual dev ports, cookie same-site notes, and env var table

**Checkpoint**: Manual walkthrough: register → verify (if enabled) → login → access protected page → logout → blocked.

---

## Phase 4: Docker — full stack Compose (blocking before US2)

**Purpose**: **First-class container runtime** for **postgres + api + web** so every later phase can be validated in Docker, not only via local `bun`. Local dev on the host remains supported; this phase adds the **required** Compose wiring and production-oriented Dockerfiles. **Complete before User Story 2 (map).**

**Independent test**: From a clean machine with Docker: `docker compose` brings up DB + API + web; `GET` health on API, open web origin in browser, complete login/register smoke (same-origin cookies / `BETTER_AUTH_URL` documented for container hostnames/ports).

- [ ] T059 Extend `docker/docker-compose.yml` (or root `compose.yaml`) with **`api`** and **`web`** services, shared env / `env_file`, `depends_on` **`postgres`** with **`condition: service_healthy`**, published ports (align API **4001**, web **3000** with `plan.md` / quickstart), and networking so the browser hits the **web** service while API is reachable for health checks and (if needed) direct debugging
- [ ] T064 [P] Replace stub **`docker/Dockerfile.api`** with a multi-stage image that builds/installs the monorepo workspace and runs the API entrypoint (`apps/api`); ensure `DATABASE_URL` and auth env are overridable at runtime
- [ ] T065 [P] Replace stub **`docker/Dockerfile.web`** with a multi-stage image that builds Next (`apps/web` standalone output per Next docs), including **PostCSS** (Tailwind v4 + Uniwind) so `globals.css` and vendored Rosé Pine CSS compile in CI; run with correct **`NEXT_PUBLIC_*`** / server env for API rewrites or internal service URL inside the compose network
- [ ] T066 Add **`docker/README.md`** (or a dedicated section in `quickstart.md` if preferred) documenting: `docker compose up --build`, required env files for Compose, how **`BETTER_AUTH_URL`** matches the **published web URL**, and a short smoke checklist (health + auth)

**Checkpoint**: Full stack runs in Docker; quickstart documents both **host `bun`** workflow and **Compose** workflow.

---

## Phase 5: User Story 2 — Map-first shell (Priority: P2)

**Goal**: Signed-in user sees interactive **Google Map** centered on Tokyo, pan/zoom, empty state (no pins required).

**Independent test**: Open `/map` as signed-in user; pan/zoom works; empty state visible with zero listings. **Re-verify** map + auth in Docker after implementation (same Compose from Phase 4).

- [ ] T035 [US2] Create Jotai atoms in `apps/web/src/state/mapViewport.ts` for center, zoom, and map ready flag
- [ ] T036 [US2] Implement `apps/web/src/components/MapShell.tsx` loading Maps JavaScript API using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and rendering a full-height map
- [ ] T037 [US2] Add `apps/web/src/app/(app)/map/page.tsx` composing `MapShell` with default center near Tokyo Station and zoom level per `labels.ts`
- [ ] T038 [US2] Add `apps/web/src/components/MapEmptyState.tsx` explaining no listings yet with link to add listing (link target can be stub until US3)
- [ ] T039 [US2] Add `apps/web/src/content/labels.ts` for consistent JP/EN strings and **JPY / ㎡** unit hints per constitution

**Checkpoint**: Map loads without console errors; empty state shows when no listings.

---

## Phase 6: User Story 3 — Own listings on the map (Priority: P3)

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

## Phase 7: User Story 4 — Find and narrow listings (Priority: P4)

**Goal**: Combined filters: rent range, station distance cap, interest/tag — server-side filtering; UI drives query input.

**Independent test**: Seed multiple listings; change rent slider/tag; list and markers stay consistent.

- [ ] T048 [US4] Extend Zod list input in `packages/validators/src/listing.ts` with `minRent`, `maxRent`, `tag`, `maxStationDistanceMinutes` (names aligned to `data-model.md`)
- [ ] T049 [US4] Apply Drizzle `where` clauses for filters in `apps/api/src/trpc/routers/listing.ts` `list` procedure
- [ ] T050 [US4] Add `apps/web/src/state/listFilters.ts` Jotai atoms and derive tRPC `listing.list` input from atoms
- [ ] T051 [US4] Build `apps/web/src/components/ListingFilterBar.tsx` and wire into `apps/web/src/app/(app)/listings/page.tsx` with TanStack Query invalidation

**Checkpoint**: Filters narrow both sidebar list and visible markers.

---

## Phase 8: User Story 5 — Listing ingestion and deduplication (Priority: P5)

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

## Phase 9: Polish & cross-cutting concerns

**Purpose**: Documentation, CI lint/typecheck, contract doc sync. **Docker full-stack work is Phase 4, not here.**

- [ ] T058 Add root `README.md` linking `.specify/memory/constitution.md` and `specs/001-tokyo-listings-baseline/spec.md`
- [X] T060 [P] Add root script `lint` running `biome check .` and `typecheck` running `tsc -b` across workspaces — **done** in root `package.json` (`lint`, `typecheck`)
- [ ] T061 Add `.github/workflows/ci.yml` installing Bun, caching, running `bun install`, `bun run lint`, `bun run typecheck`
- [ ] T062 Update `specs/001-tokyo-listings-baseline/contracts/trpc-procedures.md` to match final router procedure names
- [ ] T063 Final pass on `specs/001-tokyo-listings-baseline/quickstart.md` for exact commands (`bun install`, compose up, migrate) and parity with **`docker/README.md`**

---

## Dependencies & execution order

### Phase dependencies

- **Phase 1** → **Phase 2** → **US1 (Phase 3)** → **Phase 4 (Docker full stack)** → **US2** → **US3** → **US4** → **US5** → **Polish (Phase 9)**
- **US2** depends on **US1** and **Phase 4** (Compose must run api + web + postgres before map work proceeds as the default gate)
- **US3+** depend on **US2** for map components/paths (can mock map briefly if needed, not recommended)

### User story dependencies

- **US1**: After Phase 2 only
- **US2**: After US1 and **Phase 4 (Docker)**
- **US3**: After US2 (uses map surface)
- **US4**: After US3 (needs listings)
- **US5**: After US3 (needs listings/property schema); merge UI needs `property` router

### Parallel opportunities

- **Phase 1**: T002–T004, T006–T007 in parallel after T001
- **US1**: T028 and T029 in parallel after T027
- **US1**: T033 parallelizable after T032
- **Phase 4**: T064 and T065 in parallel after T059 defines compose service names and build contexts
- **Polish**: T060 and T061 in parallel after T058

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
3. Complete **Phase 4** (T059–T066) — **full-stack Docker** before map work
4. Then US2 map shell

### Incremental delivery

1. US1 → secure product shell
2. **Phase 4** → Docker parity for api + web + postgres
3. US2 → trust map integration
4. US3 → core product value (listings + pins)
5. US4 → power-user filtering
6. US5 → parity with legacy scraping/dedupe spirit
7. Polish → README, CI, contracts (Docker already done in Phase 4)

---

## Notes

- **IDs**: T001–T063 plus **T064–T066** (Docker phase). Renumber if inserting more; keep chronological order.
- **Security**: Never log passwords, tokens, or raw `DATABASE_URL` in `apps/api` logging.
- **Contracts**: When routers stabilize, mirror exports for `AppRouter` in `packages/api-types` if introduced later (optional; not required above).
- **Docker vs host**: Prefer verifying new features in **both** host `bun` and **Compose** after Phase 4; Phase 4 is the explicit gate before US2.

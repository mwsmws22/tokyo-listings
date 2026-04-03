---
description: "Task list for feature 004 — listing URL scraping"
---

# Tasks: Listing URL scraping and metadata

**Input**: Design documents from `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/listing-scrape-trpc.md](./contracts/listing-scrape-trpc.md)

**Tests**: Included per plan (Vitest for `packages/scraping`, integration for tRPC); parsers/normalization follow test-first where noted.

**Organization**: Phases follow **base scraper → athome → suumo → homes → integration (US1) → US2 → US3 → US4 → polish**, aligned with spec priorities.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no ordering dependency within the same phase)
- **[Story]**: `[US1]`–`[US4]` for user-story phases; omitted for setup, foundational base scraper, and polish

## Path Conventions

Monorepo: `packages/scraping/`, `packages/validators/`, `packages/db/`, `apps/api/src/`, `apps/web/src/`.

---

## Phase 1: Setup (workspace + tooling)

**Purpose**: Add `packages/scraping`, wire tests, env template for scrape tuning.

**Independent test**: `packages/scraping` installs, `bun test` (or `vitest`) runs empty suite.

- [ ] T001 Create `packages/scraping/package.json` with workspace name `@tokyo-listings/scraping`, `src/index.ts` entry, and `tsconfig.json` extending repo TS settings
- [ ] T002 Register `packages/scraping` in root `/home/smbuser/mws-server/tokyo-listings/package.json` workspaces and add path dependency from `apps/api` when wiring is needed
- [ ] T003 Add dependencies in `packages/scraping/package.json`: `cheerio`, `vitest` (and `@types/node` if needed); add `test` script
- [ ] T004 [P] Append scrape-related keys (`SCRAPE_GLOBAL_MAX_CONCURRENT`, `SCRAPE_PER_HOST_MIN_INTERVAL_MS`, `SCRAPE_FETCH_TIMEOUT_MS`, `SCRAPE_MAX_BODY_BYTES`) with comments to `/home/smbuser/mws-server/tokyo-listings/.env.template` and mirror values into local `/home/smbuser/mws-server/tokyo-listings/.env` per project conventions

---

## Phase 2: Foundational — base scraper (no portal HTML yet)

**Purpose**: Shared types, URL canonicalization, polite fetch, normalization pure functions, orchestration entry that returns `unsupported_host` or `fetch_failed` before portal parsers exist.

**⚠️ CRITICAL**: Portal phases depend on this phase.

**Independent test**: Unit tests pass for normalization; `scrapeFromUrl` rejects unknown hosts without calling fetch; fetch path uses timeouts and size cap (mocked).

- [ ] T005 Define `PortalId`, `ScrapeStatus`, `ScrapedListingDraft`, `ScrapeResult` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/types.ts`
- [ ] T006 Implement hostname allowlist and `canonicalizeListingUrl` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/url.ts` (strip tracking params per research; document rules in file comment)
- [ ] T007 Implement `resolvePortalFromUrl` returning portal or null in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts`
- [ ] T008 Add failing Vitest tests for yen/㎡/walk-minute helpers in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/normalize/money-area.test.ts` then implement `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/normalize/money-area.ts` until green
- [ ] T009 [P] Add failing tests then implement Japanese address split wrapper using `jp-address-parser` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/normalize/address.ts` (re-export minimal surface for draft property fields)
- [ ] T010 Implement `createFetchLimiter` (global concurrency + per-host min interval + per-host max in-flight) in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/fetch/limiter.ts` reading env defaults
- [ ] T011 Implement `fetchListingHtml` with `AbortController` timeout, max body bytes, stable User-Agent, and structured error mapping in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/fetch/fetchListingHtml.ts`
- [ ] T012 Wire `scrapeFromUrl` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/scrapeFromUrl.ts`: canonicalize → portal → limiter-wrapped fetch → dispatch to portal parser (stub throws `parse_failed` until Phase 3–5 register real parsers)
- [ ] T013 Export public API from `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/index.ts` and add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/vitest.config.ts` (or root vitest workspace)
- [ ] T014 Add root `/home/smbuser/mws-server/tokyo-listings/package.json` `test` script to run `vitest` for `packages/scraping` (replace placeholder `echo` when ready)

**Checkpoint**: Base pipeline runs; portal-specific extractors still stubs or missing.

---

## Phase 3: Portal — athome.co.jp [US1]

**Goal**: Extract listing draft from Athome detail HTML; fixture regression test.

**Independent test**: `athome.test.ts` passes against committed fixture HTML.

- [ ] T015 [US1] Add minimal redacted `athome-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/athome-detail.sample.html`
- [ ] T016 [US1] Implement `parseAthomeDetail` (pure: html string → partial draft) in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/athome.ts` using `/home/smbuser/mws-server/tokyo-listings-old/tokyo-listings-server/app/services/ScrapingService.js` as selector reference only
- [ ] T017 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/athome.test.ts` asserting golden fields (rent, address, area, station/walk) vs fixture
- [ ] T018 [US1] Register Athome parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `athome` / `www.athome.co.jp` hosts

---

## Phase 4: Portal — suumo.jp [US1]

**Goal**: Suumo detail page parser + fixture test.

**Independent test**: `suumo.test.ts` passes on fixture.

- [ ] T019 [US1] Add `suumo-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/suumo-detail.sample.html`
- [ ] T020 [US1] Implement `parseSuumoDetail` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/suumo.ts` referencing legacy `parseSuumo` in ScrapingService.js
- [ ] T021 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/suumo.test.ts` with golden assertions
- [ ] T022 [US1] Register Suumo parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `suumo.jp` / `www.suumo.jp`

---

## Phase 5: Portal — LIFULL HOME'S (homes.co.jp) [US1]

**Goal**: Homes detail parser + fixture test.

**Independent test**: `homes.test.ts` passes on fixture.

- [ ] T023 [US1] Add `homes-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/homes-detail.sample.html`
- [ ] T024 [US1] Implement `parseLifullHomesDetail` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/homes.ts` referencing legacy `parseLifullHomes`
- [ ] T025 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/homes.test.ts` with golden assertions
- [ ] T026 [US1] Register Homes parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `www.homes.co.jp` / `homes.co.jp`

**Checkpoint**: All three portals extract on fixtures; `scrapeFromUrl` returns `ok` or `partial` with warnings for fixture URLs.

---

## Phase 6: User Story 1 — End-to-end prefill + persist (API, DB, web)

**Goal**: Operator pastes supported URL → preview populates form → save writes listing with provenance and duplicate URL rule.

**Independent test**: Manual or E2E: preview tRPC + create listing; DB row has `sourceUrl`, `sourceFetchedAt`, optional `sourcePortal`.

- [ ] T027 [US1] Add Zod schemas `scrapingPreviewInputSchema`, `scrapingPreviewOutputSchema` (discriminated union) in `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/scraping.ts` and export from `packages/validators/package.json` entry
- [ ] T028 [US1] Map `ScrapeResult` draft fields to `listingCreateSchema` partial shape in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/scraping/mapDraftToListingInput.ts`
- [ ] T029 [US1] Implement `listing.previewFromUrl` in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` calling `scrapeFromUrl` with user id for logging only; return Zod-safe output
- [ ] T030 [US1] Add Drizzle migration under `/home/smbuser/mws-server/tokyo-listings/packages/db/migrations/` for partial unique index on `(userId, sourceUrl)` where `sourceUrl` is not null and optional `sourcePortal` text column on `listing` per [data-model.md](./data-model.md); update `/home/smbuser/mws-server/tokyo-listings/packages/db/src/schema/listings.ts`
- [ ] T031 [US1] On `listing.create` in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts`, enforce duplicate `sourceUrl` per user with `CONFLICT`-style error; set `sourceFetchedAt` when created from scrape flow if passed in input
- [ ] T032 [P] [US1] Extend `listingCreateSchema` / input type if needed for `sourcePortal` and scrape timestamp in `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/listing.ts`
- [ ] T033 [US1] Wire add-listing UI: trigger preview (button or blur), merge draft into form state, show loading/error in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` and parent route under `/home/smbuser/mws-server/tokyo-listings/apps/web/src/app/`
- [ ] T034 [US1] Add TanStack Query hook for `previewFromUrl` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/lib/trpc/` (or equivalent client module)
- [ ] T035 [P] [US1] Add integration test for `previewFromUrl` with mocked upstream HTML in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.preview.integration.test.ts` or `packages/scraping` boundary
- [ ] T036 [US1] Align `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/contracts/listing-scrape-trpc.md` with final procedure names and Zod types

**Checkpoint (MVP)**: US1 complete — three portals + save + duplicate URL.

---

## Phase 7: User Story 2 — Failures and partial extraction UX

**Goal**: Unsupported host, fetch/parse errors, and partial fills never look like full success; form state preserved.

**Independent test**: Trigger each error type; UI shows message; manual fields intact.

- [ ] T037 [US2] Normalize API errors: map `unsupported_host`, `fetch_failed`, `parse_failed` to stable `TRPCError` codes/messages in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` (no raw upstream body)
- [ ] T038 [US2] Add user-visible banners for `partial` vs `ok` and field-level hints from `fieldErrors` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx`
- [ ] T039 [US2] Add Vitest or component test for merge logic preserving user-typed fields when a second preview fails in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/` (or extract pure helper tested in `*.test.ts`)

---

## Phase 8: User Story 3 — Duplicate address → link listing to existing property

**Goal**: When saving, suggest linking to an existing property if normalized address matches; user can confirm or decline.

**Independent test**: Two listings same address → second prompts → DB shows shared `propertyId` when accepted.

- [ ] T040 [US3] Implement address-normalization match query (same user) in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/property-matching.ts` using existing `property` columns
- [ ] T041 [US3] Extend `listing.create` input with optional `linkToPropertyId` or pre-check procedure in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` per contract decision
- [ ] T042 [US3] Add confirmation modal flow on add-listing submit when match candidates exist in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/` and add page route

---

## Phase 9: User Story 4 — Adjust map pin after geocode

**Goal**: User refines coordinates after automatic geocode; persisted on listing/property per spec P4.

**Independent test**: Move pin, save, reload map → marker at new position.

- [ ] T043 [US4] Ensure geocoded coordinates flow from add form and `geocodeStatus` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` matches create/update behavior
- [ ] T044 [US4] Implement draggable marker or “set pin” map interaction on add/edit listing map surface in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/shell/ListingsMapWorkspace.tsx` (or dedicated map component) writing lat/lng + `pinExact` / manual geocode status via `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` `update`
- [ ] T045 [US4] Persist `pinExact` and coordinates on `property`/`listing` per existing schema in `/home/smbuser/mws-server/tokyo-listings/packages/db/src/schema/listings.ts` and validators

---

## Phase 10: Polish & cross-cutting

**Purpose**: Observability, docs, optional dev script for live URLs.

- [ ] T046 [P] Add structured scrape logs (portal, hostname, ms, outcome code) in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` using existing `pino` logger
- [ ] T047 [P] Add optional CLI or `bun run scripts/scrape-debug.ts` at `/home/smbuser/mws-server/tokyo-listings/scripts/scrape-debug.ts` that calls `scrapeFromUrl` with argv URL for manual loop (document in quickstart)
- [ ] T048 [P] Update `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/quickstart.md` with final test commands and env keys
- [ ] T049 Run through `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/quickstart.md` manually and fix gaps
- [ ] T050 [P] Biome check touched packages: run `/home/smbuser/mws-server/tokyo-listings/package.json` `lint` after implementation

---

## Dependencies & Execution Order

### Phase dependencies

| Phase | Depends on |
|-------|------------|
| 1 Setup | — |
| 2 Base scraper | Phase 1 |
| 3 Athome | Phase 2 |
| 4 Suumo | Phase 3 (can parallel with 3 only after dispatch pattern exists — **sequential recommended**: 3 → 4 → 5) |
| 5 Homes | Phase 4 |
| 6 US1 integration | Phase 5 |
| 7 US2 | Phase 6 |
| 8 US3 | Phase 6 (can overlap with 7 after API stable) |
| 9 US4 | Phase 6 (independent of 7–8 for map-only work) |
| 10 Polish | Phases 6–9 as needed |

### User story completion order

1. **US1**: Phases 1–6 (MVP when Phase 6 done)
2. **US2**: Phase 7
3. **US3**: Phase 8
4. **US4**: Phase 9

### Parallel opportunities

- **T004** with **T001–T003** (env template vs package files) after paths agreed
- **T009** parallel with **T008** once types exist (different files)
- **T032** parallel with **T030–T031** (validators vs migration) with coordination on field names
- **T035** parallel with **T033–T034** after API contract stable
- **T046–T048** parallel in Phase 10

### Parallel example: Phase 3 (Athome)

```text
Sequential: T015 fixture → T016 parser → T017 test → T018 dispatch
```

### Parallel example: Normalization (Phase 2)

```text
T008 money-area tests+impl || T009 address tests+impl (after T005–T007 types)
```

---

## Implementation Strategy

### MVP (US1 only)

1. Complete Phases **1–6** (T001–T036).
2. Stop and validate: three portals + preview + save + duplicate URL + fixtures green.

### Incremental delivery

1. **1–2**: Base scraper ready for portal plugins.
2. **3–5**: One portal at a time; keep CI green after each.
3. **6**: Wire product-facing flow.
4. **7**: Harden failure UX.
5. **8–9**: Legacy parity for property link and pin.

### Suggested sequencing (matches user request)

**Base scraper (Phase 2) → Athome (3) → Suumo (4) → Homes (5) → everything else (6–10).**

---

## Notes

- Legacy code path: `/home/smbuser/mws-server/tokyo-listings-old/tokyo-listings-server/app/services/ScrapingService.js` — reference only.
- Images / asset download: **out of scope**; do not add tasks until a future spec.
- Total tasks: **50** (T001–T050).

---
description: "Task list for feature 004 — listing URL scraping"
---

# Tasks: Listing URL scraping and metadata

**Input**: Design documents from `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/listing-scrape-trpc.md](./contracts/listing-scrape-trpc.md)

**Tests**: Included per plan (Vitest for `packages/scraping`, integration for tRPC); parsers/normalization follow test-first where noted.

**Organization**: Phases follow **base scraper → Node LTS + Vitest (2.5) → athome → suumo → homes → integration (US1) → US2 → US3 → US4 → polish**, aligned with spec priorities.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no ordering dependency within the same phase)
- **[Story]**: `[US1]`–`[US4]` for user-story phases; omitted for setup, foundational base scraper, and polish

## Path Conventions

Monorepo: `packages/scraping/`, `packages/validators/`, `packages/db/`, `apps/api/src/`, `apps/web/src/`.

---

## Phase 1: Setup (workspace + tooling)

**Purpose**: Add `packages/scraping`, wire tests, env template for scrape tuning.

**Independent test**: `packages/scraping` installs, `bun test` (or `vitest`) runs empty suite.

- [x] T001 Create `packages/scraping/package.json` with workspace name `@tokyo-listings/scraping`, `src/index.ts` entry, and `tsconfig.json` extending repo TS settings
- [x] T002 Register `packages/scraping` in root `/home/smbuser/mws-server/tokyo-listings/package.json` workspaces and add path dependency from `apps/api` when wiring is needed
- [x] T003 Add dependencies in `packages/scraping/package.json`: `cheerio`, `vitest` (and `@types/node` if needed); add `test` script
- [x] T004 [P] Append scrape-related keys (`SCRAPE_GLOBAL_MAX_CONCURRENT`, `SCRAPE_PER_HOST_MIN_INTERVAL_MS`, `SCRAPE_FETCH_TIMEOUT_MS`, `SCRAPE_MAX_BODY_BYTES`) with comments to `/home/smbuser/mws-server/tokyo-listings/.env.template` and mirror values into local `/home/smbuser/mws-server/tokyo-listings/.env` per project conventions

---

## Phase 2: Foundational — base scraper (no portal HTML yet)

**Purpose**: Shared types, URL canonicalization, polite fetch, normalization pure functions, orchestration entry that returns `unsupported_host` or `fetch_failed` before portal parsers exist.

**⚠️ CRITICAL**: Portal phases depend on this phase.

**Independent test**: Unit tests pass for normalization; `scrapeFromUrl` rejects unknown hosts without calling fetch; fetch path uses timeouts and size cap (mocked).

- [x] T005 Define `PortalId`, `ScrapeStatus`, `ScrapedListingDraft`, `ScrapeResult` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/types.ts`
- [x] T006 Implement hostname allowlist and `canonicalizeListingUrl` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/url.ts` (strip tracking params per research; document rules in file comment)
- [x] T007 Implement `resolvePortalFromUrl` returning portal or null in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts`
- [x] T008 Add failing Vitest tests for yen/㎡/walk-minute helpers in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/normalize/money-area.test.ts` then implement `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/normalize/money-area.ts` until green
- [x] T009 [P] Add failing tests then implement Japanese address split wrapper using `jp-address-parser` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/normalize/address.ts` (re-export minimal surface for draft property fields)
- [x] T010 Implement `createFetchLimiter` (global concurrency + per-host min interval + per-host max in-flight) in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/fetch/limiter.ts` reading env defaults
- [x] T011 Implement `fetchListingHtml` with `AbortController` timeout, max body bytes, stable User-Agent, and structured error mapping in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/fetch/fetchListingHtml.ts`
- [x] T012 Wire `scrapeFromUrl` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/scrapeFromUrl.ts`: canonicalize → portal → limiter-wrapped fetch → dispatch to portal parser (stub throws `parse_failed` until Phase 3–5 register real parsers)
- [x] T013 Export public API from `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/index.ts` and add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/vitest.config.ts` (or root vitest workspace)
- [x] T014 Add root `/home/smbuser/mws-server/tokyo-listings/package.json` `test` script to run `vitest` for `packages/scraping` (replace placeholder `echo` when ready)

**Checkpoint**: Base pipeline runs; portal-specific extractors still stubs or missing.

---

## Phase 2.5: Toolchain — system Node.js (LTS) + Vitest (unblock portal work)

**Purpose**: The scraping package temporarily used `bun:test` because the SSH/dev host had **Node 12** (Vitest cannot run). Before **Phase 3+**, upgrade the **system `node`** on that host to the **latest Node.js Active LTS** and restore the **original plan: Vitest** for `packages/scraping` unit tests.

**Independent test**: `node -v` reports current Active LTS; `cd packages/scraping && npx vitest run` (or `bunx vitest run`) passes all tests; root `bun run test` still green.

- [x] T015 Upgrade the development/CI host’s **system Node.js** to the **latest Active LTS** (e.g. via `nvm`, `fnm`, or OS packages). Document the required major version and install path in `/home/smbuser/mws-server/tokyo-listings/README.md` or `/home/smbuser/mws-server/tokyo-listings/docs/dev-environment.md` (new file if needed) so SSH sessions and CI use a compatible `node` for Vitest.
- [x] T016 Restore **Vitest** for `packages/scraping`: add `vitest` to `/home/smbuser/mws-server/tokyo-listings/packages/scraping/package.json` devDependencies; add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/vitest.config.ts`; change imports in `*.test.ts` from `bun:test` to `vitest`; set `test` script to `vitest run`; update `/home/smbuser/mws-server/tokyo-listings/package.json` root `test` script if needed; trim `@types/bun` from scraping package if it was only for `bun:test` (keep only if still required).
- [x] T017 Run `/home/smbuser/mws-server/tokyo-listings/package.json` `test`, `typecheck`, and `lint`; fix any regressions from the Vitest migration.

**Checkpoint**: Node LTS + Vitest match [plan.md](./plan.md); safe to continue **Phase 3** (portal parsers).

---

## Phase 3: Portal — athome.co.jp [US1]

**Goal**: Extract listing draft from Athome detail HTML; fixture regression test.

**Independent test**: `athome.test.ts` passes against committed fixture HTML.

- [x] T018 [US1] Add minimal redacted `athome-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/athome-detail.sample.html`
- [x] T019 [US1] Implement `parseAthomeDetail` (pure: html string → partial draft) in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/athome.ts` using `/home/smbuser/mws-server/tokyo-listings-old/tokyo-listings-server/app/services/ScrapingService.js` as selector reference only
- [x] T020 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/athome.test.ts` asserting golden fields (rent, address, area, station/walk) vs fixture
- [x] T021 [US1] Register Athome parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `athome` / `www.athome.co.jp` hosts

---

## Phase 4: Portal — suumo.jp [US1]

**Goal**: Suumo detail page parser + fixture test.

**Independent test**: `suumo.test.ts` passes on fixture.

- [x] T022 [US1] Add `suumo-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/suumo-detail.sample.html`
- [x] T023 [US1] Implement `parseSuumoDetail` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/suumo.ts` referencing legacy `parseSuumo` in ScrapingService.js
- [x] T024 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/suumo.test.ts` with golden assertions
- [x] T025 [US1] Register Suumo parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `suumo.jp` / `www.suumo.jp`

---

## Phase 5: Portal — LIFULL HOME'S (homes.co.jp) [US1]

**Goal**: Homes detail parser + fixture test.

**Independent test**: `homes.test.ts` passes on fixture.

- [x] T026 [US1] Add `homes-detail.sample.html` under `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/fixtures/homes-detail.sample.html`
- [x] T027 [US1] Implement `parseLifullHomesDetail` in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/portals/homes.ts` referencing legacy `parseLifullHomes`
- [x] T028 [US1] Add `/home/smbuser/mws-server/tokyo-listings/packages/scraping/test/portals/homes.test.ts` with golden assertions
- [x] T029 [US1] Register Homes parser in `/home/smbuser/mws-server/tokyo-listings/packages/scraping/src/core/dispatch.ts` for `www.homes.co.jp` / `homes.co.jp`

**Checkpoint**: All three portals extract on fixtures; `scrapeFromUrl` returns `ok` or `partial` with warnings for fixture URLs.

---

## Phase 6: User Story 1 — End-to-end prefill + persist (API, DB, web)

**Goal**: Operator pastes supported URL → preview populates form → save writes listing with provenance and duplicate URL rule.

**Independent test**: Manual or E2E: preview tRPC + create listing; DB row has `sourceUrl`, `sourceFetchedAt`, optional `sourcePortal`.

- [x] T030 [US1] Add Zod schemas `scrapingPreviewInputSchema`, `scrapingPreviewOutputSchema` (discriminated union) in `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/scraping.ts` and export from `packages/validators/package.json` entry
- [x] T031 [US1] Map `ScrapeResult` draft fields to `listingCreateSchema` partial shape in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/scraping/mapDraftToListingInput.ts`
- [x] T032 [US1] Implement `listing.previewFromUrl` in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` calling `scrapeFromUrl` with user id for logging only; return Zod-safe output
- [x] T033 [US1] Add Drizzle migration under `/home/smbuser/mws-server/tokyo-listings/packages/db/migrations/` for partial unique index on `(userId, sourceUrl)` where `sourceUrl` is not null and optional `sourcePortal` text column on `listing` per [data-model.md](./data-model.md); update `/home/smbuser/mws-server/tokyo-listings/packages/db/src/schema/listings.ts`
- [x] T034 [US1] On `listing.create` in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts`, enforce duplicate `sourceUrl` per user with `CONFLICT`-style error; set `sourceFetchedAt` when created from scrape flow if passed in input
- [x] T035 [P] [US1] Extend `listingCreateSchema` / input type if needed for `sourcePortal` and scrape timestamp in `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/listing.ts`
- [x] T036 [US1] Wire add-listing UI: trigger preview (button or blur), merge draft into form state, show loading/error in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` and parent route under `/home/smbuser/mws-server/tokyo-listings/apps/web/src/app/`
- [x] T037 [US1] Add TanStack Query hook for `previewFromUrl` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/lib/trpc/` (or equivalent client module)
- [x] T038 [P] [US1] Add integration test for `previewFromUrl` with mocked upstream HTML in `/home/smbuser/mws-server/tokyo-listings/apps/api/test/trpc/routers/listing.preview.integration.test.ts` or `packages/scraping` boundary
- [x] T039 [US1] Align `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/contracts/listing-scrape-trpc.md` with final procedure names and Zod types

**Checkpoint (MVP)**: US1 complete — three portals + save + duplicate URL.

---

## Phase 7: User Story 2 — Failures and partial extraction UX

**Goal**: Unsupported host, fetch/parse errors, and partial fills never look like full success; form state preserved.

**Independent test**: Trigger each error type; UI shows message; manual fields intact.

- [x] T040 [US2] Normalize API errors: map `unsupported_host`, `fetch_failed`, `parse_failed` to stable `TRPCError` codes/messages in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` (no raw upstream body)
- [x] T041 [US2] Add user-visible banners for `partial` vs `ok` and field-level hints from `fieldErrors` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx`
- [x] T042 [US2] Add Vitest or component test for merge logic preserving user-typed fields when a second preview fails in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/` (or extract pure helper tested in `*.test.ts`)

---

## Phase 8: User Story 3 — Similar-property detection + add-page property picker UX

**Goal**: Replace “check DB” with a collapsed similar-property entry point (building icon). When address similarity exists, user can open a slick animated popup, inspect candidates, and selecting a candidate mirrors existing map/right-panel property selection behavior.

**Independent test**: On add page with matching address, icon becomes active, popup lists candidates, selecting one highlights property in map + right panel exactly like home/recent selection.

- [x] T043 [US3] Implement same-user property similarity query by normalized address in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/property-matching.ts` returning property summary cards suitable for popup list
- [x] T044 [US3] Analyze legacy duplicate-address/property-linking behavior in `/home/smbuser/mws-server/tokyo-listings-old/tokyo-listings-server/` and port the address-matching algorithm/threshold rules into `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/property-matching.ts` (document any intentional deviations inline)
- [x] T045 [US3] Add tRPC read procedure (e.g. `listing.findSimilarProperties`) in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` that accepts current draft address + `squareM`, returns candidates from **address-matched properties only**, and ranks by closest area using absolute diff between scraped `squareM` and per-property average listing `squareM` (average rounded to 2 decimals); follow legacy behavior if materially similar, otherwise pause implementation and summarize legacy-vs-new diff for developer direction
- [x] T046 [US3] Remove “check DB” control and add collapsed building-icon trigger in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx`; show greyed-out state when no candidates
- [x] T047 [US3] Implement animated popup open/close + candidate list interactions in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/` (new component file) with smooth transition and keyboard-close support
- [x] T048 [US3] Wire candidate selection from popup into existing map/right-panel selection state in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/shell/ListingsMapWorkspace.tsx` and add-page container so behavior matches home/recently-added selection flow
- [x] T049 [P] [US3] Add component/integration test for popup states (no match/has match/selected) in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/` test file

---

## Phase 8.5: Similar-properties popup — map-anchored layout + density

**Goal**: Float the similar-properties list over the map, anchored to the 🏢 control (top-aligned, to the right of the button); no page dimming; toggle closed by pressing 🏢 again; condensed rows (address + ㎡ + clear rank/delta); remove redundant subtitle and footer close control.

**Independent test**: Open add listing, get candidates; panel appears beside 🏢 over map without backdrop; 🏢 toggles; list is compact and ordered meaningfully.

- [x] T064 [US3] Anchor similar-properties panel with `fixed` positioning from measured 🏢 bounds (top-align; prefer right of button with viewport clamp) via portal in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/SimilarPropertiesPicker.tsx` and ref wiring from `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` + `/home/smbuser/mws-server/tokyo-listings/apps/web/src/app/(app)/listings/add/page.tsx`
- [x] T065 [US3] Remove modal backdrop/dimming and remove separate close row; close only by toggling 🏢 (and keep selection closing panel) in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/SimilarPropertiesPicker.tsx` and add-page toggle handler
- [x] T066 [US3] Condense candidate rows to single tight line: rank + address + ㎡; optional muted ±㎡ vs draft when `areaDiffAbs` present; drop subtitle, second address line, listing count, and “avg” copy in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/SimilarPropertiesPicker.tsx`
- [x] T067 [P] [US3] Adjust or add unit tests for pure helpers if extracted in `/home/smbuser/mws-server/tokyo-listings/apps/web/test/lib/` (optional: layout-only remains manual)

---

## Phase 8.6: Property ↔ listings 1:N — correct right-panel listing list

**Goal**: Enforce the data model mentally and in UI: each listing belongs to one `property`; a property has many listings. The home left list selects a **listing** (whose pin/property groups the unit); the right panel “Listings” table must list **only listings sharing that listing’s `propertyId`**, not every listing in the DB. Optional: fix dummy/seed rows so multiple properties have distinct listing sets for manual QA.

**Independent test**: With ≥2 properties each having ≥1 listing, select listings from different rows on the home list; the right panel listing sub-list and counts change per property; switching between listings under the same property keeps the same sibling set.

- [x] T068 [US3] Confirm `listing.propertyId` → `property.id` usage in `/home/smbuser/mws-server/tokyo-listings/packages/db/src/schema/listings.ts` and `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` list/get payloads; document 1:N in `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/data-model.md` if not already explicit
- [x] T069 [US3] In `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingDetailPanel.tsx`, derive `propertyListings` from full `listing.list` data filtered by `row.property?.id`, render the scroll list from `propertyListings` only, and fix header index copy to be scoped to that property (not global list index)
- [x] T070 [P] [US3] If dummy data ties every listing to one property, add or adjust SQL/seed or dev insert script under `/home/smbuser/mws-server/tokyo-listings/packages/db/` (or documented one-off) so multiple properties have distinct listings for local verification

---

## Phase 9: User Story 3 — Explicit association on save + property field lock rules

**Goal**: Default remains “new property per listing”; when a candidate is selected and user explicitly confirms “associate to this property,” save links listing to that property and enforces immutable property fields with missing-part fill-in only.

**Independent test**: With selected candidate but no confirm checkbox, save creates new property; with confirm checked, listing links to existing property and non-empty property address/type fields are locked against overwrite.

- [ ] T050 [US3] Extend create payload contract in `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/listing.ts` and `/home/smbuser/mws-server/tokyo-listings/packages/validators/src/scraping.ts` with `selectedPropertyId` + explicit `associateToSelectedProperty` flag
- [ ] T051 [US3] Update add-listing submit flow in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` to send selected property id plus explicit association choice (checkbox/toggle) and keep default as new property
- [ ] T052 [US3] Implement `listing.create` association branch in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts`: if confirmed, attach listing to selected property; otherwise create new property as before
- [ ] T053 [US3] Enforce property-field immutability rules in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` and helper under `/home/smbuser/mws-server/tokyo-listings/apps/api/src/lib/`: property type cannot be modified when linking; address parts cannot overwrite non-empty stored values; allow filling only missing address parts (e.g. unknown house number)
- [ ] T054 [US3] Lock/disallow editing property-bound fields in add UI when association is confirmed in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` (keep listing fields editable: rent/reikin/shikikin/area/station/walk/availability)
- [ ] T055 [P] [US3] Add API integration tests for associate-vs-new behavior and missing-address-part merge logic in `/home/smbuser/mws-server/tokyo-listings/apps/api/test/trpc/routers/listing.preview.integration.test.ts` (or new `listing.create.association.integration.test.ts`)

---

## Phase 10: User Story 4 — Adjust map pin after geocode

**Goal**: User refines coordinates after automatic geocode; persisted on listing/property per spec P4.

**Independent test**: Move pin, save, reload map → marker at new position.

- [ ] T056 [US4] Ensure geocoded coordinates flow from add form and `geocodeStatus` in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/listing/ListingFormParity.tsx` matches create/update behavior
- [ ] T057 [US4] Implement draggable marker or “set pin” map interaction on add/edit listing map surface in `/home/smbuser/mws-server/tokyo-listings/apps/web/src/components/shell/ListingsMapWorkspace.tsx` (or dedicated map component) writing lat/lng + `pinExact` / manual geocode status via `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` `update`
- [ ] T058 [US4] Persist `pinExact` and coordinates on `property`/`listing` per existing schema in `/home/smbuser/mws-server/tokyo-listings/packages/db/src/schema/listings.ts` and validators

---

## Phase 11: Polish & cross-cutting

**Purpose**: Observability, docs, optional dev script for live URLs.

- [ ] T059 [P] Add structured scrape logs (portal, hostname, ms, outcome code) in `/home/smbuser/mws-server/tokyo-listings/apps/api/src/trpc/routers/listing.ts` using existing `pino` logger
- [ ] T060 [P] Add optional CLI or `bun run scripts/scrape-debug.ts` at `/home/smbuser/mws-server/tokyo-listings/scripts/scrape-debug.ts` that calls `scrapeFromUrl` with argv URL for manual loop (document in quickstart)
- [ ] T061 [P] Update `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/quickstart.md` with final test commands and env keys
- [ ] T062 Run through `/home/smbuser/mws-server/tokyo-listings/specs/004-listing-url-scraping/quickstart.md` manually and fix gaps
- [ ] T063 [P] Biome check touched packages: run `/home/smbuser/mws-server/tokyo-listings/package.json` `lint` after implementation

---

## Dependencies & Execution Order

### Phase dependencies

| Phase | Depends on |
|-------|------------|
| 1 Setup | — |
| 2 Base scraper | Phase 1 |
| 2.5 Node LTS + Vitest | Phase 2 (do **before** Phase 3 portal work) |
| 3 Athome | Phases 1–2 and **2.5** |
| 4 Suumo | Phase 3 (can parallel with 3 only after dispatch pattern exists — **sequential recommended**: 3 → 4 → 5) |
| 5 Homes | Phase 4 |
| 6 US1 integration | Phase 5 |
| 7 US2 | Phase 6 |
| 8 US3 (picker UX) | Phase 6 (can overlap with 7 after API stable) |
| 8.5 Similar popup polish | Phase 8 |
| 8.6 Property listing scope | Phase 8.5 |
| 9 US3 (association rules) | Phase 8.6 |
| 10 US4 | Phase 6 (independent of 7–9 for map-only work) |
| 11 Polish | Phases 6–10 as needed |

### User story completion order

1. **US1**: Phases 1–6 including **2.5** (MVP when Phase 6 done)
2. **US2**: Phase 7
3. **US3**: Phases 8–8.5–8.6–9
4. **US4**: Phase 10

### Parallel opportunities

- **T004** with **T001–T003** (env template vs package files) after paths agreed
- **T009** parallel with **T008** once types exist (different files)
- **T035** parallel with **T033–T034** (validators vs migration) with coordination on field names
- **T038** parallel with **T036–T037** after API contract stable
- **T059–T061** parallel in Phase 11

### Parallel example: Phase 3 (Athome)

```text
Sequential: T018 fixture → T019 parser → T020 test → T021 dispatch
```

### Parallel example: Normalization (Phase 2)

```text
T008 money-area tests+impl || T009 address tests+impl (after T005–T007 types)
```

---

## Implementation Strategy

### MVP (US1 only)

1. Complete Phases **1–6** (T001–T039), including **Phase 2.5** (T015–T017).
2. Stop and validate: three portals + preview + save + duplicate URL + fixtures green.

### Incremental delivery

1. **1–2**: Base scraper ready for portal plugins.
2. **2.5**: Node Active LTS + Vitest restored (per [plan.md](./plan.md)).
3. **3–5**: One portal at a time; keep CI green after each.
4. **6**: Wire product-facing flow.
5. **7**: Harden failure UX.
6. **8–8.5–8.6–9**: Property matching popup + popup polish + property-scoped listing panel + explicit association rules/field locks.
7. **10**: Map pin parity.

### Suggested sequencing (matches user request)

**Base scraper (Phase 2) → Node LTS + Vitest (2.5) → Athome (3) → Suumo (4) → Homes (5) → everything else (6–10).**

---

## Notes

- Legacy code path: `/home/smbuser/mws-server/tokyo-listings-old/tokyo-listings-server/app/services/ScrapingService.js` — reference only.
- Images / asset download: **out of scope**; do not add tasks until a future spec.
- Total tasks: **70** (T001–T063, T064–T067, T068–T070). **Phase 2.5** (T015–T017) restores Vitest per [plan.md](./plan.md) after upgrading system Node off v12.

# Tasks: Listing UI Parity POC

**Input**: Design documents from `/specs/003-listing-ui-parity/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/listing-trpc.md](./contracts/listing-trpc.md), [quickstart.md](./quickstart.md)

**Tests**: No standalone test tasks unless noted; Vitest **test-first** applies only to `apps/api/src/lib/listing-filters.ts` per plan.

**Organization**: Phases follow user story priorities from [spec.md](./spec.md) (US1 → US2 → US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: US1 / US2 / US3 — user story phase tasks only

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Glossary and shared constants so labels and enums stay consistent across web and validators.

- [x] T001 Create bilingual listing field label map in `apps/web/src/content/listing-fields.ts` aligned with `specs/003-listing-ui-parity/data-model.md`
- [x] T002 [P] Add shared availability/property-type/interest string constants (or Zod enums) in `packages/validators/src/listing.ts` or new `packages/validators/src/listing-enums.ts`
- [x] T003 [P] Add display helpers for rent (JPY) and area (㎡) in `apps/web/src/lib/listing-display.ts` for consistent list/detail formatting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migrations, validation, and API procedures required before any user story UI can ship.

**⚠️ CRITICAL**: No user story work until this phase completes.

- [x] T004 Extend Drizzle `listing` and `property` column definitions in `packages/db/src/schema/listings.ts` per `specs/003-listing-ui-parity/data-model.md`
- [x] T005 Generate and commit Drizzle migration under `packages/db/` for new columns; verify `drizzle.config.ts` and local apply path
- [x] T006 Extend Zod `listingCreateSchema`, `listingUpdateSchema`, and `listingListSchema` in `packages/validators/src/listing.ts` for parity fields and filter inputs per `specs/003-listing-ui-parity/contracts/listing-trpc.md`
- [x] T007 Write failing Vitest tests in `apps/api/test/lib/listing-filters.test.ts` for pure filter composition, then implement matching logic in `apps/api/src/lib/listing-filters.ts`
- [x] T008 Update `listing.list` in `apps/api/src/trpc/routers/listing.ts` to accept filter DTO, join `property` when needed, and apply AND semantics server-side
- [x] T009 Update `listing.create` and `listing.update` in `apps/api/src/trpc/routers/listing.ts` to persist parity fields and create/update linked `property` rows when structured address fields are provided
- [x] T010 Update `listing.getById` in `apps/api/src/trpc/routers/listing.ts` to return listing plus joined property fields for the detail panel
- [x] T011 Run `bun run typecheck` from repository root and fix any `AppRouter` inference issues in `apps/web/src/types/trpc.ts` indirectly via router types

**Checkpoint**: API supports filtered list + rich create/update + joined get; web types infer new shape.

---

## Phase 3: User Story 1 — Browse and Filter Listings on Home (Priority: P1) 🎯 MVP

**Goal**: Authenticated home shows current listings with legacy-style filters on the left and a scrollable result list.

**Independent Test**: Seed multiple listings; toggle filters and address segments; verify only matching rows appear and empty state works when nothing matches.

- [x] T012 [US1] Replace placeholder content in `apps/web/src/app/(app)/page.tsx` with a three-region responsive shell: left column (filters), middle column (list), optional right region placeholder for later detail panel integration
- [x] T013 [P] [US1] Implement filter controls component in `apps/web/src/components/home/HomeListingFilters.tsx` (property type, availability, interest toggles; prefecture through block text inputs) wired to local state
- [x] T014 [P] [US1] Implement scrollable results list component in `apps/web/src/components/home/HomeListingList.tsx` showing summary columns comparable to legacy (rent, area, fees, station/walk)
- [x] T015 [US1] Connect `trpc.listing.list.useQuery` in `apps/web/src/app/(app)/page.tsx` (or a colocated hook file `apps/web/src/hooks/useFilteredListings.ts`) passing filter DTO derived from `HomeListingFilters` state
- [x] T016 [US1] Add empty-state and loading UI in `apps/web/src/components/home/HomeListingList.tsx` when no rows match or query is pending

**Checkpoint**: Home browse + filter works end-to-end against the API without map zoom requirements.

---

## Phase 4: User Story 2 — Add Listing on Dedicated Entry Page (Priority: P2)

**Goal**: Dedicated route for creating listings with full parity fields and in-session recent history that clears when leaving the route.

**Independent Test**: Submit valid/invalid data; verify validation messages; submit multiple times; navigate away and back to confirm history reset.

- [x] T017 [US2] Create route file `apps/web/src/app/(app)/listings/add/page.tsx` rendering the add flow only (no duplicate home list)
- [x] T018 [P] [US2] Implement parity form UI in `apps/web/src/components/listing/ListingFormParity.tsx` with fields from `specs/003-listing-ui-parity/data-model.md` (listing URL optional; no scraping calls)
- [x] T019 [US2] Wire `trpc.listing.create.useMutation` in `ListingFormParity.tsx` to send expanded create DTO matching `packages/validators/src/listing.ts`
- [x] T020 [US2] Maintain recent submission history in React state in `apps/web/src/app/(app)/listings/add/page.tsx` (newest first), cleared on unmount via `useEffect` cleanup when navigating away
- [x] T021 [US2] Render recent history list in `apps/web/src/app/(app)/listings/add/page.tsx` using compact rows that can be tapped for selection in US3
- [x] T022 [US2] Add submit debounce or disabled state on `ListingFormParity.tsx` primary action to prevent duplicate creates from rapid clicks

**Checkpoint**: Add page works independently; recent history behavior matches spec FR-005/FR-006.

---

## Phase 5: User Story 3 — Map-Centered Inspection from Either Page (Priority: P3)

**Goal**: Selecting a listing from home or add flow zooms the map and opens a right-hand detail panel; switching selection updates panel content without full reload.

**Independent Test**: Select listings with and without coordinates; verify zoom behavior and placeholder when location missing; switch selection repeatedly.

- [x] T023 [US3] Extract or compose shared map + detail layout in `apps/web/src/components/shell/ListingsMapWorkspace.tsx` (or split files under `apps/web/src/components/shell/`) consumed by `apps/web/src/app/(app)/page.tsx` and `apps/web/src/app/(app)/listings/add/page.tsx`
- [x] T024 [P] [US3] Implement `apps/web/src/components/listing/ListingDetailPanel.tsx` displaying all parity fields with consistent missing-value placeholders
- [x] T025 [P] [US3] Add selection state module `apps/web/src/state/selectedListing.ts` using Jotai atoms (or equivalent) for `selectedListingId` and cached row data shared across routes
- [x] T026 [US3] Update `apps/web/src/components/MapShell.tsx` usage via a thin coordinator `apps/web/src/components/map/MapSelectionCoordinator.tsx` that pans/zooms when selection changes and `latitude`/`longitude` exist
- [x] T027 [US3] Connect `HomeListingList.tsx` row press and add-page history row press to set selection and open `ListingDetailPanel.tsx`
- [x] T028 [US3] Use `trpc.listing.getById.useQuery` in `ListingDetailPanel.tsx` when a simple list row lacks joined property fields, or pass full row from list query if already complete—document chosen data flow in component file comment

**Checkpoint**: Selection + map + detail behavior works from both home and add pages.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation cleanup, regression safety, and operator docs.

- [x] T029 [P] Refactor legacy `apps/web/src/app/(app)/listings/page.tsx` to avoid duplicating the new home experience (redirect to `/`, or remove map-heavy duplicate per new IA)
- [x] T030 Update `apps/web/src/components/AuthToolbar.tsx` (or nav in `apps/web/src/app/(app)/layout.tsx`) to link **Home** (`/`) and **Add listing** (`/listings/add`) with Rosé Pine styling
- [x] T031 Run `bun run lint` and `bun run typecheck` from repository root; fix any new issues in touched files
- [x] T032 Validate `specs/003-listing-ui-parity/quickstart.md` scenarios manually against Docker or local stack; note gaps in `specs/003-listing-ui-parity/checklists/requirements.md` if any

---

## Phase 7: UI Refinements (Post-POC Requests)

**Purpose**: Apply operator-requested navigation and visual polish tweaks after baseline parity.

- [x] T033 Simplify top bar nav in `apps/web/src/components/AuthToolbar.tsx` to only **Home**, **Add**, and **Sign out** and center the "Tokyo Listings" title
- [x] T034 Make Home filters collapsible in `apps/web/src/app/(app)/page.tsx` with preserved filter state when collapsed
- [x] T035 Remove duplicate "Add listing" headers between `apps/web/src/app/(app)/listings/add/page.tsx` and `apps/web/src/components/listing/ListingFormParity.tsx`
- [x] T036 Improve create-button color contrast in `apps/web/src/components/listing/ListingFormParity.tsx` (non-grey primary)
- [x] T037 Improve sign-in button color contrast in `apps/web/src/app/(auth)/login/page.tsx` (non-grey primary)
- [x] T038 Add a single "Add Listing" page header in `apps/web/src/app/(app)/listings/add/page.tsx`
- [x] T039 Align sign-in intro text and register link in `apps/web/src/app/(auth)/login/page.tsx`
- [x] T040 Hide right-side listing detail panel by default and show only on selection in `apps/web/src/components/shell/ListingsMapWorkspace.tsx`
- [x] T041 Clear detail panel selection on deselect and page transitions in `apps/web/src/app/(app)/page.tsx` and `apps/web/src/app/(app)/listings/add/page.tsx`
- [x] T042 Replace simple filter-collapse button with modern chevron card pattern in `apps/web/src/app/(app)/page.tsx`
- [x] T043 Integrate legacy logo asset (`logo128_light.png`) into `apps/web/public/` and use in `apps/web/src/components/AuthToolbar.tsx`
- [x] T044 Integrate legacy logo into auth surfaces via `apps/web/src/app/(auth)/layout.tsx`
- [x] T045 Simplify filter collapse header to text+arrow only and add breathing space before listing list in `apps/web/src/app/(app)/page.tsx`
- [x] T046 Compact home filter layout to align with legacy structure in `apps/web/src/components/home/HomeListingFilters.tsx`
- [x] T047 Compact add form grouping to align with legacy structure in `apps/web/src/components/listing/ListingFormParity.tsx`
- [x] T048 Ensure detail panel hides on deselect and route change in `apps/web/src/components/shell/ListingsMapWorkspace.tsx` and route pages
- [x] T049 Apply screenshot-driven phase-8 UI parity polish in `apps/web/src/app/(app)/page.tsx` and add/auth surfaces
- [x] T050 Align home left panel heading/layout to old `Property Search` structure in `apps/web/src/app/(app)/page.tsx`
- [x] T051 Center add-page title as `Add a Listing` in `apps/web/src/app/(app)/listings/add/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**.
- **User Stories (Phases 3–5)**: Depend on Foundational completion. Recommended order: **US1 → US2 → US3** (spec priorities); US2/US3 can overlap only after API parity exists.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Starts after Foundational — no dependency on US2/US3.
- **US2**: Starts after Foundational — independent of US1 UI completion but needs API from Foundational.
- **US3**: Starts after Foundational — **integrates** US1/US2 surfaces; easiest after both routes exist.

### Within Each User Story

- Web components before route wiring when marked [P] can be built in parallel.
- Selection/map tasks (US3) should follow atoms/panel scaffolding.

### Parallel Opportunities

- T002, T003 in parallel after T001 (or all Setup tasks in parallel if file paths do not clash).
- T013 and T014 parallel once T012 shell exists.
- T024 and T025 parallel once US3 shell task T023 is underway.

---

## Parallel Example: User Story 1

```text
# After T012 (shell) is merged:
Task: "Implement filter controls in apps/web/src/components/home/HomeListingFilters.tsx"
Task: "Implement results list in apps/web/src/components/home/HomeListingList.tsx"
```

---

## Parallel Example: User Story 3

```text
# After T023 (shared workspace) is started:
Task: "Implement apps/web/src/components/listing/ListingDetailPanel.tsx"
Task: "Add apps/web/src/state/selectedListing.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical**)
3. Complete Phase 3: US1 (home browse + filter)
4. **Stop and validate** against `specs/003-listing-ui-parity/quickstart.md` US1 sections

### Incremental Delivery

1. Foundational → API ready
2. US1 → demo browse/filter MVP
3. US2 → demo add + session history
4. US3 → demo full legacy-like tri-pane experience
5. Polish → navigation and regression

### Suggested MVP Scope

- **Phases 1–3** (through **T016**) deliver the first shippable POC slice per spec P1.

---

## Notes

- When adding or renaming environment variables during implementation, update **both** repository-root `.env.template` and local `.env` per `.cursor/rules/specify-rules.mdc`.
- Keep filter logic out of UI-only modules; reuse `apps/api/src/lib/listing-filters.ts` patterns.
- Avoid introducing scraping or `ingest` routes; out of scope for this feature.

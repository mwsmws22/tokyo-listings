# Implementation Plan: Listing UI Parity POC

**Branch**: `003-listing-ui-parity` | **Date**: 2026-03-29 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-listing-ui-parity/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver **legacy-parity listing fields and workflows** in the new stack: **home** shows the user’s listings with **left-side filters** (matching old “Property Search” behavior); a **dedicated add-listing route** exposes the same field set with **session-only recent history**; **either surface** supports **select → map zoom + right detail panel**. Data and filter rules live in **Drizzle + shared validators** (not UI-only). **Scraping / URL ingestion** stays out of scope for this POC. Visual design follows **Uniwind + Rosé Pine**; layout and component structure may differ from legacy as long as behaviors match the spec.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 22 LTS for Next.js; Bun 1.2.x for package manager and scripts; API runs on Bun in Docker per repo conventions.

**Primary Dependencies**: Next.js App Router (`apps/web`), Uniwind + Tailwind v4 + Rosé Pine, React Native primitives on web (`@expo/next-adapter`), tRPC + TanStack Query + Jotai, Hono + tRPC server (`apps/api`), Drizzle ORM + PostgreSQL, Zod (`packages/validators`), Google Maps JS + server Geocoding (existing split keys), Biome.

**Storage**: PostgreSQL 16; Drizzle migrations in `packages/db`.

**Testing**: Vitest for **filter composition / normalization** (test-first for that pure logic); manual or optional Playwright smoke later; integration tests for **listing list + tenant isolation** when touching new query paths.

**Target Platform**: Linux (Docker Compose on operator server); local dev over SSH.

**Project Type**: Multi-package web application (`apps/web` + `apps/api` + `packages/db` + `packages/validators`).

**Performance Goals**: Filtered list refresh feels responsive for &lt;500 listings per user; align with baseline goal (p95 &lt;500ms for list/filter excluding geocode latency).

**Constraints**: No secrets in logs; `.env.template` and local `.env` stay aligned when adding env vars; bilingual labels follow a single glossary; rent and area units documented (JPY, ㎡).

**Scale/Scope**: POC for a small operator deployment; schema allows nullable rollout for new columns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md` (Tokyo Listings):

- [x] **Data integrity**: Rent, availability, structured address, and location rules are enforced in **Zod + Drizzle**; list/filter semantics implemented in **shared query helpers** (`apps/api`) with tests for pure filter logic; UI only reflects server truth.
- [x] **Contracts**: New or changed **tRPC inputs/outputs** documented under `specs/003-listing-ui-parity/contracts/`; procedure behavior summarized for implementers.
- [x] **Test-first**: **Vitest-first** for listing **filter normalization / composition** (pure functions); UI layout work is not TDD unless domain behavior changes. Exception: none required beyond stated test-first scope.
- [x] **Integration**: Plan includes integration or DB-backed checks for **scoped listing queries** after schema expansion; geocoding remains behind existing adapter (mock in CI where applicable).
- [x] **Observability**: Continue structured logging in API; no API keys in logs; errors on create/update/list remain actionable messages.
- [x] **Domain/product**: JP/EN labels centralized (new glossary module); **monthly rent in JPY** as canonical storage; legacy “万円” display optional in UI copy; **㎡** for area; Tokyo-oriented defaults unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/003-listing-ui-parity/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # /speckit.tasks output
```

### Source Code (repository root)

```text
apps/
├── web/src/
│   ├── app/(app)/              # Authenticated routes: home, listings/add, etc.
│   ├── components/             # MapShell, listing UI, detail panel, filters
│   ├── content/                # labels + listing field glossary (new/extended)
│   ├── lib/trpc/               # tRPC client
│   └── state/                  # Jotai atoms for selection/map if needed
└── api/src/
    ├── trpc/routers/           # listing (list/create/update + filters)
    └── lib/                    # geocoding, listing filter helpers (new)

packages/
├── db/                         # Drizzle schema + migrations
└── validators/                 # Zod listing + filter schemas

tests/
├── unit/                       # listing filter helpers (Vitest)
└── integration/                # optional API+DB listing queries
```

**Structure Decision**: Reuse the **baseline split** (`apps/web`, `apps/api`, `packages/db`, `packages/validators`). Add **thin presentation components** under `apps/web/src/components/` and **filter/query helpers** under `apps/api/src/lib/` to keep constitution alignment (no filter-only-in-UI). Optional **Jotai** for cross-panel selection only if it reduces prop drilling without new global stores.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations requiring justification. Filter and field expansion add schema surface area but stay within existing packages and patterns.

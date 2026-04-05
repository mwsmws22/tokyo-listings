# Implementation Plan: Listing URL scraping and metadata

**Branch**: `004-listing-url-scraping` | **Date**: 2026-04-03 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-listing-url-scraping/spec.md` plus planning notes: resilient backend scraping architecture; legacy repo for field/selectors reference only; iterative fixture-based test loop; concurrent requests with per-domain politeness; images out of scope.

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver **URL-driven listing prefill** for **athome.co.jp**, **suumo.jp**, and **www.homes.co.jp** (LIFULL HOME'S) on the add-listing flow: authenticated **preview** procedure fetches listing HTML, runs **portal-specific extractors**, normalizes values into the existing **Zod/Drizzle** listing model, and returns **ok / partial / failure** with user-safe errors (no silent empty success). Persisted saves continue through **`listing.create`** with **duplicate `sourceUrl` prevention** per user.

Backend architecture is **adapter-based**: shared fetch + **per-host rate limiting** (global concurrency cap + per-domain spacing and small per-host in-flight limit), **pure Cheerio parsers** per portal in a dedicated **`packages/scraping`** workspace, and **Vitest + HTML fixtures** as the primary regression strategy; optional **manual live-URL** script for the “scrape → compare to browser → fix → repeat” loop. **Images** are explicitly **out of scope** (future spec).

## Technical Context

**Language/Version**: TypeScript (strict), **Bun** for API runtime and tooling per repo.

**Primary Dependencies**: **Hono** + **tRPC** (`apps/api`), **Drizzle** + PostgreSQL (`packages/db`), **Zod** (`packages/validators`), **pino** logging. **New**: **cheerio** for HTML parsing; **`jp-address-parser`** (or equivalent) for address splitting in normalization; optional lightweight **queue/limiter** (custom or small dependency) for per-host spacing—final choice in implementation tasks.

**Storage**: PostgreSQL; optional migration for **`sourcePortal`** column and **partial unique index** on `(userId, sourceUrl)` — see [data-model.md](./data-model.md).

**Testing**: **Vitest** in `packages/scraping` (fixtures + golden outputs + pure parser unit tests); integration test for tRPC preview + **mocked fetch** or stubbed HTML; root `package.json` wire-up for `bun test` / `vitest` when added. **No live-site network** in CI.

**Target Platform**: Linux (Docker / operator server).

**Project Type**: Monorepo web app: `apps/web` + `apps/api` + `packages/*`.

**Performance Goals**: Preview completes within typical interactive expectations (e.g. **&lt;15s** p95 including fetch) under normal conditions; throughput governed by **politeness limits** rather than raw max RPS.

**Constraints**: No secrets or full HTML bodies in logs; bounded response/body size; timeouts on every outbound fetch; respect robots/ToS at product policy level (operational).

**Scale/Scope**: Three portals first; architecture supports **dozens** of adapters later; many concurrent **users** with **safe per-domain** scheduling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md` (Tokyo Listings):

- [x] **Data integrity**: Rent, address, area, and station access come from **shared normalization + Zod**; scraping only proposes values; persistence uses existing `listing.create` rules. **Source URL + fetch timestamp** (`sourceFetchedAt`) populated on save when applicable.
- [x] **Contracts**: New tRPC inputs/outputs documented under [contracts/listing-scrape-trpc.md](./contracts/listing-scrape-trpc.md); Zod schemas in `packages/validators` when implemented.
- [x] **Test-first**: Parsers and normalization (yen, ㎡, 歩分, URL canonicalization) are **Vitest-first**; thin tRPC handlers can follow after core tests pass. UI wiring is not TDD unless behavioral logic lives in components.
- [x] **Integration**: Plan includes integration coverage for **preview procedure** + **fetch error mapping**; DB constraint for duplicate URL tested when migration lands.
- [x] **Observability**: Structured logs for scrape attempts with **portal**, **hostname**, **status**, **duration**; never log raw cookies, tokens, or full response bodies.
- [x] **Domain/product**: JP listing labels and units (**JPY**, **㎡**, station/walk minutes) aligned with existing glossary and validators; bilingual UI copy unchanged in scope except new messages for scrape outcomes.

## Project Structure

### Documentation (this feature)

```text
specs/004-listing-url-scraping/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── listing-scrape-trpc.md
└── tasks.md             # /speckit.tasks output (not created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── scraping/                     # NEW: ingestion core
│   src/
│   │   fetch/                    # rate-limited fetch, timeouts, UA
│   │   core/                     # types, url canonicalization, ScrapeResult
│   │   normalize/                # yen, area, station, address helpers
│   │   portals/                  # athome, suumo, lifullHomes (pure parse(html))
│   └── test/                     # mirrors src/: normalize/*.test.ts, portals/*.test.ts, fixtures/
│       fixtures/                 # HTML snapshots per portal
├── validators/                   # Zod: scrape input/output + shared listing schemas
└── db/                           # migrations: unique sourceUrl, optional sourcePortal

apps/
├── api/src/
│   ├── trpc/routers/listing.ts   # previewFromUrl (+ optional checkSourceUrl)
│   └── lib/                      # thin wiring to packages/scraping
└── web/src/
    ├── components/listing/       # wire URL field → preview → form
    └── lib/trpc/
```

**Structure Decision**: Add **`packages/scraping`** so ingestion is **unit-testable** and **rate limiting** is centralized; API stays a thin adapter. Legacy **`tokyo-listings-old`** remains **read-only reference** (not a runtime dependency).

## Phase 0 → Phase 1 (artifacts)

| Phase | Output | Location |
|-------|--------|----------|
| 0 | Research decisions (fetch, limiter, testing, address lib) | [research.md](./research.md) |
| 1 | Entity + migration notes | [data-model.md](./data-model.md) |
| 1 | tRPC contract sketch | [contracts/listing-scrape-trpc.md](./contracts/listing-scrape-trpc.md) |
| 1 | Dev workflow | [quickstart.md](./quickstart.md) |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations requiring justification. The new package is justified by test isolation, per-domain policy, and many future portal adapters.

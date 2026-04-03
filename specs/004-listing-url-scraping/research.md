# Research: Listing URL scraping (004)

**Date**: 2026-04-03  
**Spec**: [spec.md](./spec.md)

## 1. Legacy stack (tokyo-listings-old) — what to reuse vs replace

**Observed pattern**: Express route → `axios.get` with browser-like `User-Agent` → **Cheerio** on raw HTML → hostname-specific `parse*` functions filling a shared `{ property, listing }` shape (`ScrapingService.js`). No headless browser.

**Decision**: Treat legacy code as **field-mapping reference and selector hints only**. Re-port selectors and normalization into **TypeScript** with **tests against fixtures**, not by copying files wholesale.

**Rationale**: Four years of DOM drift means many selectors are likely stale; a typed module with failing tests is easier to fix than debugging opaque legacy JS.

**Alternatives considered**: Run legacy server behind a proxy (rejected: two stacks, poor typing, still stale); headless-only scraping (rejected for v1 cost/latency when static HTML suffices for three portals).

---

## 2. HTTP retrieval: static HTML first

**Decision**: Use **Bun/Node `fetch`** with explicit **timeouts**, **redirect** following (bounded), and a **stable User-Agent** string. Parse with **cheerio** (server-side jQuery-like API, matches legacy mental model).

**Rationale**: Aligns with proven legacy approach; minimal dependencies; Bun’s native fetch avoids adding axios for this path.

**Alternatives considered**: **Playwright** for all pages (rejected for v1: slower, higher ops burden); **axios** (optional if fetch edge cases appear—document if introduced).

**Future note**: If a portal serves critical content only after JS execution, add an **optional** headless path per portal behind the same extractor interface (not in this feature’s default path).

---

## 3. Polite crawling: many concurrent users, safe per-domain behavior

**Problem**: Multiple operators (or tab retries) can trigger overlapping fetches; naive parallelism can **burst a single host** and risk blocks or ethical issues.

**Decision**: Implement a **two-layer limiter**:

1. **Global** concurrency cap for “outbound scrape” work (e.g. pool size N).
2. **Per registered hostname** (e.g. `www.athome.co.jp`, `suumo.jp`): a **queue** or **token bucket** enforcing **minimum spacing** between requests to the *same* host (e.g. 1–3 seconds apart, tunable via env) and a **small per-host max in-flight** (often 1).

**Rationale**: Industry-standard pattern (global throughput + per-domain politeness); maps cleanly to “don’t hammer the same domain back-to-back.”

**Alternatives considered**: Single global mutex (rejected: underutilizes bandwidth across different domains); unbounded parallelism (rejected).

**Operational**: Log `portal`, `hostname`, `durationMs`, `httpStatus`, `outcome` (structured, no response bodies in logs).

---

## 4. Architecture: portal adapters + shared core

**Decision**:

- **Core**: URL canonicalization (strip tracking params where safe), hostname → **portal id**, fetch orchestration (timeout + rate limit), unified **`ScrapeResult`** (success / partial / failure with field-level notes).
- **Adapters**: One module per portal (`athome`, `suumo`, `homes`) implementing “HTML string → draft fields” with **no network** inside adapters (pure parsing)—**testability**.
- **Normalization layer**: Maps draft → **`listingCreate`-compatible** object (and property fields where applicable), yen/万円/㎡/歩分 parsing in **shared pure functions** with unit tests.

**Rationale**: FR-006 (add portals without redesigning UX); constitution: ingestion rules in test-covered code.

---

## 5. Address parsing

**Legacy** used **`jp-address-parser`** (`Utils.parseAddress`) to split Japanese address text into structured property fields.

**Decision**: Reintroduce **`jp-address-parser`** (or equivalent) in the normalization layer **after** extracting a single address string from HTML, unless a simpler heuristic is proven sufficient during porting.

**Rationale**: Matches legacy semantics; reduces duplicate logic for prefecture/municipality/town splits.

**Alternatives considered**: Regex-only (may work for MVP but higher regression risk for edge addresses).

---

## 6. Testing loop (big test mindset)

**Decision**: Three complementary layers:

| Layer | Purpose |
|--------|---------|
| **Fixtures** | Committed (or CI-fetched cached) **HTML snapshots** per portal; **Vitest** runs extractors → **golden JSON** (or snapshot) per fixture. Primary regression net. |
| **Pure unit tests** | Rent/station/walk text parsers, yen conversion, URL normalization—no I/O. |
| **Manual / staging script** | Optional command: pass a **live URL**, print draft + warnings; used in the “get link → compare to site → fix → repeat” loop. **Not** required for CI green (sites change, flaky network). |

**Rationale**: Matches spec SC-004 and user’s iterative workflow; constitution-friendly test-first on parsers and adapters.

**Alternatives considered**: Live-only E2E in CI (rejected: flaky); no fixtures (rejected: cannot refactor safely).

---

## 7. Images and media

**Decision**: **Out of scope** (per spec); no image download or storage in this plan. Document extension point in adapter interface for a future spec.

---

## 8. Package placement

**Decision**: New workspace package **`packages/scraping`** (types, fetch, limiter, portal adapters, normalization, Vitest). **`apps/api`** adds a thin tRPC surface that calls into `packages/scraping` and maps errors to `TRPCError` codes.

**Rationale**: Keeps ingestion logic importable without booting Hono; clear place for fixtures and tests.

**Alternatives considered**: All code under `apps/api/src/lib` only (acceptable if package overhead is undesired—slightly worse reuse for future CLI).

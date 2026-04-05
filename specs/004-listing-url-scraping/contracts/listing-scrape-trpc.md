# tRPC contracts: Listing scrape / preview (004)

**Status**: Implemented (Phase 6).  
**Router**: `apps/api/src/trpc/router.ts` — procedure lives on **`listing`**.

## Principles

- All procedures use **`protectedProcedure`** (same as existing `listing` mutations) unless explicitly public (default: **authenticated only**).
- Inputs/outputs are **Zod** schemas in `packages/validators` (e.g. `scraping.ts`) — single source of truth with tRPC.

## Planned procedures

### `listing.previewFromUrl` (mutation)

**Use case**: Add-listing page: user submits URL → server returns draft fields for form prefill (no DB write).

| Aspect | Implementation |
|--------|----------------|
| **Input** | `scrapingPreviewInputSchema`: `{ url: string }` — valid URL, max 2000 chars (`packages/validators/src/scraping.ts`) |
| **Output** | `scrapingPreviewOutputSchema`: discriminated union aligned with `ScrapeResult` (`ok` / `partial` with `draft` + `warnings`; `unsupported_host` / `fetch_failed` / `parse_failed` with user-safe `message` and optional `code`) |
| **Errors** | `INTERNAL_SERVER_ERROR` — unexpected scrape/pipeline failure (logged server-side; generic message to client). URL validation failures surface as mutation error from Zod input parsing where applicable. |

**Side effects**: HTTP fetch to third-party sites; subject to scraping package rate limiting and logging.

### `listing.checkSourceUrl` (query) — optional consolidation

**Use case**: FR-005 duplicate URL check before create.

| Aspect | Plan |
|--------|------|
| **Input** | `{ sourceUrl: string }` (normalized same way as preview) |
| **Output** | `{ exists: boolean, listingId?: string }` scoped to `ctx.userId` |

If easier, duplicate detection can live **inside** `listing.create` only; then document that behavior in `listing` contract update instead of a separate procedure.

## Contract files

- After implementation, mirror procedure signatures in **`packages/validators`** exports and keep this doc aligned, same as `specs/001-tokyo-listings-baseline/contracts/trpc-procedures.md` style.

## Non-tRPC

- Internal **`packages/scraping`** exports TypeScript types and functions only — no HTTP surface.

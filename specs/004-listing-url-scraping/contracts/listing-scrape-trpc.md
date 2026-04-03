# tRPC contracts: Listing scrape / preview (004)

**Status**: Planned — not implemented until tasks land.  
**Router**: `apps/api/src/trpc/router.ts` (extend `listing` router or add nested router per implementation choice).

## Principles

- All procedures use **`protectedProcedure`** (same as existing `listing` mutations) unless explicitly public (default: **authenticated only**).
- Inputs/outputs are **Zod** schemas in `packages/validators` (e.g. `scraping.ts`) — single source of truth with tRPC.

## Planned procedures

### `listing.previewFromUrl` (query or mutation)

**Use case**: Add-listing page: user submits URL → server returns draft fields for form prefill (no DB write).

| Aspect | Plan |
|--------|------|
| **Input** | `{ url: string }` — Zod: valid URL, max length aligned with `sourceUrl` |
| **Output** | `ScrapeResult` discriminated union: success (`ok` / `partial` with `draft` + warnings), failure (`unsupported_host`, `fetch_failed`, `parse_failed`) with user-safe `message` / `code` |
| **Errors** | `BAD_REQUEST` — invalid URL; `TOO_MANY_REQUESTS` — optional if global scrape pool saturated; `INTERNAL_SERVER_ERROR` — unexpected (logged, not detailed to client) |

**Side effects**: HTTP fetch to third-party sites; subject to rate limiting and logging.

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

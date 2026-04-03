# tRPC procedures (baseline)

**Status**: Aligned with `apps/api/src/trpc/router.ts` and nested routers.

HTTP entry: **`/trpc`** (Hono + `@hono/trpc-server`). Better Auth remains on **`/api/auth/*`** (not tRPC).

## Root router

| Procedure | Type   | Auth | Output / behavior |
|-----------|--------|------|-------------------|
| `health`  | query  | public | `{ ok: true }` — liveness |

## `listing`

Router: `listing` — all procedures use **`protectedProcedure`** (requires `ctx.userId`).

| Procedure | Type    | Input (Zod) | Notes |
|-----------|---------|-------------|--------|
| `create`  | mutation | `listingCreateSchema` | Creates listing; geocodes address server-side when configured; may create/link `property` rows for structured address fields. |
| `list`    | query    | `listingListSchema` | Lists current user’s listings; optional filter fields + `buildListingWhereClause` in `apps/api/src/lib/listing-filters.ts`. |
| `getById` | query    | `listingIdSchema` | Single listing with joined data for detail UI; **NOT_FOUND** if missing or wrong user. |
| `update`  | mutation | `listingUpdateSchema` | Patch by id; enforces ownership. |
| `delete`  | mutation | `listingIdSchema` | Delete by id; enforces ownership. |

## `map`

Router: `map` — **`protectedProcedure`** only.

| Procedure | Type  | Input (Zod) | Notes |
|-----------|-------|-------------|--------|
| `geocode` | query | `mapGeocodeSchema` (`address`) | Server-side Google Geocoding; **BAD_REQUEST** if geocoding fails. |

## Context

Every procedure receives `ctx` with:

- `session` / `userId` from Better Auth
- `db` — Drizzle client

**Unauthorized** access to protected procedures MUST throw **`UNAUTHORIZED`** (no `userId`).

# tRPC procedure outline (baseline)

**Status**: Planning artifact — **rename/split to match code** during implementation.

Router names are indicative.

## `auth` (if not fully covered by Better Auth client only)

- _(none — prefer Better Auth HTTP routes + session helpers in tRPC context)_

## `listing`

- `list` — input: filter DTO (rent range, tag, station distance max); output: listing DTOs **scoped
  to authenticated user**
- `getById` — input: id; output: listing or NOT_FOUND; **must verify userId**
- `create` — input: create DTO; output: listing
- `update` — input: id + patch; output: listing
- `delete` — input: id; output: success

## `map`

- `geocode` — input: address text; output: lat/lng + status (server-side Google Geocoding)

## `property`

- `create` — optional; or auto-create on first merge
- `mergeListings` — input: listing ids + target property id; output: updated rows

## `ingest` (P5)

- `fromUrl` — input: url string; output: created listing or duplicate error
- `preview` — optional: fetch metadata without persist

## Context requirements

Every procedure receives `ctx` with:

- `session` / `userId` from Better Auth
- `db` Drizzle client

**Unauthorized** requests MUST throw `UNAUTHORIZED` for mutating user data.

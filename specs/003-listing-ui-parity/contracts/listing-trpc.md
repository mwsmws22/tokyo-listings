# tRPC contracts: Listing UI Parity POC

**Scope**: Extensions to the **`listing`** router for parity fields and **server-side filters**. Align procedure names and DTOs with `apps/api/src/trpc/router.ts` at implementation time.

## `listing.list`

**Input** (extends baseline):

- Existing: `limit` (optional cap).
- **New**: Filter object (all optional; AND semantics):
  - `propertyType` — matches `property.propertyType` when linked, or derived field if denormalized.
  - `availability` — matches `listing.availability`.
  - `interest` — matches `property.interest` when linked.
  - `prefecture`, `municipality`, `town`, `district`, `block` — match corresponding property fields (implementation defines substring vs exact; document in API helper).

**Output**: Array of listing DTOs including joined **property** fields needed for list rows and detail panel (shape should match web `inferRouterOutputs`).

**Errors**: `UNAUTHORIZED` if no session.

## `listing.create`

**Input**: Create DTO including parity fields:

- Required: at least **title**, **monthlyRentYen**, and **address** representation (full `addressText` and/or structured property fields per validators).
- Optional: `sourceUrl`, fee/month fields, station/walk, `availability`, structured property fields, `propertyId` if attaching to existing property.

**Output**: Created listing row (with ids for follow-up).

**Errors**: `BAD_REQUEST` validation; `UNAUTHORIZED`.

## `listing.update`

**Input**: Id + patch covering any editable parity fields (same keys as create where applicable).

**Output**: Updated listing.

**Errors**: `NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`.

## `listing.getById`

**Input**: `id`.

**Output**: Single listing + **property** join when `propertyId` set (for detail panel).

**Errors**: `NOT_FOUND`, `UNAUTHORIZED`.

## Non-goals (this POC)

- No new **`ingest`** / **`fromUrl`** procedures.
- No scraping endpoints.

# Research: Listing UI Parity POC

## Decision: Single expanded listing row + linked property row

**Rationale**: The legacy app split **property** (address segments, type, interest, coordinates) from **listing** (rent, fees, station, URL, availability). The baseline schema already has `property` and `listing` with `propertyId`. This feature **extends both** to hold parity fields instead of inventing parallel JSON blobs, preserving queryability and filters.

**Alternatives considered**:

- **JSON `metadata` column on listing**: Faster to ship but weakens integrity, complicates filters, and conflicts with constitution guidance for shared rules.
- **Flatten everything onto listing only**: Duplicates address on every listing revision and diverges from legacy mental model; still workable but worse for future merge/dedupe milestones.

## Decision: Canonical money and area units in storage

**Rationale**: Store **monthly rent as integer JPY** (`monthlyRentYen`) and **area in ㎡** as a decimal or integer as chosen in `data-model.md`. Legacy UI used **万円** for rent entry; the new UI may show **万円** for familiarity while persisting yen.

**Alternatives considered**:

- Store rent as float 万円: avoids a single conversion but complicates comparisons and invites float bugs.

## Decision: Server-side filtering via Drizzle

**Rationale**: Home page filters must apply to **all** matching rows for the user, not only the client-fetched page. Implement **filter DTO → SQL `where` clauses** in the API (with indexed columns where practical).

**Alternatives considered**:

- Client-side filter only: fails SC-002 at scale and diverges from spec (“only matching listings remain visible” across the dataset).

## Decision: Add-page recent history is client-only session state

**Rationale**: Spec requires history to **reset when navigating away**. Implement with **React state** (or a route-scoped store) cleared on unmount or route exit—no persistence requirement for POC.

**Alternatives considered**:

- Persist in `sessionStorage`: would violate “reset on leave” unless explicitly cleared; unnecessary complexity for POC.

## Decision: Shared selection + map zoom via lifted state

**Rationale**: Selection must work from **home** and **add** routes with a **common map + detail panel**. Use **shared layout** under `apps/web/src/app/(app)/` or **Jotai atoms** for `selectedListingId` / detail payload, keeping MapShell in one place.

**Alternatives considered**:

- Duplicate MapShell per page: breaks “either page” coordination and duplicates Google Maps cost/loader behavior.

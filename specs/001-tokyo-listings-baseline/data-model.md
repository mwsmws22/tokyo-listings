# Data Model — Tokyo Listings Baseline

**Spec**: `spec.md` | **Date**: 2026-03-28

Conventions: monetary amounts in **integer JPY**; areas in **㎡**; timestamps **UTC**;
user-visible copy can show 万円 with formatting in UI only (domain stores JPY).

## User & auth (Better Auth + Drizzle)

Managed largely by Better Auth tables (`user`, `session`, `account`, `verification`, etc.).
Extend application profile as needed:

| Field | Type | Notes |
|-------|------|--------|
| id | text/uuid | Primary key; matches auth user id |
| email | text | Unique, normalized lowercase |
| emailVerified | boolean | Required for “modern” public auth per spec assumptions |
| name | text | Optional display name |
| createdAt / updatedAt | timestamp | Audit |

## Property

Logical “physical unit” a user merges listings into (spec **Property** entity).

| Field | Type | Notes |
|-------|------|--------|
| id | uuid | PK |
| userId | fk → user.id | **Tenant isolation** |
| label | text | Optional user label |
| createdAt / updatedAt | timestamp | |

## Listing

A rental listing row belonging to one user; optional link to a **property**.

| Field | Type | Notes |
|-------|------|--------|
| id | uuid | PK |
| userId | fk → user.id | **Required**; enforce on every query |
| propertyId | uuid nullable | Set when merged/grouped |
| title | text | Required |
| monthlyRentYen | integer | Required; JPY |
| addressText | text | Raw address / JP text for geocoding |
| latitude | double nullable | Set after geocode or manual pin |
| longitude | double nullable | |
| geocodeStatus | enum | e.g. `pending`, `ok`, `failed`, `manual` |
| stationDistanceM | integer nullable | Minutes or meters—**product decision**: store **minutes walking** to nearest station if legacy parity; document in UI |
| interestTag | text nullable | Freeform or controlled vocabulary—start string |
| sourceUrl | text nullable | **Unique per (userId, sourceUrl)** when not null |
| sourceFetchedAt | timestamp nullable | Provenance for imports |
| createdAt / updatedAt | timestamp | |

**Validation rules (domain, not UI-only)**:

- `monthlyRentYen` > 0 for create/update.
- If `sourceUrl` present, normalize URL (strip fragments, canonical host) before uniqueness check.
- `latitude/longitude` must both be set or both null unless `geocodeStatus === manual` with partial
  user override policy documented in API.

## ListingMerge (optional explicit audit)

If merge history must be auditable beyond `propertyId`:

| Field | Type | Notes |
|-------|------|--------|
| id | uuid | PK |
| userId | fk | |
| fromListingId | fk | |
| toPropertyId | fk | |
| createdAt | timestamp | |

(Alternatively derive merges from property membership only; add table if compliance needs it.)

## Filter state

Not persisted as an entity; **Jotai** + URL query params for UX. Server-side filtering takes
explicit query DTOs (rent range, max station distance, tags).

## Relationships

```
User 1──* Listing
User 1──* Property
Property 1──* Listing
```

## Indexes (initial)

- `(userId)` on Listing, Property
- Unique `(userId, normalized_source_url)` on Listing (implementation: generated column or app
  normalization)
- `(userId, monthlyRentYen)` for filter range queries

## State transitions

- **Geocoding**: `pending` → `ok` | `failed`; user can set `manual` and coordinates.
- **Merge**: user confirms → listings’ `propertyId` set to same Property; no duplicate `sourceUrl`
  across listings for same user after merge policy defined (keep both URLs on child listings).

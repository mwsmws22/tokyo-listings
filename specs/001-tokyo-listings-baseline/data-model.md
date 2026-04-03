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

## Listing

A rental listing row belonging to one user.

| Field | Type | Notes |
|-------|------|--------|
| id | uuid | PK |
| userId | fk → user.id | **Required**; enforce on every query |
| title | text | Required |
| monthlyRentYen | integer | Required; JPY |
| addressText | text | Raw address / JP text for geocoding |
| latitude | double nullable | Set after geocode or manual pin |
| longitude | double nullable | |
| geocodeStatus | enum | e.g. `pending`, `ok`, `failed`, `manual` |
| createdAt / updatedAt | timestamp | |

**Validation rules (domain, not UI-only)**:

- `monthlyRentYen` > 0 for create/update.
- `latitude/longitude` must both be set or both null unless `geocodeStatus === manual` with partial
  user override policy documented in API.

## Relationships

```
User 1──* Listing
```

## Indexes (initial)

- `(userId)` on Listing
- `(userId, monthlyRentYen)` on Listing

## State transitions

- **Geocoding**: `pending` → `ok` | `failed`; user can set `manual` and coordinates.

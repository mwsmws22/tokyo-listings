# Data Model: Listing UI Parity POC

## Overview

Entities align with **legacy conceptual split**: **Property** (location, building classification, map pin semantics) and **Listing** (economic terms, transit text, availability, source URL). All rows remain **scoped to `userId`** (baseline tenant isolation).

## Entity: Property (`property` table)

Represents a physical location / building bucket. Extended from baseline minimal `property` to support legacy **address segments** and **interest** / **type** used in filters.

| Field | Meaning | Notes |
|------|---------|--------|
| `id` | Primary key | UUID |
| `userId` | Owner | FK to user |
| `prefecture` | 都 / 県 | Filter + display |
| `municipality` | 市 / 区 | Filter + display |
| `town` | 町 | Filter + display |
| `district` | 丁目 | Filter + display |
| `block` | 番 | Filter + display |
| `houseNumber` | 号 | Optional |
| `propertyType` | e.g. 一戸建て / アパート | Enum or constrained text |
| `interest` | e.g. Top / Extremely / Kinda± / Nah | Enum or constrained text |
| `latitude` / `longitude` | Map position | Optional until geocode/manual pin |
| `pinExact` | Exact vs approximate pin | Boolean; drives zoom level behavior |

*Implementation note*: If baseline `property` lacks columns, add via migration; keep nullable columns where legacy parity allows empty fields during POC rollout.

## Entity: Listing (`listing` table)

Represents a rent offer / unit listing tied to a property (nullable `propertyId` during migration; POC should **prefer** linking when structured address is used).

| Field | Meaning | Notes |
|------|---------|--------|
| `id` | Primary key | UUID |
| `userId` | Owner | FK |
| `propertyId` | Linked property | Nullable FK |
| `title` | Short label | Existing baseline |
| `monthlyRentYen` | Rent | Integer JPY (canonical) |
| `addressText` | Full address string | Existing; may duplicate formatted property for search |
| `sourceUrl` | Listing URL | Optional; parity with legacy |
| `reikinMonths` | 礼金 (months of rent) | Optional numeric |
| `securityDepositMonths` | 敷金 (months) | Optional numeric |
| `squareM` | Area | ㎡ |
| `closestStation` | Station name | Text |
| `walkingTimeMin` | Walk minutes | Int |
| `availability` | 募集中 / 契約済 (or equivalent) | Enum |
| `latitude` / `longitude` | Pin | Existing; may mirror property |
| `geocodeStatus` | Geocode lifecycle | Existing enum |

## Entity: Listing filter (query DTO, not a table)

Input shape for `listing.list` (tRPC) mirroring legacy search:

- `propertyType`, `availability`, `interest` (toggle semantics: empty = no filter)
- Address segments: `prefecture`, `municipality`, `town`, `district`, `block` (substring or prefix match per implementation plan in API helper)

## Validation rules

- Required fields on **create** must match Zod schemas in `packages/validators` (minimum set agreed in implementation: at least title, rent, address or structured address).
- **Availability** and **property type** enums must match documented contract strings (JP literals from legacy unless product chooses EN keys + display map).

## Relationships

- `listing.propertyId` → `property.id` (optional FK)
- Deleting a user cascades listings and properties (baseline behavior preserved)

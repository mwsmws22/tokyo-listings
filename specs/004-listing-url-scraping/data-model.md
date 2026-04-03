# Data model: Listing URL scraping (004)

**Date**: 2026-04-03  
**Spec**: [spec.md](./spec.md)

## Existing persistence (Drizzle)

Relevant tables today:

- **`listing`**: `title`, `monthlyRentYen`, `addressText`, `sourceUrl`, `sourceFetchedAt`, parity fields (`reikinMonths`, `securityDepositMonths`, `squareM`, `closestStation`, `walkingTimeMin`, `availability`, …), optional `propertyId`, geocode fields.
- **`property`**: structured address fields, `interest`, `propertyType`, map fields.

Scraping **preview** does not require new tables. **Persisted** listings continue to use `listing` + `property` as today.

## Planned schema / constraint additions (implementation phase)

| Change | Purpose |
|--------|---------|
| **Partial unique index** on `(userId, sourceUrl)` where `sourceUrl` is not null | Enforce FR-005 (no duplicate listing rows for same canonical URL per user). Exact migration design in tasks. |
| Optional **`sourcePortal`** (text or enum) on `listing` | Stable provenance beyond inferring from URL (helps analytics and UI). If omitted initially, portal can be derived from hostname in application code. |

## Domain types (conceptual — implement in `packages/scraping`)

### Portal identifier

Stable string enum for supported hosts, e.g. `athome | suumo | lifull_homes`, mapped from normalized hostname.

### `ScrapeStatus`

- `ok` — enough fields extracted to treat as successful prefill.
- `partial` — some fields extracted; others failed (per-field reasons).
- `unsupported_host` — not in allowlist.
- `fetch_failed` — network, timeout, HTTP 4xx/5xx, body too large.
- `parse_failed` — HTML did not match expected detail-page shape.

### `ScrapedListingDraft`

Maps to **partial** `listingCreate` / property inputs:

- Scalar fields aligned with validators (`monthlyRentYen`, `addressText`, `title`, etc.).
- Optional structured property splits when address parser succeeds.
- **`warnings`**: string codes for UI (e.g. `STATION_AMBIGUOUS`, `RENT_NOT_FOUND`).
- **`fieldErrors`**: optional map field → message for partial failure.

### `ScrapeResult` (API return shape)

- `status`, `portal`, `canonicalUrl` (after normalization).
- `draft` (when `ok` or `partial`).
- `message` / `code` for failures (user-safe; no stack traces).

## Relationships

- **Listing ↔ Property**: Unchanged; scraping only **proposes** field values. `propertyId` linkage rules stay as existing create flow.
- **Future P3** (duplicate address): property matching is **not** part of scraping package; optional call from `listing.create` path later.

## Validation rules

- All persisted rows must still pass **`listingCreateSchema`** on submit.
- Scraped numbers must be **normalized** to canonical storage: JPY integers, ㎡ as number, 礼金/敷引 as months where the app expects months.

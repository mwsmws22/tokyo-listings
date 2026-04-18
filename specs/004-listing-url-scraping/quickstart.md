# Quickstart: Scraping development (004)

**Plan**: [plan.md](./plan.md)

## Prerequisites

- Repo root `.env` for API (database, auth) as in baseline.
- Network access to target sites for **manual** live tests (CI uses **fixtures only**).

## Layout (after implementation)

- **`packages/scraping`**: extractors, fetch + rate limit, fixtures under `packages/scraping/test/fixtures/`.
- **`apps/api`**: tRPC procedures wrapping the package.

## Typical dev loop

1. **Add or refresh a fixture**: Save a listing detail page HTML (minimize PII if committing; prefer synthetic or redacted snippets) under the scraping package fixtures.
2. **Run unit tests**: `bun test` (or `vitest`) from repo root / package—see `package.json` once wired.
3. **Adjust extractor** until golden output matches visible on-page fields.
4. **Manual spot-check**: Call the preview procedure with a live URL in a logged-in session (or a small script) and compare UI prefill to the browser.

## Fetch-failure debug capture (dev only)

When URL preview returns a fetch failure on the add-listing page, the error line shows:

- `Could not fetch the listing page. More info.`

Click **More info** to open a compact popup with:

- Capture ID
- Link to `output/scrape-debug/<id>.html` (best-effort response body)
- Link to `output/scrape-debug/<id>.json` (URL, canonical URL, portal, status, selected headers, error code, timestamp)

Notes:

- This debug flow is enabled in local dev runtime (`bun dev:up`) and disabled in production/Docker runtime (`docker compose up`).
- Links open in a new tab via `/api/scrape-debug/<id>.html` and `/api/scrape-debug/<id>.json`.
- The capture directory is bounded (oldest files are pruned).

## Rate limit tuning

- Configure per-host delay and global concurrency via **environment variables** (documented in `.env.template` when added)—tune down if seeing HTTP 429 or captcha pages.

## What not to do

- Do not commit **live network calls** as required CI steps.
- Do not log full HTML or credentials; follow structured logging rules in plan.

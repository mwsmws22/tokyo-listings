# Quickstart: Listing UI Parity POC (dev validation)

**Prerequisites**: Baseline stack running (Postgres + API + Web per root `compose.yaml` or local dev); authenticated test user.

## 1. Schema and API

1. Apply latest migrations (`packages/db`) so `listing` / `property` include parity columns.
2. From the browser session, call **`listing.list`** with empty filters → expect all of the user’s listings.
3. Call **`listing.list`** with one filter set (e.g. availability) → expect only matching rows.

## 2. Home (US1)

1. Open **`/`** (authenticated home).
2. Set filters in the left panel; confirm the list updates and an empty state appears when nothing matches.
3. Clear filters; confirm full set returns.

## 3. Add listing (US2)

1. Navigate to the **add listing** route (path as implemented, e.g. `/listings/add`).
2. Submit a valid listing; confirm it appears in **recent history** at the top.
3. Submit another; confirm order is newest-first.
4. Navigate away (e.g. to home) and back; confirm **recent history is empty**.

## 4. Map + detail panel (US3)

1. From home, select a listing with coordinates; map **zooms** and the **right panel** shows full details.
2. From the add page, select a listing in session history (if selectable) or use list on home; confirm **same panel behavior**.
3. Select a listing **without** coordinates; panel still opens with a clear **location unavailable** state.

## 5. Regression

1. Login, register, and existing non-POC routes still load (spec FR-013).
2. No secrets appear in browser network tab beyond expected public map client key.

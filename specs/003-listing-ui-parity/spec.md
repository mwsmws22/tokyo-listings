# Feature Specification: Listing UI Parity POC

**Feature Branch**: `[003-listing-ui-parity]`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "/tokyo-listings/speckit.specify create new spec for 002"

## Constitution Alignment *(mandatory)*

This specification MUST remain consistent with `.specify/memory/constitution.md`: listing
data integrity and provenance where relevant; documented contracts for APIs and shared
schemas; test-first discipline for domain logic unless an exception is recorded in the
plan; integration or contract tests at system edges; structured observability without secret
leakage; and Tokyo listings domain conventions (geography, units, bilingual labels) when the
feature is user-facing or data-defining.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Filter Listings on Home (Priority: P1)

As an operator, I can open the home page, apply listing filters from a left-side control panel, and see the filtered listings so I can quickly narrow candidates.

**Why this priority**: Filtering and browsing are the core daily workflow and must be available first for the POC to be useful.

**Independent Test**: Can be fully tested by creating several listings with different values, applying filters one by one and in combination, and verifying only matching listings are shown.

**Acceptance Scenarios**:

1. **Given** listings with mixed values exist, **When** the user applies filter values from the left panel, **Then** only listings matching all active filters remain visible.
2. **Given** one or more filters are active, **When** the user clears filters, **Then** the full listing set is shown again.
3. **Given** no listing matches current filters, **When** filtering is applied, **Then** the page shows an empty-state message instead of stale results.

---

### User Story 2 - Add Listing on Dedicated Entry Page (Priority: P2)

As an operator, I can open a dedicated add-listing page with legacy-parity listing fields and submit entries, while seeing a recent-entry history during that page session.

**Why this priority**: Data-entry speed and field parity with the old workflow are key migration goals for the POC.

**Independent Test**: Can be tested by opening the add page, entering all required and optional fields, submitting multiple listings, and validating in-page recent history behavior before and after route navigation.

**Acceptance Scenarios**:

1. **Given** the add page is open, **When** the user submits a valid listing, **Then** the listing is saved and appears in recent-entry history at the top.
2. **Given** multiple listings are added in the same visit, **When** the user remains on the add page, **Then** recent-entry history keeps all entries from that visit in reverse chronological order.
3. **Given** recent-entry history exists, **When** the user navigates away from the add page and later returns, **Then** the recent-entry history is reset for the new visit.
4. **Given** invalid or incomplete input is submitted, **When** validation runs, **Then** the user sees field-level guidance and no partial listing is saved.

---

### User Story 3 - Map-Centered Listing Inspection from Either Page (Priority: P3)

As an operator, I can select a listing from either page and have the map zoom to it while opening a right-side detail panel with full listing details.

**Why this priority**: This unifies browse and inspection behavior and preserves a key legacy interaction pattern.

**Independent Test**: Can be tested by selecting listings from home and add pages, confirming map zoom behavior, and verifying details in the right panel match selected listing data.

**Acceptance Scenarios**:

1. **Given** a listing is visible in either page context, **When** the user selects it, **Then** the map centers and zooms to that listing location and opens the right-side detail panel.
2. **Given** the right-side detail panel is open, **When** another listing is selected, **Then** the panel updates to the newly selected listing without full-page navigation.
3. **Given** a listing has partial optional metadata, **When** its details are opened, **Then** all available fields are shown and missing values are displayed with consistent placeholders.

---

### Edge Cases

- A listing lacks map coordinates at selection time; the system still opens the details panel and provides a clear location-unavailable state.
- Filters are set to conflicting values that cannot return results; system returns zero results cleanly and keeps filter state intact.
- Very long free-text values (address/URL/notes-like values) are provided; list rows remain readable and full values stay accessible in details.
- Duplicate submissions occur from rapid repeated clicks; system prevents accidental duplicate records within one submit action.
- Add-page recent history grows large in one session; panel remains usable and ordered with newest first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expand listing creation/editable data fields to match the legacy workflow field set for this POC, excluding any scraping-specific behaviors.
- **FR-002**: System MUST provide a home page layout with listing/filter controls on the left and listing results in the same page context.
- **FR-003**: System MUST allow users to filter listings using parity fields from the legacy workflow, including address-segment and listing-status style filters.
- **FR-004**: System MUST provide a separate add-listing page that uses the same POC field set as FR-001.
- **FR-005**: System MUST maintain a recent-entry history list on the add page during the current page visit only.
- **FR-006**: System MUST reset add-page recent-entry history when the user leaves the add page route and later returns.
- **FR-007**: System MUST support selecting a listing from either page and keep a shared selected-listing state for map + detail panel coordination.
- **FR-008**: System MUST zoom and center the map to the selected listing when a selectable location is available.
- **FR-009**: System MUST open a right-side detail panel after listing selection and display the full listing/property detail set from the POC field model.
- **FR-010**: System MUST keep detail panel content synchronized with the currently selected listing without requiring a full page reload.
- **FR-011**: System MUST validate required listing-entry inputs and prevent persistence when validation fails.
- **FR-012**: System MUST preserve bilingual/domain conventions already used by the project for labels and units relevant to Tokyo listings.
- **FR-013**: System MUST keep existing non-POC workflows operational; this feature only restructures browse/add/detail experiences for the specified pages.

### Key Entities *(include if feature involves data)*

- **Listing Record**: A property listing with rent, station/accessibility, status, and source/location metadata shown in list, filter, add, and detail views.
- **Property Location**: Address-structured location data used for filtering, map focus, and detail display.
- **Listing Filter State**: User-selected criteria applied to the listing collection on the home page.
- **Selected Listing Context**: Shared UI state that links list selection, map zoom/focus, and right-side detail panel content.
- **Add Session History**: In-memory list of entries submitted during the current add-page visit, intentionally cleared on route exit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In UAT, operators can complete a listing create flow with the new field set in under 2 minutes for at least 90% of attempts.
- **SC-002**: For a seeded dataset of at least 100 listings, applying or clearing filters updates visible results in under 2 seconds for at least 95% of interactions.
- **SC-003**: From either page, selecting a listing opens corresponding details and map focus correctly on the first attempt in at least 95% of test cases.
- **SC-004**: In acceptance testing, at least 90% of legacy critical fields used in daily listing decisions are available in both add and detail experiences.

## Assumptions

- This feature is a POC focused on parity of core browse/add/select/detail behavior; scraping ingestion remains out of scope.
- Existing authentication and access boundaries remain unchanged.
- Legacy repository is used as a functional reference only; visual styling and implementation approach follow current project standards.
- Any fields not present in current stored records may be introduced as nullable/optional during parity rollout, with validation tightened later as needed.
- The map panel and details panel remain part of a shared authenticated operator experience rather than separate user roles.

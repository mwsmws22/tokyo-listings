# Feature Specification: Listing URL scraping and metadata

**Feature Branch**: `[004-listing-url-scraping]`  
**Created**: 2026-04-03  
**Status**: Draft  
**Input**: User description: "Scraping for add-listing: on add page, submit a listing URL, retrieve page content, extract listing metadata. Initial portals: athome.co.jp, suumo.jp, homes.co.jp (LIFULL HOME'S); expand later toward legacy ~40+ list. Paste URL → form populated → save to DB. Future: duplicate-address flow to link multiple listings to one property; map pin adjustment after geocode. Backend needs resilient, extensible scraping; iterative test-against-pages workflow; legacy repo as field-reference only."

## Constitution Alignment *(mandatory)*

This specification MUST remain consistent with `.specify/memory/constitution.md`: listing
data integrity and provenance where relevant; documented contracts for APIs and shared
schemas; test-first discipline for domain logic unless an exception is recorded in the
plan; integration or contract tests at system edges; structured observability without secret
leakage; and Tokyo listings domain conventions (geography, units, bilingual labels) when the
feature is user-facing or data-defining.

Ingestion and extraction rules that affect displayed rent, address, area, or location MUST
live in shared, test-covered domain logic; scraped values MUST retain source attribution
(source URL and portal identity) appropriate to the pipeline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paste supported listing URL and save scraped listing (Priority: P1)

As an operator adding a rental listing, I paste a full listing URL from one of the initially supported real-estate portals (athome.co.jp, suumo.jp, or homes.co.jp). The system retrieves the listing page, extracts the listing metadata that maps to the application’s listing fields, pre-fills the add-listing form, and I can review and submit to persist the listing in the database.

**Why this priority**: This is the core value: faster, accurate entry from primary sources without retyping structured fields.

**Independent Test**: Using a stable sample URL per portal (or captured page fixtures in tests), verify the form receives the expected fields, submit succeeds, and the saved record matches the intended listing content for source and provenance.

**Acceptance Scenarios**:

1. **Given** the add-listing flow is open and the URL host is one of the three supported portals, **When** the operator submits the URL for extraction, **Then** the listing form is populated with scraped values for all fields the system can reliably derive for that portal.
2. **Given** populated fields are shown, **When** the operator completes any required selections or corrections and saves, **Then** the listing is stored with the source URL and portal identity preserved.
3. **Given** a successful save, **When** the operator views the listing later, **Then** displayed data matches what was saved, including bilingual or unit conventions used elsewhere in the app.

---

### User Story 2 - Clear outcomes when URL is unsupported or extraction fails (Priority: P2)

As an operator, when I paste a URL that is not from a supported portal, the page cannot be retrieved, or extraction cannot complete, I see a clear explanation and can still complete the form manually (or correct URL) without losing my session.

**Why this priority**: Reliability and trust depend on predictable failure modes; manual completion matches legacy workflows for unsupported sites.

**Independent Test**: Use a non-supported domain, an unreachable URL, and a supported portal URL that returns an unexpected page shape; verify messaging, no silent partial “success,” and that the operator can continue data entry.

**Acceptance Scenarios**:

1. **Given** the URL host is not in the supported set, **When** extraction is requested, **Then** the system explains that the portal is not supported yet and does not claim success.
2. **Given** retrieval or extraction fails, **When** the error is shown, **Then** the message is actionable (e.g., retry, check URL, or enter manually) and does not expose secrets or raw upstream errors.
3. **Given** a failure, **When** the operator continues, **Then** previously entered form values outside the scrape are preserved where applicable.

---

### User Story 3 - Link duplicate-address listing to an existing property (Priority: P3 — future parity)

As an operator, when I add a listing whose address matches an existing property closely enough to be the same building or unit, the system offers to associate the new listing with that property so multiple portal links map to one property (one property, many listings).

**Why this priority**: Matches legacy behavior for deduplication and portfolio organization; depends on stable listing records and address logic.

**Independent Test**: Seed a property with one listing, add a second listing from another URL with the same normalized address; confirm prompt and that both listings reference the same property when confirmed.

**Acceptance Scenarios**:

1. **Given** a saved property exists with a matching address, **When** the operator saves a new listing that matches, **Then** the system prompts whether to link to the existing property.
2. **Given** the prompt, **When** the operator confirms association, **Then** the new listing is tied to that property without duplicating the property record.
3. **Given** the prompt, **When** the operator declines, **Then** a distinct property/listing relationship is used according to product rules for “not the same place.”

---

### User Story 4 - Adjust map pin after initial geocoded position (Priority: P4 — future parity)

As an operator, after the system places a map marker from geocoded address text, I can move the pin to the exact building entrance or location I know, and that position is what the listing uses for map display.

**Why this priority**: Geocoding is approximate; manual pin refinement was a key legacy workflow.

**Independent Test**: Open a listing with geocoded coordinates, drag or set pin to a new point, save, reload; map and stored coordinates reflect the user-adjusted position.

**Acceptance Scenarios**:

1. **Given** a listing has coordinates from address geocoding, **When** the operator adjusts the pin and saves, **Then** stored coordinates update to the adjusted location.
2. **Given** an adjusted pin exists, **When** the listing is shown on the map, **Then** the marker appears at the adjusted position.

---

### Edge Cases

- URL is for a supported portal but points to a search results page, expired listing, or error page; extraction fails with a specific, user-visible outcome.
- Listing page requires consent or regional blocking; retrieval fails gracefully with the same class of handling as other failures.
- Partial extraction: some fields parse, others do not; required fields for save are clearly indicated so the user cannot save an invalid record without knowing what is missing.
- Same listing URL is submitted again; system prevents duplicate listing records by source URL consistent with product rules.
- Operator pastes URL with tracking parameters or mobile variants; normalization still identifies the portal and listing where possible.
- Portal HTML changes over time; regression tests or recorded samples detect breakage before production users see widespread failures (operational expectation, not a single UI scenario).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a listing URL in the add-listing flow and attempt metadata extraction only when the URL’s host matches one of the supported portals: `athome.co.jp`, `suumo.jp`, `homes.co.jp` (including typical subdomains used for listing detail pages).
- **FR-002**: System MUST retrieve the listing page content for supported URLs in a way that respects site operators and product policy (rate limits, timeouts, and failure handling defined in the implementation plan).
- **FR-003**: System MUST map extracted data to the application’s listing field model, using the legacy application’s field semantics as the reference for names and meanings (not for implementation technology).
- **FR-004**: System MUST persist source URL and portal identity with the listing so provenance and duplicate checks remain traceable.
- **FR-005**: System MUST prevent creating a second listing record with the same canonical source URL when the product rule is “no duplicate URLs,” and MUST surface this to the operator in the add flow.
- **FR-006**: System MUST structure extraction so additional portals can be added later without redesigning the core user flow (portal-specific behavior isolated behind a common extraction contract).
- **FR-007**: System MUST provide automated validation of extraction logic using stable fixtures or recorded page samples for each supported portal, with a workflow that supports iterative improvement (get link → verify fields → fix → repeat).
- **FR-008**: System MUST integrate extraction with the add-listing UI so that successful extraction pre-fills the form; the operator MUST be able to edit any field before save.
- **FR-009**: On retrieval or extraction failure, System MUST NOT present empty fields as if they were successfully scraped; user-visible status MUST distinguish success, partial failure, and total failure.
- **FR-010**: For **P3** (future): System MUST detect likely duplicate property by address (or equivalent normalized location key) and offer linking a new listing to an existing property.
- **FR-011**: For **P4** (future): System MUST allow the operator to override geocoded coordinates with a user-placed map pin and persist that position for the listing.

### Key Entities *(include if feature involves data)*

- **Listing (ingestion)**: A rental listing record including source URL, portal, structured fields (rent, area, address components, access, etc.), and user-editable attributes after scrape.
- **Property**: A physical unit or building reference that can aggregate multiple listings; relationship is one property to many listings when P3 is implemented.
- **Portal extraction profile**: The set of rules and field mappings for one host; versioned or testable independently as portals change.
- **Scrape / extraction result**: Outcome of a single URL request including success flag, field-level values or errors, and diagnostics suitable for logs without leaking secrets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each of the three supported portals, operators can take a valid listing detail URL and complete add-listing with core structured fields (rent, address text, and area where shown on the page) pre-filled without manual re-entry from the page, in a single session, at least 90% of the time on stable fixture pages used for regression.
- **SC-002**: When extraction fails, 100% of failure cases in acceptance testing return an explicit user-visible outcome (no silent empty success).
- **SC-003**: Adding a new portal in a later release does not require changing the operator’s high-level steps (paste URL → review → save); only engineering effort for that portal’s profile should grow.
- **SC-004**: Recorded page samples exist for each supported portal, and each release that changes scraping validates against them so markup regressions are caught before operators rely on broken extraction.

## Assumptions

- Operators use the add-listing page that already collects listing fields consistent with prior UI parity work; this feature extends that flow with URL-driven prefill.
- “Legacy application” field semantics refer to the historical Tokyo Listings project as documentation of which fields exist and how they are interpreted; no requirement to reuse its runtime stack.
- Initial scope is three portals; additional hosts from the legacy list are explicitly out of scope until added under FR-006.
- P3 and P4 behaviors are specified for planning alignment; delivery may be phased after P1–P2 unless the implementation plan batches them.
- Network access to target sites is available from the deployment environment; any legal or robots-policy constraints are handled in planning, not in this spec.
- Geocoding for map placement (P4) continues to use an address-to-coordinate service as today; exact provider is an implementation detail.

## Dependencies

- Existing add-listing form and persistence path for listings.
- Database constraints and APIs for listing uniqueness and (future) property linkage as defined in the data model and prior specs.

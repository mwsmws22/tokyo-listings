# Feature Specification: Tokyo Listings Platform Rebuild (Baseline & Roadmap)

**Feature Branch**: `001-tokyo-listings-baseline`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: Rebuild Tokyo Listings from scratch: multi-user, self-hosted deployment, auth-first, then map shell and user-owned listings on map parity as the baseline. Legacy repo is documentation-only (app not runnable). Exclude extensions, helper scripts, and old database restores. Operator handles public URL and proxy; initial focus is local use. Baseline must include contributor style checks (lint/format) via the technical plan.

## Constitution Alignment *(mandatory)*

This specification MUST remain consistent with `.specify/memory/constitution.md`: listing
data integrity and provenance where relevant; documented contracts for APIs and shared
schemas; test-first discipline for domain logic unless an exception is recorded in the
plan; integration or contract tests at system edges; structured observability without secret
leakage; and Tokyo listings domain conventions (geography, units, bilingual labels) when the
feature is user-facing or data-defining.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure multi-user access (Priority: P1)

A new visitor creates an account, signs in, and signs out. Each user’s data (listings and
related records) is visible only to that user. Unauthenticated users cannot read or change
private data. The operator can expose the site on the public internet without relying on
“obscurity” of a single home network.

**Why this priority**: The rebuild is explicitly multi-tenant; authentication and isolation
are prerequisites for every other feature and for safe public access.

**Independent Test**: Create two accounts, add distinct data under one account, and confirm
the second account cannot see it in any list or map view. Sign-out clears access to private
screens.

**Acceptance Scenarios**:

1. **Given** a visitor without an account, **When** they register with valid credentials,
   **Then** they receive a confirmed account and land in an authenticated experience.
2. **Given** a signed-in user, **When** they sign out, **Then** they cannot access
   authenticated areas until they sign in again.
3. **Given** two distinct users, **When** each views their workspace, **Then** neither sees
   the other’s listings or related private content.

---

### User Story 2 - Map-first shell (Priority: P2)

A signed-in user opens the main application and sees an interactive map centered on Tokyo
(or the user’s last sensible map viewport), with standard pan/zoom. The map may show zero or
more pins depending on later stories; empty state is acceptable.

**Why this priority**: The legacy product is map-centric; a working map shell is the minimum
credible UI for the new app and validates integration with mapping and layout.

**Independent Test**: Sign in, load the map view, pan and zoom; verify no crash and correct
centering/empty-state behavior without requiring listings to exist.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open the main map view, **Then** the map loads
   and is interactive (pan/zoom).
2. **Given** a user with no listings yet, **When** they view the map, **Then** they see a
   clear empty state that does not imply an error.

---

### User Story 3 - Own listings on the map (Priority: P3)

A signed-in user can create a rental listing with enough fields to place it in context (at
minimum: title, monthly rent, and address or location text suitable for Tokyo). The system
places a marker on the map for that listing (approximate position from the address is
acceptable). The user can adjust the marker position when they know the exact spot. Listings
are scoped to the user.

**Why this priority**: Replicates the core value of “my listings on a map” without requiring
scraping yet.

**Independent Test**: Add one listing, see one pin; move the pin and save; refresh and confirm
persistence. Second user does not see the pin.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a listing with required fields, **Then**
   the listing appears in their list and as a pin on their map.
2. **Given** a listing with an address, **When** the map first shows it, **Then** the pin
   reflects an estimated location the user can refine.
3. **Given** another user’s account, **When** they view the map, **Then** they do not see the
   first user’s listing or pin.

---

### Edge Cases

- Concurrent sessions: signing out on one device should not silently leave another session
  open without a defined policy (session list vs single session); product must document
  behavior.
- Invalid or partial addresses: geocoding may fail; user can still place or drag a pin.
- Operator misconfiguration of map credentials: user-visible error, no silent blank map.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support user registration, authentication, and sign-out suitable
  for a public-facing deployment.
- **FR-002**: System MUST enforce per-user isolation for listings and related user-owned
  entities.
- **FR-003**: System MUST provide an interactive map view for signed-in users.
- **FR-004**: System MUST let signed-in users create, view, edit, and delete their own
  listings within the baseline field set.
- **FR-005**: System MUST associate each listing with a map position, including estimated
  placement from address text and manual adjustment.
- **FR-006**: System MUST persist listing and map position changes so they survive refresh
  and return visits.
- **FR-007**: System MUST expose consistent error messages for auth failures, invalid input,
  and geocoding failures.
- **FR-008**: System MUST define contributor-facing style rules (lint/format) such that
  automation can flag violations before merge or release.
- **FR-009**: Operator MUST be able to run the application locally with documented steps
  without depending on a single vendor’s edge-only hosting or edge-only database as the only
  way to run the system.

### Key Entities *(include if feature involves data)*

- **User**: Person who owns an account; authenticates; owns listings and preferences.
- **Listing**: A rental listing record (rent, address, metadata, source URL if imported),
  belonging to exactly one user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user completes registration and first successful sign-in in under 10
  minutes without support, assuming valid credentials and connectivity.
- **SC-002**: In manual testing with two accounts, 100% of cross-user access attempts to
  another user’s listings fail (no data leakage in list, map, or direct object access).
- **SC-003**: A signed-in user with at least one listing can pan/zoom the map and see the
  correct pin within 5 seconds of load on a typical home broadband connection (excluding
  third-party map outages).

## Assumptions

- Legacy code is reference-only; no requirement to run or migrate the old application or DB
  dumps.
- Browser extension, AutoHotkey helpers, bat launchers, and packaged database backups are out
  of scope for this specification.
- Initial deployment target is **local development** and **operator-controlled Docker** on
  their server; DNS and reverse proxy are out of scope here.
- Mapping and geocoding depend on third-party services; the operator supplies keys and
  accepts provider terms; costs stay within normal personal-use tiers.
- The operator prefers a **T4-style** toolchain and **containerized** deployment on their own
  hardware; the technical plan selects concrete packages. Anything that **requires** a
  specific vendor’s edge-only hosting or edge-only database as the **sole** data store is
  out of scope; the app must remain runnable locally and on self-managed servers. Mobile apps
  are optional in the first baseline if the plan documents web-first delivery.
- Listings are **private to each user** unless a future feature explicitly adds sharing.
- Email verification and password recovery are expected parts of “modern” public auth unless
  the technical plan documents a narrower MVP with a recorded exception.
- Linting and formatting are enforced at the repository level (exact tools in the plan), not
  left purely informal.

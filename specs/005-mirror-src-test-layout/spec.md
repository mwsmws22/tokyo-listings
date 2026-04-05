# Feature Specification: Mirrored test directories

**Feature Branch**: `005-mirror-src-test-layout`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "Reorganize automated tests: each app and package keeps source under
`src/` and tests under a sibling `test/` tree that mirrors `src/` paths (no colocated `*.test.ts`
next to implementation). Move existing tests into the mirrored layout, update test runners and
documentation so contributors follow the convention."

## Constitution Alignment *(mandatory)*

This specification remains consistent with `.specify/memory/constitution.md`: test-first discipline
for domain logic and integration coverage at system edges still apply; this change only defines
**where** automated tests live in the repository so they stay discoverable and aligned with modules.
Listing data integrity, explicit contracts, observability, and Tokyo domain conventions are
unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find tests without searching the tree (Priority: P1)

A contributor who knows a module path under `src/` can open the same relative path under `test/`
and find the automated checks for that module.

**Why this priority**: Predictable layout reduces time to review, extend, or debug tests and avoids
duplicate or orphaned files.

**Independent Test**: Audit the repository: for each deliverable app/package that uses `src/`, every
automated module test file sits under `test/` with a path parallel to the code it exercises.

**Acceptance Scenarios**:

1. **Given** implementation at `src/lib/foo.ts`, **When** a contributor looks for its tests,
   **Then** they find them at `test/lib/foo.test.ts` (or the same leaf name with the project’s agreed
   test suffix), not mixed into `src/`.
2. **Given** integration checks that exercise several modules, **When** those checks are stored,
   **Then** they still live under `test/` following the primary module or router path they belong to
   (documented in project guidelines).

---

### User Story 2 - Guidelines match reality (Priority: P2)

New work follows the same rule: reviewers can reject colocated test files under `src/` because
written guidance and examples say so.

**Why this priority**: Without documentation, the layout drifts back to mixed placement.

**Independent Test**: Onboarding or agent-facing rules describe the `src/` / `test/` mirror and
point to at least one real example in the repo.

**Acceptance Scenarios**:

1. **Given** a new automated test for code under `src/`, **When** an author opens the contribution
   guide, **Then** they are told to add the file under the mirrored `test/` path.
2. **Given** the root project structure summary, **When** a reader scans it, **Then** it reflects
   per-app/per-package `test/` trees rather than a one-off top-level test folder for app code.

---

### User Story 3 - Shared fixtures stay coherent (Priority: P3)

HTML, JSON, or other static inputs used only by tests remain grouped under `test/` (e.g.
`test/fixtures/`) so they are not confused with runtime assets under `src/`.

**Why this priority**: Keeps ingestion and fixture hygiene clear for scraping and similar domains.

**Independent Test**: Fixture paths referenced from tests resolve from `test/` without reaching into
`src/` for sample payloads.

**Acceptance Scenarios**:

1. **Given** a parser test that loads sample HTML, **When** the file is opened, **Then** the
   fixture path lives under a `test/` subtree.

---

### Edge Cases

- **Cross-package tests**: Tests that intentionally span packages stay in the package that owns the
  behavior under test, or in the app that wires the boundary; guidelines note that the mirror rule
  applies per workspace member (`apps/*`, `packages/*`).
- **End-to-end or repo-wide suites**: If a future suite is not tied to a single `src/` subtree, it
  may live under an agreed folder (e.g. app-level `test/e2e/`) documented in guidelines rather than
  forcing an artificial mirror.
- **Legacy paths**: Any reference in old specs/tasks to previous test locations is updated or
  superseded so automation and humans are not sent to removed paths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each workspace app or package that ships code under `src/` MUST keep automated test
  files that target that code under a sibling `test/` directory, using the same relative path
  segments as the implementation (mirror layout).
- **FR-002**: Automated test files MUST NOT remain colocated under `src/` next to implementation
  after migration (no `*.test.*` alongside production modules in `src/`).
- **FR-003**: The consolidated test entrypoints (e.g. root “run all tests” behavior) MUST still
  execute all migrated tests with no loss of coverage compared to pre-migration.
- **FR-004**: Project and SpecKit-facing guidelines MUST state the mirror rule and MUST be updated
  when this feature lands so agents and contributors default to the new layout.
- **FR-005**: Static test-only inputs (fixtures) MUST remain under `test/` (or a documented
  subfolder such as `test/fixtures/`), not under `src/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every pre-migration automated test file in an affected app/package, a
  post-migration file exists under `test/` and the old `src/` colocated copy is removed.
- **SC-002**: A full repository test run completes successfully after relocation (same or greater
  count of executed checks as before the move).
- **SC-003**: At least one authoritative guidance document (development guidelines and/or
  constitution workflow) explicitly describes the `src/` / `test/` mirror convention.
- **SC-004**: Within one review cycle, no new colocated `*.test.*` files appear under `src/` in
  affected packages (enforced by reviewer habit and documented rule).

## Assumptions

- Mirroring applies to `apps/api`, `packages/scraping`, and any other workspace members that today
  mix tests into `src/`; `apps/web` has no such tests in scope for this change.
- The previous top-level `tests/` folder used for API unit tests is folded into `apps/api/test/` so
  API concerns stay inside the API workspace.
- Test runner configuration is updated as part of implementation so discovery patterns match the new
  tree (treated as a mechanical follow-up to FR-003, not a separate product requirement in this
  spec).

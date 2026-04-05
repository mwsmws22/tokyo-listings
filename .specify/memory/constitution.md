<!--
Sync Impact Report
Version change: template (unversioned) → 1.0.0
Modified principles: (template placeholders →) I. Listing Data Integrity; II. Explicit
  Contracts at Boundaries; III. Test-First for Domain Logic; IV. Integration Testing at
  System Edges; V. Observability and Simplicity
Added sections: Domain & Product Constraints; Development Workflow (filled from placeholders)
Removed sections: none
Templates: .specify/templates/plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅
Commands: .cursor/commands/*.md — verified, no CLAUDE-only refs; .specify/templates/commands — N/A (missing)
README/docs: ⚠ pending — no README.md yet; add principle summary when project README exists
Follow-up TODOs: none
-->

# Tokyo Listings Constitution

## Core Principles

### I. Listing Data Integrity

- Listing data that is ingested, synchronized, or edited MUST retain source attribution and
  last-updated semantics appropriate to the pipeline.
- Rules that affect displayed price, availability, location, or eligibility MUST live in
  shared, test-covered code; UI-only duplication of those rules is insufficient for
  correctness.
- **Rationale**: Users and partners depend on accurate listings; integrity is the core
  product risk.

### II. Explicit Contracts at Boundaries

- HTTP APIs, CLI surfaces, and shared schemas MUST have documented contracts (OpenAPI,
  JSON Schema, or equivalent) checked into the repository or spec artifacts.
- Contract-breaking changes MUST be released with a MAJOR version bump for versioned
  packages, or with documented migration steps for deployables.
- **Rationale**: Clear contracts enable safe parallel work and predictable integrations.

### III. Test-First for Domain Logic

- For pricing, search ranking, geographic or eligibility rules, and ingestion transforms:
  automated tests MUST be written first and fail before implementation (red-green-refactor).
- Purely visual or copy changes that do not alter domain behavior MAY omit TDD when agreed in
  the plan.
- **Rationale**: Domain bugs are costly and easy to regress without executable specifications.

### IV. Integration Testing at System Edges

- Integration or contract tests MUST cover: new or changed external integrations, persistence
  or migrations that affect listing queries, and multi-step user journeys that span modules.
- **Rationale**: Unit tests do not catch wiring, serialization, or cross-module failures.

### V. Observability and Simplicity

- Services MUST emit structured logs for errors and significant state transitions; secrets
  and credentials MUST NOT appear in logs or telemetry.
- New dependencies, services, or architectural layers MUST be justified in the
  implementation plan (or a short ADR) when they increase complexity; prefer the smallest
  design that meets requirements (YAGNI).
- **Rationale**: Small teams need operability and a codebase that stays easy to change.

## Domain & Product Constraints

- Tokyo geography (wards, stations, transit references) and bilingual labels MUST follow a
  convention documented for each user-facing surface; mixed JP/EN MUST not be ad hoc per
  screen.
- User-visible units MUST be consistent within a surface (e.g., JPY, area in ㎡) and
  documented where assumptions exist.
- Personal data MUST be collected and stored under least privilege with retention documented
  when the feature handles PII.

## Development Workflow

- Feature work MUST follow: specification (`/speckit.specify`) → plan (`/speckit.plan`) →
  tasks (`/speckit.tasks`) → implementation, unless a skipped step is recorded with rationale
  in `plan.md` or the spec.
- Pull requests that implement features MUST confirm Constitution Check items from `plan.md`
  are satisfied or justified in Complexity Tracking.
- The Complexity Tracking table in `plan.md` MUST be completed when a design intentionally
  violates a default principle (e.g., extra service or bypassing test-first for a stated
  exception).
- Automated test files for workspace apps and packages MUST live under a `test/` directory that
  mirrors the sibling `src/` layout (parallel relative paths); new colocated `*.test.*` files
  under `src/` MUST NOT be added.

## Governance

- This constitution supersedes informal practice when they conflict. Amendments MUST update
  `.specify/memory/constitution.md`, bump the version line in the footer per semantic rules
  below, and propagate changes to dependent templates when guidance changes.
- **Versioning**: MAJOR — removal or incompatible redefinition of a principle or governance
  rule; MINOR — new principle or materially expanded section; PATCH — clarifications, typos,
  non-semantic wording.
- **Compliance**: Reviewers MUST verify applicable principles for changes touching domain
  logic, data pipelines, public contracts, or observability. Before each major release,
  maintainers MUST confirm active specs and plans still align with this constitution.
- **Guidance**: When `README.md` or `docs/` exist, they MUST link or summarize this file;
  until then, `.specify/memory/constitution.md` and `.specify/templates/` define process
  expectations for SpecKit workflows.

**Version**: 1.1.0 | **Ratified**: 2026-03-28 | **Last Amended**: 2026-04-05

# Feature Specification: Migrate package tooling from Bun to npm

**Feature Branch**: `002-migrate-npm`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "Create a branch from spec 001 context; convert from Bun to npm because install is slow; user will run install via CLI; minimum spec."

## Constitution Alignment *(mandatory)*

This change is **repository tooling only** (how dependencies are installed and scripts are invoked). It does not alter listing data, APIs, or user-facing product behavior. Constitution principles for **data integrity, contracts, and tests** apply unchanged to application code; this spec does not relax them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contributors use npm for installs and scripts (Priority: P1)

A contributor clones the repo and installs dependencies using the **npm** CLI at the monorepo root, then runs the same documented quality commands (e.g. lint, typecheck) they need for day-to-day work, **without** using Bun for installs or script entrypoints.

**Why this priority**: Unblocks reliable local setup and aligns with the team’s choice to standardize on npm.

**Independent Test**: On a clean machine with Node LTS and npm, follow the documented steps: install dependencies once, then run lint and typecheck; both succeed.

**Acceptance Scenarios**:

1. **Given** a fresh clone with no `node_modules`, **When** the contributor runs the documented install command at the repo root, **Then** dependencies resolve and the lockfile strategy matches what is committed.
2. **Given** dependencies are installed, **When** the contributor runs documented dev/build/lint/typecheck scripts from the root or app packages, **Then** no script requires the Bun runtime.

### Edge Cases

- **Mixed lockfiles**: Bun lockfile must not remain the source of truth; one primary npm lockfile at root (or documented exception if a package must diverge—out of scope unless needed).
- **Docker/CI**: Images and automation that previously assumed Bun for `install` or `run` must be updated so builds do not depend on Bun.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST document a single primary workflow for installing dependencies using **npm** at the monorepo root (workspaces preserved).
- **FR-002**: Root and package `package.json` scripts that today invoke **Bun** MUST be changed so routine development and CI use **npm**-compatible commands and a **Node**-compatible runtime for the API service (no `bun` binary required for install, lint, typecheck, dev, or start).
- **FR-003**: **Bun-specific lockfiles** (`bun.lock` / `bun.lockb`) MUST be removed from the canonical workflow and replaced by **npm** lockfile(s) committed after install, unless the plan records a deliberate exception.
- **FR-004**: **Dockerfiles** (and CI, if present) that install or run with Bun MUST be updated to use npm/Node consistently with local dev.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor following only the updated documented steps can install dependencies and run **lint** and **typecheck** successfully without Bun installed.
- **SC-002**: A container build that previously relied on Bun for dependency install can complete an install step using the new documented approach (verified in CI or local `docker build` when Dockerfiles are wired).

## Assumptions

- **Node.js 22 LTS** (or current project-pinned LTS) remains the runtime target; only the **package manager and Bun runtime** are replaced for installs and scripts.
- **The operator runs `npm install` locally** to generate/update `package-lock.json`; automation in this feature does not need to execute install in the agent environment.
- **Scope** is tooling migration; no feature work on listings domain logic in this branch unless required to fix script breakage.

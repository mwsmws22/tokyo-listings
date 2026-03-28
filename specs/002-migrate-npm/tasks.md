# Tasks: Migrate Bun → npm

**Input**: Design documents from `/specs/002-migrate-npm/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Tests**: Not requested; verify with `npm run lint` and `npm run typecheck` after you run `npm install`.

**Organization**: Single user story (P1)—tooling migration.

## Phase 1: Setup

**Purpose**: Root scripts no longer call `bun`.

- [ ] T001 Replace `bun` with `npm` in root scripts (`dev` hint and `typecheck`) in `package.json` (repository root)

---

## Phase 2: Foundational (Blocking)

**Purpose**: API package runs under Node so installs and `npm run dev`/`start` do not require the Bun binary.

**Checkpoint**: API scripts are Node-compatible before Docker `CMD`/`RUN` alignment.

- [ ] T002 Add Node-based `dev` and `start` scripts (e.g. via `tsx`) and remove `bun` from `apps/api/package.json`; add any needed devDependency for TypeScript execution

---

## Phase 3: User Story 1 — npm-based contributor workflow (Priority: P1)

**Goal**: Local and container flows use npm + Node only; Bun lockfile removed; docs tell you to run `npm install`.

**Independent Test**: With only Node 22 + npm, `npm install` at repo root (you run this), then `npm run lint` and `npm run typecheck` succeed.

### Implementation for User Story 1

- [ ] T003 [P] [US1] Switch `docker/Dockerfile.api` from `oven/bun` to a Node LTS base; use `npm ci` or `npm install` per lockfile policy; align `CMD`/entry with `apps/api` npm scripts
- [ ] T004 [P] [US1] Switch `docker/Dockerfile.web` from `oven/bun` to Node LTS base; use `npm ci` or `npm install` consistently with `Dockerfile.api`
- [ ] T005 [US1] Update `.cursor/rules/specify-rules.mdc` to reference `npm run` (e.g. test/lint) instead of `bun run`, and npm as package manager where Bun is stated today
- [ ] T006 [US1] Delete `bun.lock` at repository root and add `specs/002-migrate-npm/quickstart.md` with the exact commands: `npm install` at root, then `npm run lint` / `npm run typecheck`; note that `package-lock.json` is committed after install

**Checkpoint**: No `bun` required for documented install or scripts; lockfile story is npm-only.

---

## Phase 4: Polish & Cross-Cutting

**Purpose**: Optional tightening.

- [ ] T007 Add an `engines` field (e.g. Node `>=22`) to root `package.json` if not already present, matching `plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **Phase 3** (sequential)
- **Phase 4** after Phase 3 (or in parallel with T006 if you only touch `package.json`)

### User Story Dependencies

- **US1**: Depends on Phase 2 completing (API can start without Bun).

### Parallel Opportunities

- **T003** and **T004** can run in parallel after **T002** (different Dockerfiles).

---

## Parallel Example: User Story 1

```bash
# After T002:
# Task T003: edit docker/Dockerfile.api
# Task T004: edit docker/Dockerfile.web
```

---

## Implementation Strategy

### MVP (this feature)

1. Complete Phase 1 and Phase 2.  
2. Run `npm install` yourself at the repo root; commit `package-lock.json`.  
3. Complete Phase 3 (Docker + Cursor rules + remove `bun.lock` + quickstart).  
4. Run `npm run lint` and `npm run typecheck` to confirm.  
5. Optional: Phase 4 (`engines`).

---

## Notes

- Do **not** run `npm install` in automation here; you requested to install via CLI yourself.  
- If `git` is initialized later, use branch **`002-migrate-npm`** (see `spec.md`).

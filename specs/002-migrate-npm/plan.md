# Implementation Plan: Migrate Bun → npm

**Branch**: `002-migrate-npm` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)

## Summary

Replace **Bun** as the package manager and script runner with **npm** (npm workspaces) and **Node.js** for running the API. Remove Bun lockfiles; commit **package-lock.json** after the maintainer runs `npm install` at the repo root. Update Dockerfiles and Cursor/rules text that reference Bun.

## Technical Context

**Package manager**: npm (workspaces: `apps/*`, `packages/*` as today in root `package.json`)

**Language/Version**: TypeScript (strict), Node.js 22 LTS for Next.js and API process

**API runtime**: Node with `tsx` (or equivalent) for dev/watch and start—no `bun` binary

**Lockfile**: `package-lock.json` at root; remove `bun.lock` / `bun.lockb`

**Files likely touched**: `package.json` (root), `apps/api/package.json`, `docker/Dockerfile.api`, `docker/Dockerfile.web`, `.cursor/rules/specify-rules.mdc`, optional `README.md` or small doc under `specs/002-migrate-npm/`

## Constitution Check

- [x] **Data integrity**: N/A (tooling only).
- [x] **Contracts**: No API contract changes required for this migration.
- [x] **Tests**: No new domain tests required; verify lint/typecheck after install.
- [x] **Simplicity**: Prefer standard npm + Node patterns over extra tooling.

## Complexity Tracking

| Violation | Why needed | Simpler alternative rejected because |
|-----------|------------|----------------------------------------|
| None | — | — |

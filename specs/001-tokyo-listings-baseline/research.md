# Phase 0 — Research & Decisions

**Feature**: Tokyo Listings Platform Rebuild (Baseline & Roadmap)  
**Date**: 2026-03-28

## 1. T4 stack vs self-hosting

**Decision**: Adopt the **T4-aligned** pieces that run on a **single VPS / Docker host** with a
**self-managed PostgreSQL**. Drop **Cloudflare Workers**, **Cloudflare D1**, and **Cloudflare-only**
hosting paths as required runtimes.

**Rationale**: D1 and Workers assume edge deployment; the operator requires a **Docker image** on
their own server and a **normal SQL database** under their control.

**Alternatives considered**:

- Self-host **Supabase** (Docker): powerful but heavy for an MVP; defer unless auth needs grow
  beyond email/password and sessions.
- **SQLite** file in container: simpler backups but weaker concurrent write story for multi-user
  scraping; PostgreSQL chosen for familiarity and scaling headroom.

---

## 2. Runtime & package manager

**Decision**: **Bun** as package manager and task runner; **Node.js 22 LTS** for **Next.js** build
and production runtime in Docker (official Next support path). Use **Bun** for `apps/api` if
stable with Hono + Drizzle in CI; otherwise Node for both apps for uniformity.

**Rationale**: T4 defaults to Bun; Next.js still documents Node-first—pin versions in Docker and
validate in CI.

**Alternatives considered**: pnpm-only (omit Bun): valid; Bun kept for alignment with T4 DX.

---

## 3. UI, data fetching, state

**Decision**:

- **Uniwind** + **Tailwind CSS v4** + **[Rosé Pine for Tailwind](https://github.com/rose-pine/tailwind-css)** for UI: React Native primitives (`View`, `Text`, `TextInput`, `Pressable`) with `className` utilities; **`uniwind-plugin-next`** + **`@expo/next-adapter`** integrate with Next.js (Webpack). Rosé Pine **`@theme`** CSS is vendored under `apps/web/src/styles/rose-pine-tailwind-v4/` (switch variant via `globals.css` imports). **Cross-platform**: web-first; native iOS/Android via the same RN primitives is possible later but **not** a v1 goal.
- **tRPC** + **TanStack Query** for typed client/server data flow.
- **Jotai** for client-only UI state (map viewport, transient filter UI), not server cache.

**Rationale**: Matches T4; avoids Redux boilerplate; TanStack Query covers server state. Rosé Pine ships first-class Tailwind v4 theme files; Uniwind applies Tailwind to RN components without a second styling paradigm (e.g. Tamagui tokens).

**Alternatives considered**: REST + OpenAPI only—rejected for end-to-end typing with Drizzle models. **Tamagui-only Rosé Pine**—replaced by Uniwind + Tailwind for this baseline to align with the official Rosé Pine Tailwind package and reduce bespoke theme plumbing.

---

## 4. Backend shape: Hono + tRPC

**Decision**: **`apps/api`**: **Hono** serves **tRPC** via `@hono/trpc-server`, **Drizzle**, and
**Better Auth** (Hono plugin). **`apps/web`**: **Next.js** (App Router) is a **UI and BFF proxy**
only; browser calls API on same origin in production via reverse-proxy path (`/api` → api service)
or Next `rewrites()` in dev.

**Rationale**: Satisfies “use Hono” from T4 while keeping **PostgreSQL** on the server. Scraping
and heavy jobs can later move to a **queue + worker** without rewriting domain logic.

**Alternatives considered**:

- tRPC only inside Next Route Handlers (no Hono): fewer processes, but diverges from requested
  Hono backend and blurs API vs UI deploy units.
- GraphQL: rejected—no spec requirement.

---

## 5. Authentication

**Decision**: **Better Auth** with **Drizzle adapter**, **email + password**, **email
verification**, and **password reset** via SMTP env vars. Sessions via **HTTP-only cookies**.
Per-user row-level ownership on all listing tables (`userId` foreign keys + middleware checks).

**Rationale**: “Full proof modern” for public deployment without locking to Supabase Cloud; keeps
data in operator Postgres.

**Alternatives considered**:

- **Supabase Auth (hosted)**: conflicts with self-hosted DB preference unless using full Supabase
  stack.
- **Lucia**: excellent; Better Auth chosen for faster email flows and maintained Drizzle recipes.

---

## 6. Database & ORM

**Decision**: **PostgreSQL 16** (Docker), **Drizzle ORM**, **drizzle-kit** migrations committed to
repo.

**Rationale**: Matches legacy mental model (Postgres), strong constraints, JSON columns if needed
for scrape metadata.

---

## 7. Maps & geocoding

**Decision**: **Google Maps JavaScript API** (map + markers) + **Geocoding API** server-side from
`apps/api` using a server-held key. Client receives map-specific key restrictions as per Google
best practices.

**Rationale**: Parity with legacy README; predictable for Tokyo addresses.

**Alternatives considered**: MapLibre + Nominatim—lower cost but worse JP address coverage without
extra tuning.

---

## 8. Scraping & ingestion (later phases)

**Decision**: **Cheerio**-based HTML parsing in `apps/api` behind authenticated tRPC mutations;
**axios** or **fetch** for HTTP; strict **per-user URL dedupe**; store **source URL**, **fetchedAt**,
and raw snapshot path optional. **No** headless browser in baseline—add Playwright only if a site
requires JS rendering (separate ADR).

**Rationale**: Aligns with constitution (provenance, integrity); matches legacy Node/cheerio
direction.

---

## 9. Linting & formatting

**Decision**: **Biome** (or **ESLint 9 flat + Prettier** if Biome conflicts with a required tool)—default
**Biome** for monorepo speed; **TypeScript** `strict`; CI runs `biome check` and `tsc --noEmit`.

**Rationale**: FR-12 in spec; Bun ecosystem friendly.

---

## 10. Testing

**Decision**: **Vitest** for unit/domain tests (filters, dedupe rules); **Playwright** optional for
critical auth + map smoke after baseline stable; integration tests against **Postgres** via
docker-compose test profile or Testcontainers (evaluate in implementation).

**Rationale**: Constitution test-first for domain logic; integration at DB/API boundaries.

---

## 11. Docker & local dev

**Decision**: `docker compose` services: `postgres`, `api`, `web`. Document **local** workflow with
`docker compose up` and env files. **No** Cloudflare tunnel or DNS in scope.

**Rationale**: Matches operator goal; mirrors production shape.

---

## Resolved unknowns (no remaining NEEDS CLARIFICATION)

All technical-context items from `plan.md` are resolved above for baseline planning.

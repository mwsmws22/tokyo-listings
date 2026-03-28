# API Contracts — Tokyo Listings Baseline

## Primary contract: tRPC `AppRouter`

This project uses **tRPC** between `apps/web` and `apps/api`. The **source of truth** is the
exported TypeScript type **`AppRouter`** in `packages/api` (or `apps/api/src/router.ts`—exact path
set during implementation).

- **Procedure list**: See `trpc-procedures.md` in this folder for routers and procedure names
  (update during implementation to match code).
- **Versioning**: Breaking procedure or input/output shape changes require a **MAJOR** release for
  any published package **or** a documented migration window for the single deployable (per
  constitution).

## REST / Better Auth

- **Better Auth** exposes standard HTTP routes (e.g. `/api/auth/*`) through the Hono app. Treat
  those routes as **third-party contract** per Better Auth docs; do not fork behavior without an
  ADR.

## Optional OpenAPI

If a non-TypeScript client appears later, generate **OpenAPI** from tRPC (community tools) or
document a thin REST facade—**not required for baseline**.

## Environment

- **Server-only**: `DATABASE_URL`, `BETTER_AUTH_SECRET`, SMTP for email, `GOOGLE_MAPS_SERVER_KEY`,
  `GEOCODING_*` as needed.
- **Client-exposed**: `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` / map key per Google’s key restriction
  strategy.

Never log secrets or session tokens (constitution).

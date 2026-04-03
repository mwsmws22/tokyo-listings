#!/usr/bin/env sh
set -eu
cd /app
# Workspace deps are hoisted to /app/node_modules; packages/db scripts expect a local node_modules.
(cd packages/db && bun /app/node_modules/drizzle-kit/bin.cjs migrate)
exec bun run --cwd apps/api start

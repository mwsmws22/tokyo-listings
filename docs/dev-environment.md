# Development environment

## Node.js

**Vitest 3** (used by `packages/scraping`) requires a **[supported Node.js release](https://nodejs.org/en/about/previous-releases)** — use **current Active LTS** (e.g. **22.x**). The repo declares `"engines": { "node": ">=20.0.0" }` so tooling can warn on mismatch.

```bash
node -v   # must be v20+ (v22 LTS recommended; align with [.nvmrc](../.nvmrc) if you use nvm/fnm)
```

If `node` is too old (for example system `/usr/bin/node` is still v12), upgrade or put a modern Node **first on your `PATH`** (nvm, fnm, mise, distro packages). Then:

```bash
cd packages/scraping
npx vitest run
# or from repo root:
bun run test
```

Vitest is a **Node** program: it is not supported on legacy Node versions, and running its CLI with **Bun** as the JS runtime is not supported (workers/tinypool expect Node APIs).

## Bun

Prefer **Bun 1.2.x** for installs and app dev scripts (`bun install`, `bun run lint`, `bun run dev:*`, etc.).

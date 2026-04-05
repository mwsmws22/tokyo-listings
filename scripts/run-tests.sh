#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  if [[ -f .nvmrc ]]; then
    nvm use
  fi
fi

(
  cd "$ROOT/packages/scraping"
  node "$ROOT/node_modules/vitest/vitest.mjs" run
)
(
  cd "$ROOT/apps/api"
  node "$ROOT/node_modules/vitest/vitest.mjs" run
)

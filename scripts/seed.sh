#!/usr/bin/env bash
# Loads demo data: the BFF holds the seeded customer (3 accounts, ~120 transactions) in memory,
# so seeding means regenerating the fixture when asked and resetting local flags to their defaults.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

[ "${REGENERATE:-0}" != "1" ] || node bff/scripts/gen-seed.mjs
if curl -fsS "http://localhost:$BFF_PORT/healthz" >/dev/null 2>&1; then
  curl -fsS -X PUT -H 'content-type: application/json' -d '{"enabled":false}' \
    "http://localhost:$BFF_PORT/api/flags/statements.v2" >/dev/null || true
  log "demo data ready (flag statements.v2 reset to off)"
fi

#!/usr/bin/env bash
# Starts the whole stack locally: BFF (:3000), Tomcat in Docker (:8081) and the front end (:9000).
#   MODE=dev  (default) webpack dev servers per MFE + root config with a local import map
#   MODE=prod           production bundles staged like the CDN layout and served by scripts/serve-stage.mjs
set -euo pipefail
. "$(dirname "$0")/lib.sh"
MODE="${MODE:-dev}"
[ -f .env ] || cp .env.example .env

"$ROOT/scripts/dev-down.sh" >/dev/null 2>&1 || true

start_bg bff node --env-file-if-exists="$ROOT/.env" --import tsx "$ROOT/bff/src/server.ts"

if [ "${SKIP_LEGACY:-0}" != "1" ]; then
  docker image inspect bank-legacy:1.0 >/dev/null 2>&1 && [ "${REBUILD_LEGACY:-0}" != "1" ] \
    || docker build -q -t bank-legacy:1.0 -f legacy/Dockerfile .
  docker rm -f bank-legacy >/dev/null 2>&1 || true
  docker run -d --name bank-legacy -p "$LEGACY_PORT:8080" bank-legacy:1.0 >/dev/null
fi

WEBPACK="$ROOT/node_modules/webpack-cli/bin/cli.js"
if [ "$MODE" = "prod" ]; then
  "$ROOT/scripts/stage.sh"
  start_bg frontend node "$ROOT/scripts/serve-stage.mjs"
else
  for d in packages/utility apps/mfe-navbar apps/mfe-accounts apps/mfe-transactions apps/mfe-transfer-react apps/mfe-statements apps/root-config; do
    (cd "$d" && start_bg "$(basename "$d")" node "$WEBPACK" serve --mode development --config webpack.config.cjs)
  done
fi

wait_http "http://localhost:$BFF_PORT/healthz"
[ "${SKIP_LEGACY:-0}" = "1" ] || wait_http "http://localhost:$LEGACY_PORT/legacy/healthz" 120
wait_http "http://localhost:$ROOT_PORT/importmap.json" 120
"$ROOT/scripts/seed.sh"
log "portal ready ($MODE): http://localhost:$ROOT_PORT   login: taro / demo1234"

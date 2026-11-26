#!/usr/bin/env bash
# Captures the proof for a phase with headless Playwright. Usage: scripts/capture-proof.sh <phase1-local|phase2-cloud>
# phase1-local expects the stack to be running (MODE=prod scripts/dev-up.sh); it is started if it is not.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

PHASE="${1:?usage: capture-proof.sh <phase1-local|phase2-cloud>}"
OUT="proof/$PHASE"
mkdir -p "$OUT/screenshots" "$OUT/logs" "$OUT/tests"

case "$PHASE" in
  phase1-local)
    BASE="http://localhost:$ROOT_PORT"
    curl -fsS "$BASE/importmap.json" >/dev/null 2>&1 || MODE=prod "$ROOT/scripts/dev-up.sh"
    node e2e/capture.mjs local "$BASE" "$OUT"

    # Security headers served for the shell (CSP etc.)
    curl -sI "$BASE/" | redact > "$OUT/logs/curl-headers-csp.txt"
    # Structured service logs
    for s in bff frontend; do [ -f ".local/logs/$s.log" ] && redact < ".local/logs/$s.log" > "$OUT/logs/$s.log"; done
    docker logs bank-legacy 2>&1 | redact | tail -50 > "$OUT/logs/tomcat.log" || true

    # Storybook screenshots
    [ -d packages/ui/storybook-static ] || (cd packages/ui && npx storybook build -o storybook-static --disable-telemetry >/dev/null)
    start_bg storybook npx http-server packages/ui/storybook-static -p 6006 -s
    wait_http http://127.0.0.1:6006/iframe.html 30
    node e2e/capture.mjs storybook http://127.0.0.1:6006 "$OUT"
    stop_bg storybook; kill_port 6006
    ;;
  phase2-cloud)
    BASE="$(terraform -chdir=infra output -raw site_url)"
    node e2e/capture.mjs "${CLOUD_MODE:?set CLOUD_MODE=cloud-legacy|cloud-v2}" "$BASE" "$OUT"
    ;;
  *) echo "unknown phase $PHASE" >&2; exit 2 ;;
esac
log "proof captured in $OUT"

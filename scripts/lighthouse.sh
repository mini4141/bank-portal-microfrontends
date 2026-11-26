#!/usr/bin/env bash
# Lighthouse CI against the running portal. Usage: scripts/lighthouse.sh [base-url] [output-dir]
set -euo pipefail
. "$(dirname "$0")/lib.sh"

BASE="${1:-http://localhost:$ROOT_PORT}"
OUT="${2:-proof/phase1-local/tests/lighthouse}"
mkdir -p "$OUT"

JAR=".local/lh-cookies.txt"
curl -fsS -c "$JAR" -H 'content-type: application/json' \
  -d '{"username":"taro","password":"demo1234"}' "$BASE/api/session" >/dev/null
export LHCI_COOKIE="$(awk '$6=="bk_session"{print $7}' "$JAR")"
export LHCI_BASE_URL="$BASE" LHCI_OUT="$OUT"
export CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"

npx lhci autorun --config=lighthouserc.cjs 2>&1 | redact | tee "$OUT/lhci.log"

# The reports embed the request headers: drop the session cookie before the files are kept as proof.
sed -i -E 's/bk_session=[^"\; ]+/bk_session=<redacted>/g' "$OUT"/*.json "$OUT"/*.html "$OUT/lhci.log"

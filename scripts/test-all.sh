#!/usr/bin/env bash
# Runs every local test layer and exits non-zero on the first failure.
# Output (logs, JUnit XML, HTML reports) goes to proof/<PHASE>/tests/.
#   PHASE=phase1-local (default)
#   SKIP_STACK=1  run only the static and unit layers (no Docker, no browser)
set -euo pipefail
. "$(dirname "$0")/lib.sh"

PHASE="${PHASE:-phase1-local}"
OUT="proof/$PHASE/tests"
rm -rf "$OUT" && mkdir -p "$OUT"

step() { log "== $1"; }

step "lint (ESLint + Prettier)"
npm run lint 2>&1 | tee "$OUT/lint.log"

step "typecheck (tsc / vue-tsc)"
npm run typecheck 2>&1 | tee "$OUT/typecheck.log"

step "Jest (pagination component, Pinia store, React MFE form)"
JEST_JUNIT_DIR="$OUT/jest" npx jest --ci 2>&1 | tee "$OUT/jest.log"

step "dependency audit"
npm run audit:ci 2>&1 | tee "$OUT/npm-audit.log"

step "JUnit (JSP statement servlet)"
MSYS_NO_PATHCONV=1 docker run --rm -v "$(hostpwd):/w" -v bank-m2:/root/.m2 -w /w/legacy \
  maven:3.9-eclipse-temurin-21 mvn -B test 2>&1 | tee "$OUT/junit-servlet.log" | tail -15
mkdir -p "$OUT/junit-servlet" && cp legacy/target/surefire-reports/*.xml "$OUT/junit-servlet/"

step "Storybook build + test-runner smoke"
(cd packages/ui && npx storybook build -o storybook-static --disable-telemetry) 2>&1 | tail -3 | tee "$OUT/storybook-build.log"
start_bg storybook npx http-server packages/ui/storybook-static -p 6006 -s
wait_http http://127.0.0.1:6006/iframe.html 30
(cd packages/ui && npx test-storybook --url http://127.0.0.1:6006 --ci) 2>&1 | tee "$OUT/storybook-test-runner.log" \
  || { stop_bg storybook; kill_port 6006; exit 1; }
stop_bg storybook; kill_port 6006

if [ "${SKIP_STACK:-0}" != "1" ]; then
  step "Playwright e2e (production bundles, BFF, Tomcat)"
  MODE=prod "$ROOT/scripts/dev-up.sh" 2>&1 | tail -3
  trap '"$ROOT/scripts/dev-down.sh" >/dev/null 2>&1' EXIT
  (cd e2e && PW_OUT="$ROOT/$OUT/playwright" npx playwright test) 2>&1 | tee "$OUT/playwright.log"

  step "Lighthouse CI budget on /accounts"
  "$ROOT/scripts/lighthouse.sh" "http://localhost:$ROOT_PORT" "$OUT/lighthouse"
fi

log "all test layers passed; reports in $OUT"

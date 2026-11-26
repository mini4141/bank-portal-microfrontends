#!/usr/bin/env bash
# Builds every micro-frontend and lays the output out like the CDN (S3/CloudFront) will serve it:
#   .stage/index.html, config.json, importmap.json
#   .stage/mfe/<name>/<version>/bank-<name>.js (+ lazy chunks)
set -euo pipefail
. "$(dirname "$0")/lib.sh"

VERSION="${VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo local)}"
[ "${SKIP_BUILD:-0}" = "1" ] || npm run build >/dev/null

rm -rf .stage && mkdir -p .stage/mfe
cp -r apps/root-config/dist/. .stage/

MAP="{\n  \"imports\": {"
sep=""
for entry in utility:packages/utility navbar:apps/mfe-navbar accounts:apps/mfe-accounts \
  transactions:apps/mfe-transactions transfer:apps/mfe-transfer-react statements:apps/mfe-statements; do
  name="${entry%%:*}"; dir="${entry#*:}"
  mkdir -p ".stage/mfe/$name/$VERSION"
  cp -r "$dir/dist/." ".stage/mfe/$name/$VERSION/"
  MAP="$MAP$sep\n    \"@bank/$name\": \"/mfe/$name/$VERSION/bank-$name.js\""
  sep=","
done
printf "$MAP\n  }\n}\n" > .stage/importmap.json
find .stage -name '*.map' -delete
log "staged version $VERSION in .stage ($(find .stage -type f | wc -l) files)"

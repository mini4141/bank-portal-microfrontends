#!/usr/bin/env bash
# Renders docs/*.puml to SVG with the official PlantUML image (also run in CI).
set -euo pipefail
. "$(dirname "$0")/lib.sh"

MSYS_NO_PATHCONV=1 docker run --rm -v "$(hostpwd):/data" -w /data plantuml/plantuml:1.2025.4 \
  -tsvg -o /data/docs /data/docs/*.puml
log "rendered: $(ls docs/*.svg | tr '\n' ' ')"

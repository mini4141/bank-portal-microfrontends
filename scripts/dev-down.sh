#!/usr/bin/env bash
# Stops everything started by dev-up.sh.
set -uo pipefail
. "$(dirname "$0")/lib.sh"

for f in .local/pids/*.pid; do
  [ -e "$f" ] || continue
  stop_bg "$(basename "$f" .pid)"
done
for p in "$BFF_PORT" "$ROOT_PORT" 9010 9011 9012 9013 9014 9015; do kill_port "$p"; done
docker rm -f bank-legacy >/dev/null 2>&1 || true
log "stack stopped"

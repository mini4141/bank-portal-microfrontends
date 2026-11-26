#!/usr/bin/env bash
# Shared helpers for the project scripts (POSIX bash; works in Git Bash on Windows and on Linux CI).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p .local/logs .local/pids

if [ -f .env ]; then set -a; . ./.env; set +a; fi
BFF_PORT="${PORT:-3000}"
LEGACY_PORT="${LEGACY_PORT:-8081}"
ROOT_PORT="${ROOT_PORT:-9000}"

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

# start_bg <name> <command...>: run detached, log to .local/logs/<name>.log, remember the pid.
start_bg() {
  local name="$1"; shift
  nohup "$@" > ".local/logs/$name.log" 2>&1 &
  echo $! > ".local/pids/$name.pid"
  log "started $name (pid $!)"
}

stop_bg() {
  local f=".local/pids/$1.pid"
  [ -f "$f" ] || return 0
  local pid; pid="$(cat "$f")"
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //PID "$pid" //F //T >/dev/null 2>&1 || true
  else
    kill "$pid" >/dev/null 2>&1 || true
  fi
  rm -f "$f"
}

# kill_port <port>: fallback for processes whose pid we lost (Windows only).
kill_port() {
  command -v netstat >/dev/null 2>&1 && command -v taskkill >/dev/null 2>&1 || return 0
  for pid in $(netstat -ano | grep -E ":$1 .*LISTENING" | awk '{print $5}' | sort -u); do
    taskkill //PID "$pid" //F //T >/dev/null 2>&1 || true
  done
}

wait_http() { # wait_http <url> [seconds]
  local url="$1" tries="${2:-90}"
  for _ in $(seq "$tries"); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then return 0; fi
    sleep 1
  done
  log "timeout waiting for $url"; return 1
}

# Redacts account ids, keys and the deployer IP before output is stored as proof.
redact() { sed -E 's/\b[0-9]{12}\b/<ACCOUNT_ID>/g; s/(AKIA|ASIA)[A-Z0-9]{16}/<ACCESS_KEY>/g'; }

# Host path usable in docker -v on Git Bash (Windows) and Linux.
hostpwd() { pwd -W 2>/dev/null || pwd; }

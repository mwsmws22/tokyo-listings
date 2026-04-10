#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"

API_PID_FILE="/tmp/tokyo-listings-dev-api.pid"
WEB_PID_FILE="/tmp/tokyo-listings-dev-web.pid"
API_LOG_FILE="/tmp/tokyo-listings-dev-api.log"
WEB_LOG_FILE="/tmp/tokyo-listings-dev-web.log"

is_pid_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

pid_from_file() {
  local file="$1"
  [[ -f "$file" ]] || return 1
  tr -d '[:space:]' <"$file"
}

port_in_use() {
  local port="$1"
  ss -tln 2>/dev/null | grep -qE "[\[\:]$port([[:space:]]|$)"
}

stop_pid_file_process() {
  local file="$1"
  if pid="$(pid_from_file "$file" 2>/dev/null)"; then
    if is_pid_running "$pid"; then
      kill "$pid" 2>/dev/null || true
      sleep 0.5
      is_pid_running "$pid" && kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$file"
}

kill_bun_on_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  [[ -z "$pids" ]] && return 0
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    local cmd
    cmd="$(ps -p "$pid" -o comm= 2>/dev/null || true)"
    if [[ "$cmd" == "bun" ]]; then
      kill "$pid" 2>/dev/null || true
    fi
  done <<<"$pids"
}

docker_available() {
  docker info >/dev/null 2>&1
}

docker_running() {
  docker_available || return 1
  local running
  running="$(docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null || true)"
  [[ -n "$running" ]]
}

start_dev_service() {
  local name="$1"
  local pid_file="$2"
  local log_file="$3"
  local cmd="$4"
  local port="$5"

  if pid="$(pid_from_file "$pid_file" 2>/dev/null)"; then
    if is_pid_running "$pid"; then
      echo "$name already running (pid $pid)"
      return 0
    fi
  fi

  if port_in_use "$port"; then
    echo "Port $port is already in use; run 'bun down' first." >&2
    exit 1
  fi

  cd "$ROOT"
  nohup sh -c "exec $cmd" >"$log_file" 2>&1 &
  echo "$!" >"$pid_file"
  echo "Started $name (pid $(cat "$pid_file"))"
}

do_up() {
  if docker_running; then
    echo "Docker services detected; stopping docker api/web but keeping postgres..."
    docker compose -f "$COMPOSE_FILE" stop api web >/dev/null 2>&1 || true
    docker compose -f "$COMPOSE_FILE" rm -f api web >/dev/null 2>&1 || true
  fi

  if docker_available; then
    docker compose -f "$COMPOSE_FILE" up -d postgres
  else
    echo "Docker daemon not available; cannot start postgres." >&2
    exit 1
  fi

  start_dev_service "api" "$API_PID_FILE" "$API_LOG_FILE" "bun run --cwd apps/api --env-file ../../.env dev" "4001"
  start_dev_service "web" "$WEB_PID_FILE" "$WEB_LOG_FILE" "bun run --cwd apps/web --env-file ../../.env dev" "3000"
}

do_down() {
  stop_pid_file_process "$API_PID_FILE"
  stop_pid_file_process "$WEB_PID_FILE"
  kill_bun_on_port "4001"
  kill_bun_on_port "3000"

  if docker_available; then
    docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
  fi
}

do_docker_up() {
  stop_pid_file_process "$API_PID_FILE"
  stop_pid_file_process "$WEB_PID_FILE"
  kill_bun_on_port "4001"
  kill_bun_on_port "3000"

  if ! docker_available; then
    echo "Docker daemon not available." >&2
    exit 1
  fi

  if docker_running; then
    echo "Docker services detected; restarting api/web while keeping postgres..."
    docker compose -f "$COMPOSE_FILE" stop api web >/dev/null 2>&1 || true
    docker compose -f "$COMPOSE_FILE" rm -f api web >/dev/null 2>&1 || true
  fi
  docker compose -f "$COMPOSE_FILE" up -d postgres api web
}

do_status() {
  echo "== DEV (nohup) =="
  if pid="$(pid_from_file "$API_PID_FILE" 2>/dev/null)" && is_pid_running "$pid"; then
    echo "api: running (pid $pid, port 4001)"
  else
    echo "api: not running"
  fi
  if pid="$(pid_from_file "$WEB_PID_FILE" 2>/dev/null)" && is_pid_running "$pid"; then
    echo "web: running (pid $pid, port 3000)"
  else
    echo "web: not running"
  fi

  echo
  echo "== DOCKER compose =="
  if docker_available; then
    docker compose -f "$COMPOSE_FILE" ps
  else
    echo "docker daemon unavailable"
  fi

  echo
  echo "== PORTS =="
  ss -tlnp 2>/dev/null | grep -E ":3000|:4001|:5432" || echo "no listeners on 3000/4001/5432"
}

case "${1:-}" in
up)
  do_up
  ;;
down)
  do_down
  ;;
docker-up)
  do_docker_up
  ;;
status)
  do_status
  ;;
*)
  echo "Usage: $0 {up|down|docker-up|status}" >&2
  exit 1
  ;;
esac

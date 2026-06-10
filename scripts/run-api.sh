#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

if [ -x "$ROOT_DIR/api/.venv/bin/python" ]; then
  exec "$ROOT_DIR/api/.venv/bin/python" "$SCRIPT_DIR/run-api.py" "$@"
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$SCRIPT_DIR/run-api.py" "$@"
fi

exec python "$SCRIPT_DIR/run-api.py" "$@"

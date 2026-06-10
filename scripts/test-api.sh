#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
API_DIR="$ROOT_DIR/api"

PYTHON_BIN="${PYTHON:-$API_DIR/.venv/bin/python}"
if [ ! -x "$PYTHON_BIN" ]; then
  PYTHON_BIN="${PYTHON:-python3}"
fi

if ! "$PYTHON_BIN" -c "import pytest" >/dev/null 2>&1; then
  if [ "${SKIP_INSTALL:-0}" = "1" ]; then
    echo "pytest is not installed. Run: $PYTHON_BIN -m pip install -r $API_DIR/requirements-dev.txt" >&2
    exit 1
  fi
  "$PYTHON_BIN" -m pip install -r "$API_DIR/requirements-dev.txt"
fi

cd "$API_DIR"
exec "$PYTHON_BIN" -m pytest "$@"

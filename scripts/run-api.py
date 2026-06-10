#!/usr/bin/env python3
"""Set up and run the HAK FastAPI backend from a fresh checkout."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "api"
VENV_DIR = API_DIR / ".venv"


def venv_python() -> Path:
    if os.name == "nt":
        return VENV_DIR / "Scripts" / "python.exe"
    return VENV_DIR / "bin" / "python"


def run(command: list[str | os.PathLike[str]], *, cwd: Path = API_DIR) -> None:
    printable = " ".join(str(part) for part in command)
    print(f"\n> {printable}")
    subprocess.run([str(part) for part in command], cwd=cwd, check=True)


def ensure_venv() -> Path:
    python_path = venv_python()
    if python_path.exists():
        return python_path

    print(f"Creating virtual environment at {VENV_DIR}")
    run([sys.executable, "-m", "venv", VENV_DIR], cwd=ROOT_DIR)
    return python_path


def install_dependencies(python_path: Path, *, dev: bool, skip_install: bool) -> None:
    if skip_install:
        return

    requirements = API_DIR / ("requirements-dev.txt" if dev else "requirements.txt")
    run([python_path, "-m", "pip", "install", "-r", requirements])


def ensure_env_file() -> None:
    env_path = API_DIR / ".env"
    example_path = API_DIR / ".env.example"
    if env_path.exists() or not example_path.exists():
        return

    shutil.copyfile(example_path, env_path)
    print(f"Created {env_path.relative_to(ROOT_DIR)} from .env.example")


def reset_database(*, clear_uploads: bool) -> None:
    db_path = API_DIR / "hak_approval.db"
    if db_path.exists():
        db_path.unlink()
        print(f"Deleted {db_path.relative_to(ROOT_DIR)}")

    if not clear_uploads:
        return

    uploads_dir = API_DIR / "uploads"
    if not uploads_dir.exists():
        return

    for pdf_path in uploads_dir.glob("*.pdf"):
        pdf_path.unlink()
    print("Deleted uploaded PDF files from api/uploads")


def seed_database(python_path: Path, *, no_seed: bool) -> None:
    if no_seed:
        return
    run([python_path, "-m", "app.seed"])


def run_server(python_path: Path, args: argparse.Namespace) -> None:
    command: list[str | os.PathLike[str]] = [
        python_path,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        args.host,
        "--port",
        str(args.port),
    ]
    if args.reload:
        command.append("--reload")

    print(f"\nAPI will be available at http://{args.host}:{args.port}")
    print("Swagger docs: /docs")
    run(command)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create the API venv, install dependencies, seed data, and start FastAPI.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind host. Default: 127.0.0.1")
    parser.add_argument("--port", type=int, default=8000, help="Bind port. Default: 8000")
    parser.add_argument("--no-reload", dest="reload", action="store_false", help="Disable uvicorn reload")
    parser.add_argument("--setup-only", action="store_true", help="Set up env/deps/seed, then exit")
    parser.add_argument("--skip-install", action="store_true", help="Do not run pip install")
    parser.add_argument("--dev", action="store_true", help="Install api/requirements-dev.txt instead")
    parser.add_argument("--no-seed", action="store_true", help="Skip python -m app.seed")
    parser.add_argument("--reset-db", action="store_true", help="Delete api/hak_approval.db before seeding")
    parser.add_argument(
        "--clear-uploads",
        action="store_true",
        help="With --reset-db, also delete PDF files from api/uploads",
    )
    parser.set_defaults(reload=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.clear_uploads and not args.reset_db:
        raise SystemExit("--clear-uploads must be used with --reset-db")

    if args.reset_db:
        reset_database(clear_uploads=args.clear_uploads)

    python_path = ensure_venv()
    install_dependencies(python_path, dev=args.dev, skip_install=args.skip_install)
    ensure_env_file()
    seed_database(python_path, no_seed=args.no_seed)

    if args.setup_only:
        print("\nAPI setup complete.")
        return

    run_server(python_path, args)


if __name__ == "__main__":
    main()

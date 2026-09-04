#!/usr/bin/env bash
#
# Manage the local Postgres container for development.
#
# Usage:
#   ./scripts/db.sh up      Start Postgres (localhost:5432, db: expenser)
#   ./scripts/db.sh down    Stop Postgres
#   ./scripts/db.sh reset   Stop, wipe the data volume, start fresh
#   ./scripts/db.sh logs    Tail container logs
#   ./scripts/db.sh psql    Open a psql shell inside the container
#   ./scripts/db.sh url     Print the connection string for .env.local

set -euo pipefail

cd "$(dirname "$0")/.."

CONTAINER="expenser-db"

cmd="${1:-up}"

case "$cmd" in
  up)
    docker compose up -d
    echo "Waiting for Postgres to be healthy..."
    until [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = "healthy" ]; do
      sleep 1
    done
    echo "Postgres is ready."
    echo "DATABASE_URL=postgresql://expenser:expenser@localhost:5432/expenser"
    ;;
  down)
    docker compose down
    ;;
  reset)
    docker compose down -v
    docker compose up -d
    echo "Waiting for Postgres to be healthy..."
    until [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = "healthy" ]; do
      sleep 1
    done
    echo "Postgres reset complete."
    ;;
  logs)
    docker compose logs -f db
    ;;
  psql)
    docker exec -it "$CONTAINER" psql -U expenser -d expenser
    ;;
  url)
    echo "DATABASE_URL=postgresql://expenser:expenser@localhost:5432/expenser"
    echo "DATABASE_URL_UNPOOLED=postgresql://expenser:expenser@localhost:5432/expenser"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Usage: $0 {up|down|reset|logs|psql|url}" >&2
    exit 1
    ;;
esac

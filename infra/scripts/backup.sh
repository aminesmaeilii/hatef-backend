#!/usr/bin/env bash
# Backs up the Postgres database (the single source of truth for every
# domain in this platform — see AGENTS.md) and, optionally, the MinIO/S3
# file bucket. Reads connection info from the same DATABASE_URL /
# STORAGE_* env vars every other script in this repo uses (see root .env),
# so it works unmodified against dev, staging, or production as long as
# the right .env is sourced first.
#
# Usage:
#   ./infra/scripts/backup.sh [output-dir]
#
# Output: <output-dir>/hatef-db-<UTC timestamp>.dump (pg_dump custom format
# — compressed, and restorable with pg_restore, including selective
# table/schema restore, unlike a plain SQL dump) and, if `mc` (the MinIO
# client) is installed and STORAGE_* vars are set, a mirrored copy of the
# storage bucket under <output-dir>/hatef-storage-<timestamp>/.
set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUTPUT_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set — source the target environment's .env first." >&2
  exit 1
fi

DB_DUMP_PATH="$OUTPUT_DIR/hatef-db-$TIMESTAMP.dump"
echo "==> Dumping Postgres to $DB_DUMP_PATH"
pg_dump --format=custom --no-owner --no-privileges --file="$DB_DUMP_PATH" "$DATABASE_URL"
echo "==> Postgres dump complete: $(du -h "$DB_DUMP_PATH" | cut -f1)"

if command -v mc >/dev/null 2>&1 && [ -n "${STORAGE_ENDPOINT:-}" ] && [ -n "${STORAGE_BUCKET:-}" ]; then
  STORAGE_DIR="$OUTPUT_DIR/hatef-storage-$TIMESTAMP"
  echo "==> Mirroring storage bucket '$STORAGE_BUCKET' to $STORAGE_DIR"
  mc alias set hatef-backup-source "$STORAGE_ENDPOINT" "$STORAGE_ACCESS_KEY_ID" "$STORAGE_SECRET_ACCESS_KEY" >/dev/null
  mc mirror --quiet "hatef-backup-source/$STORAGE_BUCKET" "$STORAGE_DIR"
  echo "==> Storage mirror complete: $(du -sh "$STORAGE_DIR" | cut -f1)"
else
  echo "==> Skipping storage backup (mc not installed, or STORAGE_ENDPOINT/STORAGE_BUCKET unset)."
  echo "    File bytes live in MinIO/S3; file *metadata* (the row of truth —"
  echo "    checksum, scan status, uploader) is in Postgres and already covered above."
fi

echo "==> Done. See docs/BACKUP_RESTORE.md for the restore procedure and retention policy."

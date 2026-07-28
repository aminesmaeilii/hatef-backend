#!/usr/bin/env bash
# Restores a pg_dump (custom format) produced by backup.sh into a target
# database. Deliberately requires the target database name as an explicit
# argument (never inferred from DATABASE_URL) and an explicit CONFIRM=yes,
# because pg_restore --clean drops every existing object in that database
# first — the two guards below exist so this can never be run "by habit"
# against the wrong target.
#
# Usage:
#   CONFIRM=yes ./infra/scripts/restore.sh <dump-file> <target-db-name>
#
# The target database must already exist and be reachable using the same
# connection credentials/host as DATABASE_URL (only the db name differs) —
# see docs/BACKUP_RESTORE.md for the exact `createdb` step and the full
# drill this was verified against.
set -euo pipefail

DUMP_FILE="${1:-}"
TARGET_DB="${2:-}"

if [ -z "$DUMP_FILE" ] || [ -z "$TARGET_DB" ]; then
  echo "Usage: CONFIRM=yes $0 <dump-file> <target-db-name>" >&2
  exit 1
fi
if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set — source the target environment's .env first (used for host/user/credentials; the db name itself is replaced with $TARGET_DB)." >&2
  exit 1
fi
if [ "${CONFIRM:-}" != "yes" ]; then
  echo "Refusing to run: this drops every object in database '$TARGET_DB' before restoring." >&2
  echo "Re-run with CONFIRM=yes once you've verified '$TARGET_DB' is the intended target." >&2
  exit 1
fi

# Swap only the database name segment of DATABASE_URL, keeping host/port/
# user/password/query-string exactly as configured for this environment.
TARGET_URL="$(node -e "
  const u = new URL(process.env.DATABASE_URL);
  u.pathname = '/$TARGET_DB';
  console.log(u.toString());
")"

echo "==> Restoring $DUMP_FILE into database '$TARGET_DB'"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$TARGET_URL" "$DUMP_FILE"
echo "==> Restore complete."

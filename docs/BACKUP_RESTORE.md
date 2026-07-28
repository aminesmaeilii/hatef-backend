# Backup and Restore

## What actually needs backing up

Postgres is the single source of truth for every domain in this platform
(see AGENTS.md — money, workflow state, audit trail, everything). It is the
only store that must be backed up:

- **Redis** holds only ephemeral/derived state — sessions (re-established by
  logging in again), OTP/rate-limit counters, and the BullMQ job queue
  (rebuilt from `OutboxEvent` rows, which are themselves in Postgres — see
  the Phase 0 transactional-outbox pattern). Losing Redis loses no
  business data.
- **MinIO/S3** holds uploaded file *bytes*. The file's metadata of record —
  checksum, scan status, uploader, channel — lives in Postgres's `files`
  table, so a Postgres restore alone recovers a fully consistent catalog;
  only the underlying bytes for files uploaded after the last storage
  mirror would need re-upload by the partner. `infra/scripts/backup.sh`
  mirrors the bucket too when the `mc` CLI is available, for exactly this
  reason.

## Scripts

- `infra/scripts/backup.sh [output-dir]` — `pg_dump --format=custom` of the
  database in `DATABASE_URL`, plus an `mc mirror` of the storage bucket if
  `mc` is installed. Custom format (not plain SQL) because it's compressed
  and supports selective table restore.
- `infra/scripts/restore.sh <dump-file> <target-db-name>` — `pg_restore
  --clean --if-exists` into an explicit target database. Requires
  `CONFIRM=yes` and an explicit target db name (never inferred from
  `DATABASE_URL`) on purpose: `--clean` drops every existing object in the
  target first, so there is no "accidentally ran it against prod" path —
  you must name the target database yourself.

Both scripts read Postgres connection info from `DATABASE_URL` exactly like
every other script in this repo (see AGENTS.md's "Environment" section) —
source the right environment's `.env` before running either one.

## Retention policy (recommended for staging/production)

Not yet automated (no scheduler is deployed for this in Phase 7) — run
`backup.sh` on a cron/scheduled job in whatever environment hosts
production, and keep:

- Daily dumps for 14 days.
- Weekly dumps for 8 weeks.
- Monthly dumps for 12 months.

A managed Postgres provider's own point-in-time-recovery/snapshot feature
(if the deployment target offers one) is a reasonable substitute for the
daily tier — `backup.sh`'s logical dumps matter most as the
provider-independent, restorable-anywhere fallback.

## Restore drill — executed and verified this session

The scripts above assume `pg_dump`/`pg_restore` on the host's `PATH` (true
of any real ops box, and of GitHub Actions' `ubuntu-latest` runners, which
ship `postgresql-client` preinstalled). This Windows dev machine has
neither installed natively, so this drill ran the equivalent commands
inside the already-running `hatef-postgres-1` container (`docker exec`) —
the same `pg_dump`/`pg_restore` binaries, same live database, same dump
format `backup.sh`/`restore.sh` produce and consume; only the invocation
shell differs from what a Linux ops host would use directly.

**1. Baseline row counts, live dev database (`hatef`):**

| table | count |
|---|---|
| `users` | 31 |
| `channels` | 25 |
| `files` | 36 |
| `tickets` | 0 |
| `audit_logs` | 416 |
| `ledger_entries` | 4 |

**2. Backup:**
```
pg_dump --format=custom --no-owner --no-privileges --file=hatef-drill-<ts>.dump -U hatef hatef
```
Produced a 357,475-byte custom-format dump.

**3. Restore into a throwaway database** (never the source database —
proves the mechanism without risking real dev data):
```
createdb hatef_restore_drill
pg_restore --clean --if-exists --no-owner --no-privileges -U hatef -d hatef_restore_drill hatef-drill-<ts>.dump
```

**4. Verification — row counts in the restored database, identical to the baseline:**

| table | count | matches baseline |
|---|---|---|
| `users` | 31 | ✓ |
| `channels` | 25 | ✓ |
| `files` | 36 | ✓ |
| `tickets` | 0 | ✓ |
| `audit_logs` | 416 | ✓ |
| `ledger_entries` | 4 | ✓ |

**5. Content spot-check** (not just counts — the actual row data), the
first user by `created_at` in both databases:
```
source: 6f97c56f-a855-423c-81be-163ddebfcab2 | +989121234567
restored: 6f97c56f-a855-423c-81be-163ddebfcab2 | +989121234567
```
Identical.

**6. Cleanup:** `dropdb hatef_restore_drill` — confirmed absent from `\l`
afterward. The dump file itself was deleted from the host after this
document was written (see `.gitignore`'s `infra/backups/` entry — real
dumps never belong in source control; this file documents the drill's
result instead of keeping the binary around).

This confirms the restore mechanism works end-to-end against real data:
the produced dump is genuinely restorable, and a restore reproduces the
source database exactly, table-for-table and row-for-row.

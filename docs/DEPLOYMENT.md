# Deployment Guide

## Architecture

Four deployable processes, one shared Postgres, one shared Redis, one
object store:

| Process | What it is | How it's started |
|---|---|---|
| `backend/api` | NestJS API, versioned under `/api/v1` | `node dist/main.js` |
| `backend/worker` | Outbox relay + BullMQ processors (no HTTP surface except `/health`) | `node dist/main.js` |
| `frontend/admin-web` | Next.js — internal admin/ops workspace | `next start` |
| `frontend/partner-web` | Next.js — partner PWA | `next start` |

All four are stateless application processes — every fact that must
survive a restart lives in Postgres (see AGENTS.md). This means: any number
of replicas of `api`, `worker`, `admin-web`, `partner-web` can run behind a
load balancer with no sticky-session requirement beyond the session cookie
itself (which is a signed, DB-backed session id, not in-memory state).

Infra dependencies: Postgres 16, Redis 7, and an S3-compatible object
store (MinIO in dev, real S3 or equivalent in staging/production —
`STORAGE_PROVIDER=s3` + `STORAGE_ENDPOINT`/`STORAGE_FORCE_PATH_STYLE`
already parameterize this, see `.env.staging.example`).

## Prerequisites on the deploy host/image

- Node.js 24.x, pnpm 9.15.4 (`corepack enable && corepack prepare
  pnpm@9.15.4 --activate` — see `.github/workflows/ci.yml` for the exact
  sequence CI already uses successfully).
- Network access to Postgres, Redis, and the object store.
- A TLS-terminating reverse proxy/load balancer in front of all four
  processes (see "TLS and reverse proxy" below) — `backend/api`'s `main.ts`
  calls `app.set("trust proxy", 1)` specifically because it assumes one.

## Build and release

```bash
pnpm install --frozen-lockfile
pnpm --filter @hatef/database exec prisma migrate deploy   # never `migrate dev` outside a dev machine
pnpm build                                                  # builds every app + package, in dependency order (turbo.json)
```

`pnpm build` must run once per release, producing:
- `backend/api/dist`, `backend/worker/dist` — plain compiled JS.
- `frontend/admin-web/.next`, `frontend/partner-web/.next` — Next.js production build output.
- `backend/database/generated` — the Prisma client, regenerated from the schema every build (needed by both `api` and `worker`).

## Running each process

Same commands as every app's own `package.json` `start` script (no
deployment-specific alternate entry point — what runs in dev/CI is exactly
what runs in production):

```bash
# api
node backend/api/dist/main.js
# worker
node backend/worker/dist/main.js
# admin-web
(cd frontend/admin-web && npx next start --port "$ADMIN_WEB_PORT")
# partner-web
(cd frontend/partner-web && npx next start --port "$PARTNER_WEB_PORT")
```

Every process reads its config from `process.env` via
`backend/config/src/env.schema.ts` — set real environment variables on
the host/container (not a `.env` file the app has to discover; the
`dotenv -e ../../.env` wrapper in each `dev`/`start` script is a
monorepo-local-dev convenience, not something a deployment needs).

`backend/config`'s `loadEnv()` **refuses to start** in `NODE_ENV=production`
with a default dev secret (`SESSION_SECRET`/`OTP_HASH_PEPPER`),
`SMS_PROVIDER=dev`, or `ANTIVIRUS_PROVIDER=dev` — this is a real
fail-closed guard, not just documentation; a misconfigured production
deploy crashes on boot rather than silently running with dev-grade
security.

## Health and readiness

- `GET /health` (api and worker) — liveness, no dependency checks.
- `GET /health/ready` (api) — checks Postgres and Redis connectivity;
  point your orchestrator's readiness probe here, not `/health`.

Use `/health/ready` to gate traffic (load balancer target-group health
check, Kubernetes readiness probe, etc.) and `/health` for a lighter
liveness probe.

## Database migrations

`prisma migrate deploy` (not `migrate dev`) applies already-committed,
already-reviewed migrations from `backend/database/prisma/migrations/` —
it never generates a new migration or prompts interactively, which is
exactly the property a deploy pipeline needs. Run it once, before starting
any application process, from a single deploy coordinator (not from every
`api` replica in parallel) since Prisma's own migration-lock table already
serializes concurrent `migrate deploy` runs but there's no reason to rely
on that under normal operation.

## TLS and reverse proxy

Terminate TLS at a reverse proxy/load balancer in front of all four
processes; none of the four processes itself terminates TLS. This is why
`backend/api/src/main.ts` calls `app.set("trust proxy", 1)` — without it,
`req.ip`/`req.secure` would read the proxy's own connection instead of the
real client's, silently breaking IP-based rate limiting (`ThrottlerGuard`,
the OTP-specific per-IP limiter), audit-log IP capture, and any
secure-cookie check. Configure the proxy to forward `X-Forwarded-For` and
`X-Forwarded-Proto`, and to route:
- `ADMIN_WEB_URL` → `admin-web`
- `PARTNER_WEB_URL` → `partner-web`
- `API_URL` → `api` (both web apps call this directly from the browser
  with credentials, so its CORS allowlist in `main.ts` must exactly match
  `ADMIN_WEB_URL`/`PARTNER_WEB_URL`)

## Staging

See `.env.staging.example` for the full staging environment template and
the comment at its top explaining why staging runs with
`NODE_ENV=production` (to exercise the same fail-closed guarantees and the
real SMS/antivirus provider integrations before they're depended on in
production) rather than a permissive "staging-lite" config.

## Backup/restore, security review, and release process

See:
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) — backup/restore scripts and the drill already run against this database.
- [SECURITY.md](./SECURITY.md) — the OWASP-aligned control inventory and current known gaps.
- [LOAD_TEST.md](./LOAD_TEST.md) — the load test script and how to run it against a target environment.
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — the gate to run through before calling a release done.
- [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) — the user-acceptance script to run against staging before a production release.

## Rollback

Both application code and the database schema roll back independently:
- **Application code**: redeploy the previous build artifact — every
  process is stateless, so this is a plain redeploy, not a data migration.
- **Database**: every migration in this repo has been additive so far (see
  IMPLEMENTATION_STATUS.md's phase-by-phase migration notes — each phase
  adds tables/columns, never drops or renames in a way that breaks the
  prior application version). This means the *previous* application
  version keeps working unmodified against the *new* schema, so the safe
  rollback order is: roll back the application first, and only consider a
  database-level rollback (restore from the pre-migration backup, see
  BACKUP_RESTORE.md) if a migration itself is the thing that broke —
  never run a destructive `prisma migrate reset` against a production or
  staging database.

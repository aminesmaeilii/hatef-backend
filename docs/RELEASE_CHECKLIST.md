# Release Checklist

Run through this in order before calling a release done. Each item links to
the doc/command that proves it, rather than restating the reasoning here.

## 1. Code quality gates (all from a clean checkout)

```bash
pnpm install --frozen-lockfile
pnpm --filter @hatef/database exec prisma migrate deploy
pnpm lint        # must be 0 errors across every workspace package
pnpm typecheck    # must be 0 errors across every workspace package
pnpm test         # every workspace package's test suite must pass
pnpm build        # every app must build for production
pnpm test:e2e     # Playwright — all critical-path specs must pass (see backend/e2e/tests)
```

All seven are also what `.github/workflows/ci.yml` runs on every push/PR —
a green CI run on the release commit satisfies this section.

## 2. Security gates

- [ ] `pnpm audit --audit-level=high --prod` passes (CI enforces this as a
      hard gate — see [SECURITY.md](./SECURITY.md)'s "Dependency scan").
- [ ] Secret scan (`gitleaks`, wired into CI) is clean.
- [ ] No new unresolved critical/high finding since the last release — spot
      check [SECURITY.md](./SECURITY.md)'s "Known gaps" section is still
      accurate (nothing new slipped in undocumented).
- [ ] If this release touches auth, file handling, or financial
      approval/step-up code: re-read the relevant section of
      [SECURITY.md](./SECURITY.md) and confirm the control still holds.

## 3. Data safety

- [ ] A fresh backup exists from *before* this release's migrations run
      (`infra/scripts/backup.sh` — see [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).
- [ ] Every migration since the last release is additive (new
      tables/columns) or has an explicit, reviewed rollback plan if it
      isn't — see [DEPLOYMENT.md](./DEPLOYMENT.md)'s "Rollback" section.
- [ ] If the restore drill hasn't been re-run in the last quarter, re-run
      it (see [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)) — a backup nobody
      has restored recently is unverified.

## 4. Staging verification

- [ ] Deployed to staging using [DEPLOYMENT.md](./DEPLOYMENT.md), with
      `.env.staging.example`-derived real config (not local dev values).
- [ ] [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) run against staging — all
      Phase 1–6 items pass; any Phase 7 (PWA/accessibility) failures
      triaged and either fixed or explicitly accepted with a reason.
- [ ] [LOAD_TEST.md](./LOAD_TEST.md)'s script run against staging; latency/
      error-rate not meaningfully worse than the last release's baseline.

## 5. Operational readiness

- [ ] Health/readiness probes (`/health`, `/health/ready`) configured on
      the deploy target for all relevant processes.
- [ ] Log aggregation receiving `backend/api`/`backend/worker` output (structured
      JSON via `backend/observability` — confirm PII redaction is active,
      i.e. logs show `[REDACTED]` for mobile/email fields, not real values).
- [ ] On-call/rollback owner identified for the release window.

## 6. Sign-off

- [ ] `IMPLEMENTATION_STATUS.md` updated with what shipped in this release.
- [ ] Release commit/tag recorded, along with the staging UAT sign-off
      (date, who ran it) from section 4.

If every box above is checked, the product is deployable — this is the
literal exit proof Phase 7 (and the whole plan) asks for.

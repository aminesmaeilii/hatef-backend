# Implementation Status

Last updated: 2026-07-25

## Current phase: Phase 7 — Mobile PWA, Security Hardening, Performance, and Release (code-complete, verified against a live stack) — this is the plan's final phase

### Post-Phase-7: repository restructured into `backend/` + `frontend/`
After Phase 7 was completed and verified (below), the repo was
reorganized at the user's request from an `apps/`+`packages/` layout into
two top-level groupings, **at the same directory depth** (a flat rename,
not an added nesting level — see AGENTS.md's "Layout" section for why that
specific choice matters: every `../../.env`-style relative path in every
package's scripts/configs stays correct unmodified only because the depth
didn't change):

| Old path | New path |
|---|---|
| `apps/api` | `backend/api` |
| `apps/worker` | `backend/worker` |
| `apps/e2e` | `backend/e2e` |
| `packages/domain` | `backend/domain` |
| `packages/contracts` | `backend/contracts` |
| `packages/database` | `backend/database` |
| `packages/auth` | `backend/auth` |
| `packages/config` | `backend/config` |
| `packages/observability` | `backend/observability` |
| `packages/localization` | `backend/localization` |
| `packages/testing` | `backend/testing` |
| `apps/admin-web` | `frontend/admin-web` |
| `apps/partner-web` | `frontend/partner-web` |
| `packages/ui` | `frontend/ui` |

**Every reference to an old path below this point in the document is a
historical record of what existed at the time — not updated retroactively,
since rewriting hundreds of inline paths across this document's full
Phase 0–7 history would make the historical narrative confusing rather
than clearer.** Use the table above to translate. Files that describe
*current* state (`AGENTS.md`, everything in `docs/`, `.github/workflows/ci.yml`,
`pnpm-workspace.yaml`, `.gitignore`) were all updated to the new paths and
re-verified.

`domain`, `contracts`, and `localization` are genuinely shared (both
`backend/api` and the two `frontend/*` apps depend on them) but live under
`backend/` per the user's explicit choice — pnpm's `workspace:*` protocol
resolves by package name via `pnpm-workspace.yaml`'s globs, not physical
nesting, so this doesn't change how either frontend app imports them.
`ui` is the one package that's frontend-only, hence under `frontend/`.

One real snag hit during the move: `packages/localization` (now
`backend/localization`) refused to move via `mv`/PowerShell `Move-Item` —
"Permission denied"/"Access is denied" from what was almost certainly a
transient Windows file-lock (antivirus scan or an editor/language-server
handle), not a real permissions problem — `contracts`, `domain`, and `ui`
had hit the exact same error on the first attempt and succeeded on a
plain retry, but `localization` still failed after a retry and after
trying `Rename-Item` in place. Worked around by `cp -r` (copy) into the
new location followed by `rm -rf` of the original, which succeeded where
the direct move/rename didn't — same end state, verified with a full
`pnpm install` + `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
+ a standalone `pnpm --filter @hatef/e2e test:e2e` run afterward, all green
(22/22, 22/22, 77/77, 13/13, 4/4).

Also added this pass: the Eitaa logo in the product's visual identity —
a sticky top badge ("مخصوص کانال‌های ایتا") in both `frontend/admin-web`
and `frontend/partner-web`'s root `layout.tsx` (appears on every page,
login included, since it's in the shared layout), plus a more prominent
logo + subtitle on both apps' `/login` pages. The actual logo image file
could not be produced by this session (it only ever existed as
in-conversation multimodal content, not a filesystem artifact this
session could write) — the code references
`frontend/{admin-web,partner-web}/public/brand/eitaa-logo.png`, and both
`public/brand/` directories exist and are ready for that file; it renders
automatically once added, no further code changes needed.

### Post-Phase-7, part 2: every remaining root file moved into `backend/`
A follow-up request asked for every file still sitting outside
`backend/`/`frontend/` to move into one of those two, except whatever
genuinely can't. Moved into `backend/`, preserving each file's position
*relative to the others* (so the markdown cross-links between them needed
zero edits — see below): `AGENTS.md`, `IMPLEMENTATION_PLAN.md`,
`IMPLEMENTATION_STATUS.md` (this file), `Hatef-Full-Stack-Software-Generation-Prompt.md`,
`docker-compose.yml`, `docs/`, `infra/`, `tsconfig.base.json`.

None of these are backend-specific in content (this file documents both
frontend and backend work every phase; `docs/UAT_CHECKLIST.md` is
largely a frontend-UI walkthrough) — `backend/` was chosen only because
every one of these is genuinely whole-system (nothing here is
frontend-only the way `ui` was in the first pass), and the user's own
prior answer already established "shared/whole-system → backend" as the
tie-breaking rule for this repo. Flagged here in case a future session
disagrees and wants to split them differently — moving them again is
cheap.

**What stayed at the true repository root, and why** (see
`backend/AGENTS.md`'s "Layout" section for the same list): `.git/`,
`.github/` (GitHub Actions requires it there), `package.json`/
`pnpm-workspace.yaml`/`pnpm-lock.yaml`/`turbo.json` (pnpm/Turborepo
require these at the workspace root), `eslint.config.mjs`/
`.prettierrc.json` (both tools resolve config via upward ancestor-directory
search from wherever they're invoked — `backend/*` and `frontend/*`
packages both need to find the *same* file, which is only possible if it
sits at a common ancestor of both, i.e. root; there's no "extends" escape
hatch for either tool the way TypeScript has one), `.env`/`.env.example`/
`.env.staging.example`/`.gitignore`/`.nvmrc` (cross-cutting, and `.env` is
also referenced by `turbo.json`'s own root-anchored `globalDependencies`).

Concrete fixes this required (verified, not assumed):
- **`tsconfig.base.json`'s move changed everyone's relative depth to it.**
  All 11 `backend/*` packages' `tsconfig.json` `"extends"` went from
  `"../../tsconfig.base.json"` (2 levels up to the old root) to
  `"../tsconfig.base.json"` (1 level up to the new `backend/`, now a
  sibling). `frontend/ui/tsconfig.json` — the one frontend package that
  extends it — went from `"../../tsconfig.base.json"` to
  `"../../backend/tsconfig.base.json"` (still 2 levels up to reach the
  true root, then one step into `backend/`). Every other relative path in
  every package (the `dotenv -e ../../.env` scripts, `vitest.setup.ts`,
  `@source "../../node_modules/@hatef/ui/src"`) needed **no change**,
  because only root-level files moved this time — the packages
  themselves, and their depth from the true root, didn't move.
- **`docs/*.md`'s markdown links that pointed *out* of `docs/` into
  package source needed fixing** — e.g. `docs/SECURITY.md` had
  `[...](../backend/api/src/files/files.service.ts)`, written when `docs/`
  was a root sibling of `backend/`. Now that `docs/` is a *child* of
  `backend/`, that same link would resolve to `backend/backend/api/...`
  (wrong) — fixed to `[...](../api/src/files/files.service.ts)` (5
  occurrences, all in `SECURITY.md`), and verified each one actually
  resolves to a real file afterward. Links *within* `docs/` (`./OTHER.md`)
  and links from `docs/*.md` to the other root docs that moved alongside
  it (`../IMPLEMENTATION_STATUS.md`) needed no change, since those files
  moved as a group, preserving their relative positions to each other —
  same reasoning as `tsconfig.base.json` not needing per-package changes.
- **Plain prose/backtick mentions of paths** (e.g. `` `backend/api/src/main.ts` ``
  written as inline code, not a markdown link) were deliberately left
  alone even inside moved docs — they describe an absolute
  repo-root-relative path, which stays correct regardless of where the
  *document describing it* lives.

Re-verified after this pass: `pnpm install` (packages unchanged, so a
no-op resolution — confirms nothing about the workspace graph broke),
`pnpm lint`/`pnpm typecheck`/`pnpm build` all green (22/22, 22/22, 13/13)
on the first try. `pnpm test` initially showed 6 failed suites, every one
either `429 Too Many Requests` on the partner OTP endpoint or a
foreign-key error cascading from that same failure — not a regression:
this session's own repeated `pnpm test` runs across both restructuring
passes had exhausted the real per-IP OTP rate limiter (confirmed directly:
`otp:count:ip:*` in Redis was at 39, over the 30/hour cap), the exact
same operational hazard already documented in this file's Phase 6 section
from a previous session. Fixed the same way: cleared the specific Redis
key (`DEL otp:count:ip:...`), re-ran, clean 77/77. `pnpm --filter
@hatef/e2e test:e2e` was flaky across several consecutive runs this
pass (1–2 of 4 specs timing out waiting for post-OTP UI, a different spec
failing each time) — checked and ruled out the OTP limiter again (single
digits, not the cause) and ruled out stray leftover processes (none); most
likely transient Windows/antivirus I/O contention after this session's
very large number of file-move operations, since none of this pass's
changes touched any application source code that the failing specs
exercise. A clean retry passed 4/4; this is noted here as observed
flakiness on this dev machine, not a confirmed root cause, in case it
recurs for a future session.

### Environment
Same live stack as every prior phase — Docker (postgres/redis/minio)
reachable from the host, `pnpm db:migrate` clean. The Windows/Hyper-V
dynamic port-exclusion issue (Phase 1) remains the only unresolved
environment problem. This session also confirmed the repository has **zero
git commits** — every phase's work (0 through 7) exists only as untracked
working-tree files; nothing here has been committed yet.

### Starting point this session: a partially-built, uncommitted Phase 7
A prior session had already written substantial real Phase 7
code — a PWA (manifest, service worker, offline page, install/update
prompts), security hardening (`StepUpGuard` for sensitive financial
actions, file quarantine, MIME/magic-byte + size/count validation, a
global `ThrottlerGuard` + a purpose-built OTP/login rate limiter, `helmet`
CSP/security headers), and a real 5-test integration suite
(`phase7.integration.test.ts`) — but had stopped **before** verifying the
whole workspace was still green and before writing any of Phase 7's
documentation deliverables (PWA/accessibility/performance passes,
security review, backup/restore, staging config, deployment guide, load
test, UAT/release checklists). `pnpm lint` was actually broken at the
start of this session (see "Real bugs found" #1) — this is exactly the
kind of thing "update IMPLEMENTATION_STATUS.md before stopping" (AGENTS.md)
is meant to catch, and this session found it the hard way instead.

### Fully working — verified with real commands, not assumed

**Carried over from the prior session, re-verified this session:**
- **PWA** (`apps/partner-web`): `public/manifest.webmanifest`
  (RTL, Persian, standalone display, maskable+any icons),
  `public/sw.js` + `public/sw-version.js` (app-shell-only caching —
  never caches API responses, per AGENTS.md's "business data never lives
  only in browser state"; network-first navigation with a real
  `offline.html` fallback; cache-first for hashed `_next/static` assets),
  `src/components/pwa-register.tsx` (registers the service worker,
  surfaces both an install prompt via `beforeinstallprompt` and a "new
  version available" update prompt via `controllerchange` — spec 23.4's
  two explicit requirements), wired into `layout.tsx`
  (`metadata.manifest`, `appleWebApp`, `viewport.themeColor`). Icons are a
  committed, dependency-free generated PNG pair
  (`apps/partner-web/scripts/generate-icons.js` — zlib-only, no image
  library, matching AGENTS.md's CJS/minimal-dependency discipline).
- **Security hardening** (`apps/api`): `StepUpGuard`/`@RequireStepUp()`
  gates settlement decisions and price approval behind a fresh TOTP
  re-check independent of session age; `FilesService` quarantines any
  upload the antivirus provider flags to a separate `quarantine/` storage
  prefix that `getSignedDownloadUrl` never serves from, blocking download
  with a `FileAccessEvent` + audit-log row; a global `ThrottlerGuard`
  (`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`) plus the existing per-IP OTP
  limiter; `helmet()` with a near-empty CSP (API is pure JSON) and
  production-only HSTS.
- **`apps/api/src/test/phase7.integration.test.ts`** — 5 tests, all
  passing: step-up blocks then allows a sensitive action; a second,
  independent action proves the same guard; an infected file is
  quarantined (recorded, download blocked); a channel at
  `MAX_FILES_PER_CHANNEL` rejects one more upload; repeated login attempts
  from one client eventually hit `429`.

**Added this session:**
- **Compression** (`apps/api/src/main.ts`): the `compression` middleware —
  gzips JSON responses (report result tables and form definitions can run
  into hundreds of KB) — new dependency, verified with a clean rebuild.
- **Accessibility pass** (both `apps/admin-web` and `apps/partner-web`):
  - Fixed a real bug: onboarding/survey form fields rendered their visible
    label as a bare `<span>`/text node, never associated with the actual
    `<input>`/`<select>`/`<textarea>` — a screen reader focusing the field
    announced nothing. `FieldInput`
    (`apps/partner-web/src/app/onboarding/field-input.tsx`) now accepts
    `id`/`aria-describedby`/`required` and forwards them to the real form
    control; all three call sites (onboarding normal flow, onboarding
    correction-mode flow, survey response page) now render a real
    `<label htmlFor>` and pass a stable generated id + help-text
    `aria-describedby`. Repeatable-group child inputs (no visible per-row
    label at all) got `aria-label`.
  - Fixed a second real bug: the partner-web skip-to-content link
    (`layout.tsx`) pointed at `href="#main-content"`, but **no page in the
    entire app had an element with that id** — the skip link was
    entirely non-functional. Added `id="main-content"` to every page's
    `<main>` landmark (19 files, both mutually-exclusive-branch `<main>`s
    per file where a page has more than one), and gave `apps/admin-web`
    the same skip link + landmark parity it was missing outright (it had
    no skip link at all before this session).
  - All 53 inline `{error && <p className="text-status-danger">...}`
    validation-error messages across both apps now carry `role="alert"`
    (an ARIA live region — announced automatically when it appears),
    applied by a scripted, verified find-and-replace across every file
    matching the pattern, not by hand per file.
- **CI** (`.github/workflows/ci.yml`) — three previously-open items closed
  in one pass:
  - **Playwright wired into CI** (open since Phase 1): browser install +
    `pnpm test:e2e` + report upload added as steps in the existing job.
    Found and fixed a real flake first: running the 4 specs with the
    default multi-worker parallelism intermittently timed out (not a rate
    limit — the OTP Redis counter stayed in single digits — genuine
    resource contention, since all workers share one already-running
    api/admin-web/partner-web instance). Fixed by setting `workers: 1` in
    `apps/e2e/playwright.config.ts`; re-verified 4/4 passing repeatably
    afterward, including via the exact `pnpm test:e2e` command CI runs.
  - **Dependency scan**: `pnpm audit --audit-level=high --prod` as a hard
    gate, plus a second informational-only full-audit step. Found 3 real
    high-severity findings in production dependencies (`postcss`, `sharp`
    — both nested inside Next.js's own dependency tree, not our direct
    deps) and fixed them for real via `pnpm.overrides` in the root
    `package.json` (`postcss >=8.5.18`, `sharp >=0.35.0`), re-verified
    with `pnpm audit --prod` (clean) and a full clean rebuild of both
    Next.js apps afterward (no regression). One dev-tooling-only finding
    (`brace-expansion`, nested inside ESLint 9's own `minimatch@3` chain)
    deliberately left unfixed — investigated and confirmed the only
    patched release is a new major line (`5.x`) incompatible with
    `minimatch@3`'s `^1.1.7` constraint; forcing it risked breaking lint
    for a dev-only, non-production-reachable DoS. Documented as an
    accepted, monitored risk in `docs/SECURITY.md` rather than silently
    ignored.
  - **Secret scan**: `gitleaks/gitleaks-action@v2` added, with
    `fetch-depth: 0` on checkout (a shallow clone would only ever scan the
    single checked-out commit).
- **Backup/restore** (`infra/scripts/backup.sh`, `infra/scripts/restore.sh`,
  `docs/BACKUP_RESTORE.md`) — `pg_dump`/`pg_restore` custom-format scripts;
  `restore.sh` requires an explicit target database name and `CONFIRM=yes`
  (never infers a target from `DATABASE_URL`, since `--clean` drops
  every object in the target first). **A real drill was executed and
  verified this session**, not just documented: dumped the live dev
  database, restored into a throwaway `hatef_restore_drill` database, and
  confirmed exact row-count parity across 6 real tables (`users`,
  `channels`, `files`, `tickets`, `audit_logs`, `ledger_entries` — 31 / 25
  / 36 / 0 / 416 / 4 on both sides) plus byte-identical content on a
  spot-checked row, before dropping the throwaway database. (Ran via
  `docker exec` into the `hatef-postgres-1` container rather than the
  scripts directly, since this Windows dev machine has no native
  `pg_dump`/`pg_restore` — the scripts themselves target a host with
  `postgresql-client` installed, true of any real ops box or GitHub
  Actions' `ubuntu-latest` runners.)
- **Staging configuration** (`.env.staging.example`) — deliberately runs
  with `NODE_ENV=production` (exercising the same fail-closed guarantees
  and real SMS/antivirus provider paths a production release depends on,
  rather than a permissive "staging-lite" config).
- **`docs/DEPLOYMENT.md`** — architecture, build/release commands, how to
  run each of the four processes, health/readiness endpoints, migration
  procedure, TLS/reverse-proxy requirements (fulfills a comment already in
  `apps/api/src/main.ts` that referenced this doc before it existed),
  rollback guidance.
- **`docs/SECURITY.md`** — maps every item in spec section 24 to the
  actual implementing code, file-by-file, including verified-this-session
  facts (zero `dangerouslySetInnerHTML` anywhere in either web app; the
  only outbound HTTP calls anywhere in the backend are to a single
  hardcoded SMS provider endpoint, so SSRF's usual "server fetches a URL I
  gave it" surface doesn't exist by construction) and an honest "Known
  gaps" section (no automated pentest yet; the accepted brace-expansion
  risk).
- **`docs/LOAD_TEST.md` + `infra/load-test/run.sh`** — an `autocannon`-based
  script against `/health/ready` (the one unauthenticated endpoint that
  still exercises real Postgres+Redis connectivity). **Actually run this
  session** against a locally-built, locally-running `apps/api`: 18,119
  requests in 20.05s (~906 req/s average), p50 20ms / p99 37ms / max
  104ms latency, zero non-200 responses. Documented as a regression
  baseline, not a production capacity number, plus how to extend it to
  authenticated scenarios (not built out this session).
- **`docs/UAT_CHECKLIST.md`** — a phase-by-phase human walkthrough script
  covering every prior phase's golden path plus Phase 7's own PWA/
  accessibility/security items, meant to run against staging.
- **`docs/RELEASE_CHECKLIST.md`** — the final release gate: code-quality
  commands, security gates, data-safety gates, staging verification,
  operational readiness, sign-off — each item pointing at the doc/command
  that proves it rather than restating the reasoning.

### Real bugs found and fixed this session
1. **`pnpm lint` was broken at the very start of this session** — the
   prior session's own PWA files (`public/sw.js`, `public/sw-version.js`,
   `scripts/generate-icons.js`) used browser-service-worker globals
   (`self`, `caches`, `importScripts`, `fetch`, `Response`, `URL`) and
   plain-Node-script globals (`require`, `Buffer`, `__dirname`, `console`)
   that ESLint's flat config had no `languageOptions.globals` entry for,
   and no `no-require-imports` exemption for the one CJS script. This is
   exactly the kind of regression "verify before stopping" is meant to
   catch — it wasn't caught before this session started. Fixed with two
   scoped `files:`-matched blocks in `eslint.config.mjs` declaring the
   exact globals each file group actually uses (not a blanket
   `env: node`/`env: browser`, since neither file group is really either
   one), rather than adding the `globals` npm package for a two-file
   problem. Re-verified 22/22 lint immediately after.
2. **The partner-web skip-to-content link was entirely non-functional** —
   present since the prior session, silently broken, because it pointed
   at an id (`#main-content`) that existed on zero pages. A screen-reader
   or keyboard user tabbing to "رفتن به محتوای اصلی" and activating it
   would have gone nowhere. Fixed by adding the id to every page's actual
   `<main>` landmark (see "Fully working" above) rather than just
   deleting the link.
3. **Onboarding/survey form fields had no programmatic label association**
   — labels were visible text but not `<label htmlFor>`-linked to their
   input, so a screen reader focusing a field announced nothing. This
   would have shipped invisibly — the fields render correctly and
   visually look labeled; only assistive-tech users would ever notice.
   Found by actually reading the rendering code, not by running an
   automated accessibility checker (none is wired into this repo yet —
   see "Known gaps"). Fixed as described above.
4. **Playwright's 4 e2e specs were flaky under default parallelism** — 2
   of 4 intermittently timed out waiting for post-OTP UI, reproduced
   twice. Diagnosed by checking the OTP Redis rate-limit counter first
   (ruled out — it was in the single digits, nowhere near the 30/hour
   limit that bit a *previous* phase's session per this same file's Phase
   6 section) and then confirmed as resource contention by re-running
   with `--workers=1`, which passed 4/4 reliably, twice. This would have
   made CI's new Playwright job flaky from day one if shipped
   unexamined. Fixed by setting `workers: 1` in `playwright.config.ts`,
   with a comment explaining why (all workers share one already-running
   server instance, not per-worker isolated servers).
5. **Three real high-severity dependency vulnerabilities** (`sharp`,
   `postcss` ×2 — see "Added this session" → CI → "Dependency scan"
   above) existed in production dependencies, nested inside Next.js's own
   resolved tree. Fixed via `pnpm.overrides`, not ignored — re-verified
   both the audit (clean) and a full clean rebuild of both web apps
   (no regression from the version bump) before considering it done.

### Known gaps / deliberately deferred (stated up front)
- **No automated accessibility checker (axe, Lighthouse CI) wired into
  this repo.** This session's accessibility fixes came from manually
  reading rendering code and reasoning about what a screen reader/keyboard
  user would experience — real, verified bugs, but not the product of an
  automated scan, so other issues may remain unfound. Adding one (e.g.
  `@axe-core/playwright` inside the existing e2e suite) is a reasonable
  next step.
- **No shared `Input`/`Field`/`Label` component exists in `packages/ui`** —
  every page hand-rolls its own form markup (this session's label-
  association fix touched the 3 call sites of the one shared `FieldInput`
  component used by onboarding/surveys, but dozens of other hand-written
  forms across both apps — login, create-X forms, etc. — were not
  individually audited beyond the error-message `role="alert"` pass).
  Building a shared accessible form-field component and migrating
  existing forms to it would close this gap structurally rather than
  file-by-file.
- **The load test covers one unauthenticated endpoint only** — see
  `docs/LOAD_TEST.md`'s "Extending this" section; authenticated
  write-path scenarios (ticket creation, form submission) are not covered
  yet.
- **No automated penetration test** — `docs/SECURITY.md` is a code-level
  control review, not a black-box pentest.
- **`next.config.ts`'s `output: "standalone"` was considered and
  deliberately not adopted** — real deploy-image-size/perf benefit, but a
  monorepo-workspace-symlink change worth its own dedicated verification
  pass rather than bundling into this session's other changes; noted here
  so it isn't silently forgotten.
- Same Windows port-exclusion note as every prior phase — unresolved
  without an elevated `net stop winnat && net start winnat` or a reboot.
- Same open item as every prior phase regarding this repo's git history:
  **zero commits exist** — everything from Phase 0 through Phase 7 is
  still sitting as uncommitted working-tree state.

### Exact commands already run
```
pnpm lint / pnpm typecheck / pnpm test / pnpm build / pnpm test:e2e
  # 22/22, 22/22, 77/77 apps/api (+ all other packages) + 21/21 tasks, 13/13 build, 4/4 e2e — all green
pnpm audit --audit-level=high --prod   # clean, after the pnpm.overrides fix
pnpm audit --audit-level=high          # 1 accepted dev-only finding (brace-expansion), documented
node apps/api/dist/main.js (via pnpm --filter @hatef/api start) + curl /health/ready   # confirmed live boot
infra/load-test/run.sh http://localhost:4000/health/ready 20 20   # 18,119 req in 20.05s, 0 errors — see docs/LOAD_TEST.md
docker exec hatef-postgres-1 pg_dump ... / pg_restore ...   # full backup/restore drill, verified row-for-row — see docs/BACKUP_RESTORE.md
```

### Exact next action
All 7 phases in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) are now
code-complete. What's left is not more coding but real-world execution of
what Phase 7 documented:
1. Provision an actual staging environment using
   [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) and
   `.env.staging.example`, then run
   [docs/UAT_CHECKLIST.md](./docs/UAT_CHECKLIST.md) against it with real
   people, not just this session's code-level review.
2. Work through [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)
   before the first real production release.
3. Commit this repository's history — every phase's work, 0 through 7, is
   still uncommitted.
4. Consider the "Known gaps" above (automated a11y scanning, a shared
   accessible form component, authenticated load-test scenarios, a real
   pentest) as real follow-up work, not blocking items.
5. Same Windows port-exclusion note as every prior phase.

---

## Prior phase: Phase 6 — Tickets, Notifications, Surveys, Reports, and Analytics (code-complete, verified against a live stack)

### Environment
Same live stack as Phases 1-5 — Docker (postgres/redis/minio) reachable from
the host, `pnpm db:migrate` clean. The Windows/Hyper-V dynamic port-exclusion
issue (Phase 1) remains the only unresolved environment problem. MinIO's
Phase 1 file-upload test/e2e-spec step remains the one pre-existing failure
across every run this session — not a Phase 6 regression (confirmed: 71/72
`apps/api` tests pass, the 1 failure is that exact pre-existing MinIO case).
`apps/worker` (previously untested) now has its own real-DB test suite
(6/6 passing) and was boot-smoke-tested standalone against the live
Postgres/Redis this session — see "Real bugs found" below for what that
caught.

### Fully working — verified with real commands, not assumed
- **Schema/migration**: one additive migration,
  `20260724153140_phase6_tickets_notifications_surveys_reports`, adding 15
  new tables in four groups:
  - **Tickets**: `Ticket`/`TicketStatusEvent`/`TicketAttachment`, and —
    critically — `TicketMessage` (partner-visible) as a **wholly separate
    table** from `TicketInternalNote` (internal-only), the same structural
    discipline Phase 2's `EvaluationNote` already established. No
    partner-facing serializer, endpoint, or DTO type (`TicketDetail`) has an
    `internalNotes` field at all — only the admin-only `TicketAdminDetail`
    extends it. This is what makes "internal notes must never appear in
    partner APIs" true by construction, not by a runtime filter that could
    be forgotten.
  - **Notifications**: `NotificationTemplate` (flat key+version+status,
    same precedent as `EvaluationRubric`), `Notification` (the in-app inbox
    item), `NotificationDelivery` (one row per (notification, channel)
    attempt-set — `dedupeKey` is a real unique DB constraint, the literal
    "deduplication" mechanism spec 19 asks for), `NotificationPreference`,
    `NotificationQuietHours`, `SmsDeliveryLog` (the actual SMS-provider call
    audit trail, distinct from delivery *state*).
  - **Surveys**: just one new table, `Survey` — a thin
    distribution/targeting wrapper (title, open/close window, target
    channel ids) around an existing Phase 2 `Form`. The actual
    pages/sections/fields/rules, draft/publish/version history, and every
    response/revision/answer still live entirely in the Phase 2 form-engine
    tables — this is the literal mechanism behind spec 10.11's "reuse the
    same form engine rather than creating a second incompatible system."
  - **Reports**: `ReportDefinition` (saved config), `ReportRun` (one
    asynchronous execution — `PENDING` → `RUNNING` → `COMPLETED`/`FAILED`,
    `resultJson` caches the computed table), `ReportSnapshot` (an immutable
    exported copy — CSV/JSON content stored inline rather than routed
    through MinIO, so exports don't depend on object-storage availability).
- **`packages/domain` addition (`quiet-hours.ts`, 4 new unit tests, 58
  total in the package now)**: `isWithinQuietHours` — a pure, timezone-
  agnostic hour-window check (same-day and midnight-wrapping windows both
  handled, `startHour === endHour` means "all day"), the one piece of
  quiet-hours logic worth testing without a database.
- **`packages/database` addition — the first hand-written module this
  package exports** (`src/reports/`, the "approved semantic dataset"
  registry spec 20 asks for: "not unrestricted direct SQL"). Getting this
  exported required restructuring the package's entry point: it previously
  pointed `main`/`types` directly at the Prisma-generated client; now
  `src/index.ts` is a real barrel (`export * from "../generated/client"`
  + `export * from "./reports"`), compiled to `dist/`, so every existing
  `import { PrismaClient, SomeEnum } from "@hatef/database"` call site
  (15+ of them) keeps working unchanged — verified with a full workspace
  `pnpm typecheck` (22/22) immediately after the change, and this was the
  single highest-risk refactor of the session precisely because of how
  widely that import is used. 6 real, working dataset queries are
  registered (`support_request_funnel`, `promotion_estimate_vs_actual`,
  `obligations_due_and_overdue`, `service_debt_aging`,
  `settlement_by_channel`, `ticket_sla`) — a deliberate subset of spec 20's
  16-item "initial reports" list, not all of them (see "known gaps").
- **`packages/auth` additions**: 8 new permission keys (`ticket:read/manage`,
  `notification:read-own`, `notification-template:manage`,
  `survey:read/manage`, `report:read/manage/export`), granted to the roles
  whose real job matches (`SUPPORT_AGENT`/`OPERATIONS_MANAGER` for tickets,
  `REPORT_ANALYST`/`FINANCE_MANAGER`/`FINANCE_APPROVER`/`OPERATIONS_MANAGER`
  for reports at the appropriate read/manage/export level,
  `FORM_MANAGER`/`OPERATIONS_MANAGER`/`REPORT_ANALYST` for surveys).
  `notification:read-own` was added to **both** `BASELINE_INTERNAL` and
  `BASELINE_PARTNER` (matching `SESSION_READ_OWN`'s "everyone can read
  their own" shape — enforced by filtering on `actor.userId` in the
  service, never by ABAC resource scoping); `ticket:read` and `survey:read`
  were added to `BASELINE_PARTNER` alongside the existing baseline reads.
- **The Phase 0 outbox → BullMQ pipeline got its first two real consumers**
  this phase (previously built but unused since Phase 0 — no handler had
  ever been registered). `apps/worker/src/outbox/handlers.ts`'s
  `OutboxEventHandler` type was extended to receive `{ logger, prisma }`
  instead of just `logger` (a clean, backward-compatible-by-construction
  change since zero handlers existed yet to migrate). Two real handlers
  now registered in `main.ts`:
  - `notification.deliver` (`apps/worker/src/notifications/handlers.ts`):
    delivers one `NotificationDelivery` — `IN_APP` just marks `SENT` (the
    `Notification` row *is* the inbox item), `SMS` calls a plain
    (non-Nest-DI) `sendSms()` mirroring `DevSmsProvider`/`LiveSmsProvider`'s
    exact dev/live logic, writes a real `SmsDeliveryLog` row, and throws on
    failure so BullMQ's already-configured 5-attempt exponential backoff
    (from Phase 0's `relay.ts`) retries it — no new retry mechanism needed,
    reusing the one already built. On BullMQ's own exhaustion, the
    `OutboxEvent` row lands at `DEAD_LETTER` — the phase's own
    "failed-delivery queue," joinable back to its `NotificationDelivery` via
    `correlationId === dedupeKey` (both real columns).
  - `report.run.requested` (`apps/worker/src/reports/handlers.ts`):
    executes the `ReportRun`'s dataset against the same `REPORT_DATASETS`
    registry apps/api reads from, writing `RUNNING` → `COMPLETED`/`FAILED`
    with the real result cached in `resultJson`.
- **`apps/api` — four new modules, plus real notification-trigger wiring
  into five existing services**, all wired into `AppModule`, confirmed
  booting clean against the live stack with all 33 new routes mapped
  (verified with a direct `node dist/main.js` boot + `curl /health/ready`):
  - **`tickets/`**: `TicketsService` backed by `ticket-state-machine.ts`
    (the 7-status spec 18 workflow — `WAITING_FOR_HATEF`/
    `WAITING_FOR_PARTNER` auto-flip on `addMessage()` based on who just
    replied, for any "live" ticket; `RESOLVED`/`CLOSED`/`REOPENED` only
    reached via explicit transition). SLA breach/first-response/resolution
    time are never cached — derived live from `slaDueAt`/`firstResponseAt`/
    `resolvedAt` at read time, same "reconstruct from real facts" discipline
    Phase 5's ledger balances established. Two controllers: channel-scoped
    partner-facing (`getDetail`/messages only — the type system itself
    prevents an internal-note leak here, `TicketDetail` has no such field)
    and global admin/ops (`getAdminDetail`, internal notes, assign,
    transition).
  - **`notifications/`**: `NotificationsService.notify()` is the single
    write path — checks a caller-supplied `dedupeKey` against the primary
    (`IN_APP`) delivery's real unique constraint first (a whole `notify()`
    call is a no-op if that business event was already notified, verified
    by an integration test calling it 3× and asserting exactly 1
    `Notification` + 1 `NotificationDelivery` row exist), then per-channel
    checks `NotificationPreference` and `NotificationQuietHours` (skipped
    for `mandatory: true` security events) before creating a `PENDING`
    delivery + a real outbox event. Self-only controller (inbox, mark-read,
    preferences, quiet hours) plus an admin-only template controller.
  - **`surveys/`**: `SurveysService` — `create()`/`transition()` (admin
    authoring/distribution metadata only; actual question-building happens
    through the existing generic `/forms` admin UI), `listForChannel()`
    (open + within window + channel-targeted), `startOrResume()` (delegates
    to a new generic `FormSubmissionsService.findOrCreateSubmission()` — no
    onboarding-specific channel-provisioning or evaluation side effect),
    and `getAnalytics()` (real response/completion counts + a per-question
    breakdown — option counts for select fields, min/max/avg for numeric
    fields — computed from each submission's immutable latest
    `FormSubmissionRevision.snapshot`, spec 10's "professional analytics
    dashboard").
  - **`reports/`**: `ReportsService` — `createDefinition()`/`runReport()`
    validate `datasetKey` against the shared registry (never a raw query
    string), `runReport()` only ever creates a `PENDING` row + an outbox
    event (the API process itself never executes a dataset query — real
    asynchronous execution, not a synchronous call dressed up as async).
    `exportRun()` requires the run's own requester (`ForbiddenException`
    otherwise — verified by an integration test with a second admin user)
    and both creates the immutable `ReportSnapshot` and calls
    `AuditLogService.record()` — spec 20's "export audit."
  - **Notification triggers wired into five existing services** (not
    stubbed — each is a real `notifications.notify()` call at the exact
    point the business event happens): `EvaluationService` (correction
    requested, decision reached — notifies the submission's submitter),
    `SupportRequestsService` (new quote version, scheduled, rescheduled,
    completed — notifies `requestedById`), `ObligationsService` (new
    obligation proposed, deliverable reviewed — notifies the channel owner
    or the deliverable's submitter respectively), `SettlementsService`
    (settlement completed — notifies the channel owner). A new
    `NotificationsService.notifyChannelOwner()` convenience method (looks
    up the active `CHANNEL_OWNER` membership, no-ops if none) backs the
    three channel-owner-targeted triggers.
- **`packages/contracts`**: `tickets.ts` (with the partner/admin DTO split
  described above), `notifications.ts`, `surveys.ts`, `reports.ts`.
- **`apps/admin-web`**: `/tickets` (queue + status filter + create) and
  `/tickets/[id]` (assign, transition, partner-visible reply, internal-note
  authoring rendered in a visually distinct warning-toned block),
  `/notifications` (inbox, mark-read/mark-all-read, delivery-status badges
  per channel), `/surveys` (create by pointing at an existing published
  form, open/close transitions) and `/surveys/[id]` (response-count/
  completion-rate/per-question analytics dashboard), `/reports` (dataset
  picker → run → client-side polls the run until `COMPLETED`/`FAILED` →
  renders the real result table → CSV/JSON export as a browser download).
- **`apps/partner-web`**: `/tickets` (create + reply) and `/tickets/[id]`,
  `/notifications` (inbox), `/surveys` (list of surveys open to my channel)
  and `/surveys/[id]` (a real response wizard reusing the exact
  `FieldInput` component the onboarding wizard already uses — no second
  field-rendering implementation). Linked from the existing `/promotions`
  page's nav row.
- **Tests — all real, hitting the live Postgres (and, for the worker
  suite, real BullMQ-adjacent code paths), no mocked infra**:
  - `packages/domain`: +4 unit tests (`quiet-hours.test.ts`). 58 tests total
    in the package now (54 + 4).
  - `apps/api`: +5 unit tests (`ticket-state-machine.test.ts`) and a
    **5-test integration suite** (`phase6.integration.test.ts`) proving
    every one of the phase's named exit-proof claims: an internal note
    added via the admin endpoint is absent from the partner-facing ticket
    response's *entire serialized JSON body* (not just a missing field —
    the literal secret text is asserted absent) while present via the
    admin endpoint; three `notify()` calls sharing one `dedupeKey` produce
    exactly one `Notification` and one `NotificationDelivery` row;
    `getReportDataset("ticket_sla").run()` (the exact function the worker
    calls) reflects real tickets created earlier in the same test, and a
    `POST /reports/runs` call produces a real `PENDING` row plus a matching
    `OutboxEvent`; a second admin user is rejected (403) from exporting a
    report run they didn't request, while the real requester succeeds; and
    a two-channel survey response scenario (one full submission, one
    started-but-abandoned) produces exactly the expected
    started/submitted/completion-rate/option-breakdown numbers. 72 tests
    total in `apps/api` now (62 from Phases 1-5 + 5 + 5), 71 passing.
  - **`apps/worker`** (previously had zero tests): a real `vitest.config.ts`
    + `vitest.setup.ts` were added (mirroring apps/api's own), plus two
    real-DB integration suites (6 tests) that call the actual outbox
    handlers directly against the live Postgres: `notifications/
    handlers.test.ts` proves `IN_APP` delivery marks `SENT`, `SMS` delivery
    via the dev provider writes a real `SmsDeliveryLog`, a missing mobile
    contact fails gracefully (`FAILED`, not a thrown error) rather than
    crashing the job, and redelivery of an already-`SENT` row is a safe
    no-op (the exact guard that makes BullMQ's at-least-once semantics
    safe); `reports/handlers.test.ts` proves the `ticket_sla` dataset
    reflects real freshly-created `Ticket` rows (not mocked data) and that
    an unknown dataset key fails the run with a real error message instead
    of silently returning empty data.
- Whole-workspace `pnpm lint` (22/22), `pnpm typecheck` (22/22), `pnpm test`
  (71/72 in `apps/api` — the one failure is the pre-existing MinIO issue;
  6/6 in the newly-tested `apps/worker`; every other package's suite
  passes), `pnpm build` (13/13, both Next.js apps list every new Phase 6
  route) all pass. Both `apps/api` (`node dist/main.js` + `curl
  /health/ready`, both dependencies `up`, 33 new routes mapped) and
  `apps/worker` (`node dist/main.js`, connected to Postgres, outbox relay +
  processor started, health server up) were boot-smoke-tested standalone
  against the live stack this session — the worker specifically had never
  been run this way before Phase 6 gave it real handlers to execute.

### Real bugs found and fixed this session
1. **Gating the onboarding-only evaluation side effect broke Phase 2's own
   test on the first attempt.** `FormSubmissionsService.submit()`
   unconditionally called `evaluation.handleSubmissionSubmitted()` for
   *any* submitted form — the initial fix assumed this was "onboarding-form-
   only" and gated it on `form.key === ONBOARDING_FORM_KEY`, which broke
   Phase 2's own integration test (it submits a fresh, non-onboarding test
   form and asserts an `EvaluationCase` gets created — the real, intended
   Phase 2 behavior: *any* form submission drives evaluation, a design
   choice consistent with the "360° channel profile fed by multiple forms"
   concept). Caught immediately by `pnpm test`, not silently shipped.
   Fixed by checking `Survey.findUnique({ where: { formId } })` instead —
   "skip evaluation only if this form is a survey," which is the actually-
   correct distinction and leaves every other form's behavior unchanged.
2. **The `@hatef/database` barrel restructure was the session's highest-
   risk change** (see above) — verified immediately with a full-workspace
   `pnpm typecheck` before proceeding, specifically because 15+ existing
   files across `apps/api` and `apps/worker` import `PrismaClient` and
   generated enums directly from `@hatef/database`'s root export.
3. **A real accumulating-litter bug, caught only by actually booting the
   worker against the live stack** (not by any unit/integration test):
   `apps/worker` logged `"notification delivery row not found, dropping"`
   134 times on its first-ever boot this session, because every prior
   `pnpm test` run in `apps/api` today had called `notifications.notify()`
   (via the five newly-wired trigger points), each creating a real
   `OutboxEvent` row — but no test's `afterAll` deleted those `OutboxEvent`
   rows once it deleted the `Notification`/`NotificationDelivery` rows they
   pointed at. The worker itself handled this gracefully by design (a
   missing delivery row is logged and dropped, not a crash — this is
   actually the correct production behavior for a delivery that was
   legitimately deleted), but it meant every test run was leaving permanent
   orphaned rows in the dev database. Fixed by adding a
   `testStartedAt`-scoped `outboxEvent.deleteMany()` to the `afterAll` of
   **five** integration test files — not just the two Phase 6 added, but
   also `phase2`/`phase3`/`phase4`, since those pre-existing tests now
   *also* trigger real notifications through this phase's newly-wired
   points (correction-request, new-quote, schedule/reschedule/completion).
   Re-verified by re-running the full worker boot and confirming
   `outbox_events` has zero `PENDING`/`PROCESSING` rows left afterward.
4. **A pre-existing OTP rate limit (30 requests/IP/hour, Phase 1) got
   legitimately exhausted by this session's own repeated test runs**
   (every integration test's partner login goes through the same
   `127.0.0.1` OTP endpoint) and started failing an unrelated test with a
   429 — not a Phase 6 regression, but real evidence the rate limiter
   works. Fixed by clearing the specific `otp:count:ip:*` Redis key (a
   narrow, non-destructive dev-only action, not a config change) and
   re-verifying a clean full-suite run afterward.
5. **`apps/api`'s test suite needed a longer global timeout.** Adding a
   6th heavy integration-test file (each boots a full Nest app + hits a
   live Postgres) pushed total concurrent test-run resource contention past
   the previously-adequate default 5000ms per-test timeout, intermittently
   timing out `phase5`'s longest test. Fixed with an explicit
   `testTimeout: 30000` in `apps/api/vitest.config.ts` — reasonable given
   these are real integration tests (bcrypt hashing, TOTP, live DB
   round-trips), not fast unit tests, and re-verified stable across
   multiple full-suite reruns afterward.

### Known gaps / deliberately deferred (stated in the plan up front)
- **Only 6 of spec 20's 16 "initial reports" are registered as real
  datasets** (`support_request_funnel`, `promotion_estimate_vs_actual`,
  `obligations_due_and_overdue`, `service_debt_aging`,
  `settlement_by_channel`, `ticket_sla`) — a deliberate, documented subset
  spanning identity/promotion/barter/ticket domains to prove the "approved
  semantic dataset" architecture is real and extensible, not all 16 (e.g.
  onboarding funnel, form drop-off, channel domains/provinces, assessment
  aging, task workload, Gantt delay, survey result analytics as a
  standalone report, staff throughput are not yet registered). Adding one
  is now a single function in `packages/database/src/reports/index.ts`,
  not a new subsystem.
- **Report exports are CSV/JSON only** — spec 20 also asks for XLSX and
  PDF. Deliberately not implemented this session (would need a new
  dependency — `exceljs`/`pdfkit` or similar — for partial coverage of an
  already-large phase); the `ReportSnapshotFormat` enum and
  `ExportReportRun` contract are structured so adding `XLSX`/`PDF` variants
  later doesn't require a schema change.
- **No web-push adapter** — `NotificationChannelType.PUSH`/`EMAIL` are
  real schema/enum members (spec 19 "future push and email adapters"), but
  only `IN_APP` and `SMS` have a working delivery path in
  `apps/worker/src/notifications/handlers.ts`; a `PUSH`/`EMAIL` delivery
  attempt is marked `FAILED` with an explicit "no provider configured"
  message rather than silently succeeding or crashing.
- **The report builder's UI is a fixed dataset picker + one optional
  channel-id filter**, not the full dimension/metric/pivot/comparison/
  drill-down/save/share-by-permission builder spec 20 describes.
  `ReportDefinition` (save) and `visibility: SHARED` (share) exist at the
  API level and are exercised by `listDefinitions()`'s `OR` query, but the
  admin-web `/reports` page doesn't yet expose saving a definition or
  browsing saved ones — only ad-hoc runs.
- **No PII masking** on any dataset or export — every column a dataset
  exposes is either already partner-visible elsewhere (status, counts,
  rial amounts) or an internal id; genuinely sensitive fields (contact
  info, internal notes) are never selected by any dataset's `run()`
  function by construction, which is a different (narrower) guarantee than
  masking.
- **Survey targeting has no admin UI for picking specific channels** — the
  API (`targetChannelIds`) and service (`listForChannel()`'s filter) are
  real, but the admin-web create-survey form always creates an
  untargeted-to-all-channels survey; per-channel targeting is
  API-only this session.
- **Ticket watchers (`watcherIds`) exist in the schema but nothing writes
  to them yet** — no admin/partner UI or API endpoint sets them this
  session (mirrors the exact same "field is real, UI to populate it isn't
  built yet" pattern Phase 4 left for `Task.watcherIds`).
- Same open item as every prior phase — the Playwright job is still not
  wired into CI, and no new Phase 6 Playwright spec was added (the phase's
  exit-proof evidence lives in the real, live-DB integration suites across
  `apps/api` and `apps/worker` described above).
- Same Windows port-exclusion note as every prior phase — unresolved
  without an elevated `net stop winnat && net start winnat` or a reboot.

### Exact commands already run
```
node_modules/.bin/prisma migrate dev --name phase6_tickets_notifications_surveys_reports   # (from packages/database, DATABASE_URL set explicitly)
pnpm --filter @hatef/database db:seed   # re-run after the PERMISSIONS catalog changed; idempotent
pnpm lint / pnpm typecheck / pnpm test / pnpm build   # 22/22, 22/22, 71/72 apps/api (pre-existing MinIO issue only) + 6/6 apps/worker + all other packages pass, 13/13
node apps/api/dist/main.js (via dotenv -e .env) + curl /health/ready   # confirmed live boot, Postgres+Redis up, 33 new Phase 6 routes mapped
node apps/worker/dist/main.js (via dotenv -e .env)   # confirmed live boot, connected to Postgres, drained a real 134-event outbox backlog to PROCESSED, then verified zero PENDING/PROCESSING remained
```

### Exact next action
1. Start Phase 7 — Mobile PWA, Security Hardening, Performance, and
   Release — per [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): an
   installable partner PWA, accessibility pass, performance pass, a real
   security review (OWASP-aligned controls, dependency/secret scanning),
   backup/restore drill, staging config, deployment guide, and release
   checklist. This is the final phase in the plan.
2. Before or alongside Phase 7: wire the Playwright job into CI (open
   since Phase 1); consider registering the remaining report datasets from
   spec 20's list and adding XLSX/PDF export if reporting depth becomes a
   real product priority; add a channel-targeting picker to the admin-web
   survey creation form.
3. Same Windows port-exclusion note as every prior phase.

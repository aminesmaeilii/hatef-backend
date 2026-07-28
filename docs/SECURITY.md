# Security Review

Maps every control the product spec's section 24 ("SECURITY") requires to
what is actually implemented, with file references — not a policy
aspiration, a review of what the code in this repository actually does
today. Ordered to match the spec list.

## Server-side authorization / IDOR prevention

Every resource-scoped query filters by the caller's actual grant, not just
an id from the URL — e.g. `FilesService.getWithDownloadUrl`
([backend/api/src/files/files.service.ts](../api/src/files/files.service.ts))
looks up `{ id: fileId, channelId }` together, so a valid grant on channel A
can never resolve a file that belongs to channel B, even with a guessed/
enumerated file id. RBAC (role → permission) and resource-scoped ABAC
(permission scoped to a specific `channelId`) are enforced by
`backend/auth`'s permission checker plus `backend/api/src/rbac`'s guard on
every route via `@RequirePermission` — this is what Phase 1's exit-proof
E2E test (`backend/e2e/tests/cross-channel-denial.spec.ts`) and
`backend/api/src/test/phase1.integration.test.ts` assert directly.

## CSRF

`SessionAuthGuard`
([backend/api/src/session/session-auth.guard.ts](../api/src/session/session-auth.guard.ts))
requires the `X-CSRF-Token` header to match the session's own server-
generated, DB-stored `csrfToken` — issued once at login
(`SessionService.createSession`) and never accepted from any other source.
Session cookies alone are never sufficient to mutate state.

## XSS protection

React auto-escapes all rendered text by default; a repo-wide check found
**zero** uses of `dangerouslySetInnerHTML` in either `frontend/admin-web` or
`frontend/partner-web`. Additionally, `backend/api/src/main.ts`'s `helmet()` CSP
(`default-src 'none'`, since the API is a pure JSON service that never
renders HTML) and each Next.js app's own CSP in `next.config.ts`
(`script-src 'self' 'unsafe-inline'`, `frame-ancestors 'none'`) reduce the
blast radius of any XSS that did somehow occur.

## SQL injection protection

All database access goes through Prisma's generated client
(`backend/database`) — every query is parameterized by construction;
there is no raw string-concatenated SQL anywhere in `backend/api` or
`backend/worker`.

## SSRF controls

Checked directly: the only outbound HTTP calls anywhere in the backend are
`backend/api/src/sms/live-sms.provider.ts` and
`backend/worker/src/notifications/sms-sender.ts`, both to a single
hardcoded, non-user-influenced provider endpoint. No code path anywhere
fetches a URL built from user input (no webhook-URL field, no
attacker-controlled redirect target). SSRF's usual attack surface —
"the server fetches a URL I gave it" — does not exist in this codebase by
construction, which is a stronger guarantee than an SSRF *filter* would be.

## Secure CORS

`backend/api/src/main.ts`'s `enableCors` allowlists exactly
`ADMIN_WEB_URL`/`PARTNER_WEB_URL` (from env, never `*`) with
`credentials: true` — a request from any other origin cannot read a
cookied response even if it can trigger one.

## Content Security Policy / security headers

- API: `helmet()` in `backend/api/src/main.ts` — near-empty CSP (`'none'`
  default), HSTS in production, standard security headers.
- Both web apps: a hand-written CSP plus `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  and a `Permissions-Policy` (camera allowed only on the partner PWA, for
  evidence-photo capture; denied everywhere else) — see each app's
  `next.config.ts`.

## Rate limiting

Two layers: a global `ThrottlerGuard` (`backend/api/src/app.module.ts`,
`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX` from env) as defense-in-depth on
every route, plus a narrower purpose-built limiter on the OTP request
endpoint (per-IP counter in Redis, `otp:count:ip:*`) and internal login
(`backend/api/src/test/phase7.integration.test.ts`'s "rate-limits repeated
internal login attempts" test proves the 429 path for real).

## TLS-ready configuration

`app.set("trust proxy", 1)` in `main.ts` — every process assumes it runs
behind a TLS-terminating reverse proxy; see
[DEPLOYMENT.md](./DEPLOYMENT.md)'s "TLS and reverse proxy" section for the
exact required proxy configuration (`X-Forwarded-For`/`X-Forwarded-Proto`).

## Secret management

`backend/config/src/env.schema.ts`'s `loadEnv()` refuses to boot in
`NODE_ENV=production` with a known development `SESSION_SECRET`/
`OTP_HASH_PEPPER`, `SMS_PROVIDER=dev`, or `ANTIVIRUS_PROVIDER=dev` — a real,
fail-closed check, not a lint rule. Secrets are read from environment
variables only; none are committed (`.env` is gitignored; `.env.example`/
`.env.staging.example` contain placeholders only). See "Secret scan" below
for the CI-side complement to this.

## PII redaction

`backend/observability/src/logger.ts`'s pino logger redacts `mobile`,
`mobileNumber`, `phone`, `phoneNumber`, `email`, `nationalCode`,
`nationalId`, plus `Authorization`/`Cookie`/`Set-Cookie` headers, on every
log line — structural, not per-call-site opt-in. Separately (a narrower
but real guarantee), no report dataset in `backend/database/src/reports`
selects contact info or internal notes at all — see
[IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)'s Phase 6 section
for why that's a different, stronger property than field-level masking.

## File MIME/magic-byte validation, size/count limits, malware scan, quarantine

All in `backend/api/src/files/files.service.ts`:
- `sniffMimeType` (magic-byte sniffing, not trusting the client's declared
  `Content-Type`) rejects anything it doesn't recognize.
- `MAX_UPLOAD_SIZE_MB` and `MAX_FILES_PER_CHANNEL` (env-configured) are
  enforced before any write.
- Every upload is scanned (`AntivirusScanner` interface — a dev fake that
  always reports clean, and a `live` provider for production, gated the
  same way `SMS_PROVIDER` is).
- An infected file is written to a **separate `quarantine/` storage-key
  prefix**, never the `uploads/` prefix `getSignedDownloadUrl` serves —
  download is blocked at the service layer regardless
  (`getWithDownloadUrl` throws `ForbiddenException` for any
  `scanStatus !== "CLEAN"`), and both the block and the original upload are
  audit-logged. Verified end-to-end by
  `phase7.integration.test.ts`'s "quarantines an infected file" test.

## Signed short-lived file URLs

`StorageService.getSignedDownloadUrl`
([backend/api/src/files/storage.service.ts](../api/src/files/storage.service.ts))
— time-limited (`STORAGE_SIGNED_URL_TTL_SECONDS`, default 300s) presigned
S3/MinIO URLs; there is no permanently-public file URL anywhere.

## Dependency scan

`.github/workflows/ci.yml` runs `pnpm audit --audit-level=high --prod` as
a **hard gate** (job fails on any high/critical finding in a production
dependency) plus a second, informational-only `pnpm audit --audit-level=high`
covering dev tooling. Current status (this session):
- **Production dependencies: clean.** `sharp`/`postcss` (both nested
  inside Next.js's own dependency tree, not our direct deps) had
  known-high advisories; fixed via `pnpm.overrides` in the root
  `package.json` (`postcss >=8.5.18`, `sharp >=0.35.0`) — verified with a
  clean rebuild of both Next.js apps afterward.
- **One accepted dev-tooling-only finding:** `brace-expansion` inside
  ESLint 9's own `minimatch@3` dependency chain. The advisory's only
  patched line is a new major version (`brace-expansion@5.x`) that
  `minimatch@3` was never written against (`minimatch@3.1.5` depends on
  `^1.1.7`) — forcing that override risks breaking ESLint's own glob
  resolution for a vulnerability that only affects a DoS (memory
  exhaustion) in a build-time lint tool, never reachable by an external
  attacker of the deployed app. Tracked, not silently ignored: it's the
  one high-severity finding this repo currently ships with, and it's
  scoped to devDependencies only (confirmed via `pnpm audit --prod`
  showing zero findings).

## Secret scan

`.github/workflows/ci.yml` runs `gitleaks/gitleaks-action@v2` on every push
and PR, against full git history (`fetch-depth: 0` on checkout — a shallow
clone would only ever scan the single checked-out commit). Note for future
maintainers: gitleaks-action v2 requires a `GITLEAKS_LICENSE` secret only
if this repository is ever transferred to a GitHub Organization; it runs
license-free on personal-account repositories, public or private.

## Audit

`AuditLogService` (`backend/api/src/audit`) records every sensitive action
across every phase — file uploads/quarantine, financial approvals,
settlement decisions, ticket internal notes, report exports — with actor,
action, entity, metadata, and IP. Queryable at `/audit` in admin-web.

## Backup / restore

See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) — scripts plus a real drill
already executed and verified against this database this session (exact
row-count and content parity between source and restored databases).

## Step-up authentication

`StepUpGuard`/`@RequireStepUp()`
([backend/api/src/auth/step-up.guard.ts](../api/src/auth/step-up.guard.ts))
gates sensitive financial actions — settlement decisions
(`settlements.controller.ts`), price approval
(`support-request-ops.controller.ts`) — behind a fresh TOTP re-verification
(`POST /auth/internal/step-up`), independent of how long ago the session
itself was established. `phase7.integration.test.ts` proves both: the
guard returns `403 STEP_UP_REQUIRED` before a fresh step-up, and the same
action passes the guard (reaching the real handler) immediately after one.

**`FEATURE_SKIP_ADMIN_MFA_IN_DEV`** (`InternalAuthService.login`,
[backend/api/src/auth/internal-auth.service.ts](../api/src/auth/internal-auth.service.ts))
is a local-convenience escape hatch, added on request, that skips the TOTP
step after a correct email/password login — for a developer clicking
through the admin UI locally without an authenticator app handy. Not a
weakening of the control itself: refused at boot if `NODE_ENV=production`
(`assertNotDevelopmentSecret`, same mechanism as `SMS_PROVIDER=dev`/
`ANTIVIRUS_PROVIDER=dev`), and forced back to `false` in every test run
regardless of `.env` (`backend/api/vitest.setup.ts`) — every integration
test's own admin-login setup drives a real MFA verification, so this can
never silently degrade test coverage. Defaults to `false` in
`.env.example`/`.env.staging.example`; only this developer's local `.env`
sets it to `true`. Note this does **not** touch `StepUpGuard` above — the
step-up re-verification for financial actions still requires a real TOTP
code even with this flag on, since step-up matters most precisely when a
session could otherwise be used without limit.

## Dual approval

`FinancialApprovalService.decide`
([backend/api/src/ledger/financial-approval.service.ts](../api/src/ledger/financial-approval.service.ts))
rejects a decision where `decidedById === requestedById` — the second
approver must be a genuinely different user, for any ledger adjustment at
or above `HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL`. The same "second, distinct
approver" pattern also gates high-value promotion pricing (Phase 3) and
settlement completion (Phase 5) — see each phase's integration test for
the specific threshold proof.

## Incident notes

Realized as `TicketInternalNote` (Phase 6) — a table structurally separate
from partner-visible `TicketMessage` (not a visibility flag on one shared
table), so an internal incident note can never leak into any
partner-facing ticket API/export/notification by construction. See
`phase6.integration.test.ts`'s leak-proof test, which asserts the literal
secret text is absent from the partner endpoint's entire serialized JSON
body.

## Known gaps

- **Load testing is a documented script, not a continuously-run gate** —
  see [LOAD_TEST.md](./LOAD_TEST.md). Nothing in CI runs it automatically;
  it's meant to be run against a staging environment before a release.
- **No automated penetration test** — this document is a code-level control
  review, not a black-box pentest. Recommended before the first real
  production launch, not before every release.
- **brace-expansion**, described above under "Dependency scan" — accepted,
  monitored, dev-tooling-only.

# Implementation Plan

Full requirements: [Hatef-Full-Stack-Software-Generation-Prompt.md](./Hatef-Full-Stack-Software-Generation-Prompt.md).
Current status: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).

Each phase is a vertical slice (schema → migration → API → domain logic →
admin UI → partner UI → permissions → audit → tests → docs), gated by:
migration runs, lint passes, typecheck passes, relevant tests pass,
production build passes, `IMPLEMENTATION_STATUS.md` updated.

## Phase 0 — Repository Audit and Real Foundation
Monorepo (pnpm + Turborepo), Docker Compose (Postgres/Redis/MinIO), shared
packages (`config`, `database`, `ui`, `domain`, `contracts`, `auth`,
`observability`, `localization`, `testing`), NestJS API skeleton with
health/readiness, two Next.js app skeletons (RTL, real API call, no static
dashboard), worker skeleton with a real outbox relay/processor, CI.
**Exit proof:** all apps build; docker infra starts; first migration runs;
both workspaces load from real (non-fake) applications.

## Phase 1 — Authentication, Authorization, Profiles, and Files
Partner OTP (dev SMS provider + prod adapter interface), internal
email/password + TOTP MFA, sessions, RBAC + resource-scoped ABAC, channels +
memberships, workspace selector, secure file upload (MinIO/S3), audit log.
**Exit proof:** real login, real DB-backed session, channel-scoped
permissions enforced server-side, uploaded file metadata persists,
cross-channel access denied in an E2E test.

## Phase 2 — Form Engine, 28-Question Onboarding, and Evaluation
Configurable form builder (pages/sections/fields/conditional logic,
draft/publish/version), the 28-question onboarding form built *through* that
engine (not hard-coded), autosave, submission + immutable revisions,
evaluation case workflow (queue, assignment, rubric, correction requests,
decision), 360° channel profile foundation.
**Exit proof:** full mobile onboarding E2E, reload persistence, correction →
resubmission → revision diff, form version changes never alter historical
submissions.

## Phase 3 — Support Requests, Pricing, Quotes, and Admin Operations
Promotion types, first-position pin request (nationwide 240 rial/view,
provincial 480 rial/view — backend-authoritative, price-snapshotted),
variable multi-channel promotion quote workflow, request state machine,
operational queues/Kanban, partner progress view.
**Exit proof:** backend 240/480-rial calculations verified by tests, quote
negotiation works, price history preserved, no static counters anywhere.

## Phase 4 — Tasks, Jalali Calendar, Gantt, Scheduling, and Execution
Internal task management (states, dependencies, checklists), Jalali
(Solar Hijri) calendar backed by the same persisted events, Gantt view on
the same tasks/dates, promotion scheduling + conflict detection + execution
evidence + realized value.
**Exit proof:** task persists; calendar and Gantt render the same backing
data; a valid drag-reschedule updates the backend; an invalid one is
rejected; partner sees the new schedule.

## Phase 5 — Ledger, Barter, Obligations, Deliverables, and Settlement
Immutable double-entry ledger, reciprocal service catalog, obligation
workflow (propose → negotiate → accept → deliver → review → settle),
partial acceptance/allocation, dispute + reversal, versioned channel rate
cards.
**Exit proof:** ledger-balance invariant tests pass; retried postings never
duplicate value; partial settlement works; a plain-language statement
reconciles against the ledger; no editable balance field exists anywhere.

## Phase 6 — Tickets, Notifications, Surveys, Reports, and Analytics
Ticketing (internal notes never leak to partner APIs/exports/notifications),
in-app + SMS notifications with retry/dedup, survey authoring reusing the
form engine, report builder over approved semantic datasets, exports with
audit.
**Exit proof:** internal-note leak test passes; notification retry works;
reports and survey analytics run against real submissions; exports respect
permissions.

## Phase 7 — Mobile PWA, Security Hardening, Performance, and Release
Installable partner PWA, accessibility pass, performance pass, security
review (OWASP-aligned controls, dependency/secret scanning), backup/restore
drill, staging config, deployment guide, release checklist.
**Exit proof:** all critical E2E tests pass; production build passes; backup
restore is documented and tested; no unresolved critical/high security
finding; product is deployable.

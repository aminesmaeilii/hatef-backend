# AGENTS.md — Hatef Platform

**This file lives at `backend/AGENTS.md`, not the repository root.** Every
whole-system doc (this file, `IMPLEMENTATION_PLAN.md`,
`IMPLEMENTATION_STATUS.md`, the full product spec, `docs/`, `infra/`) was
moved under `backend/` in the same pass that grouped the rest of the repo
into `backend/`/`frontend/` — see "Layout" below and
`IMPLEMENTATION_STATUS.md`'s own note on this for the reasoning (none of
these are backend-specific in content; `backend/` was just the more
consistent home for repo-wide meta docs than splitting them, since nothing
here is frontend-only). If you're an agent/tool that only checks the
repository root for an orientation file, look one level down first.

This file orients anyone (human or agent) picking this repository up cold.
Read [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) first — it says
exactly what is done, what is next, and what commands were last run.

## What this is

A modular-monolith monorepo implementing the Hatef channel-support and
service-barter platform described in
[Hatef-Full-Stack-Software-Generation-Prompt.md](./Hatef-Full-Stack-Software-Generation-Prompt.md).
That file is the full product/architecture specification and the source of
truth for requirements — this file only covers how the repo is organized and
how to work in it.

## Layout

Grouped into `backend/` and `frontend/` (not the `apps/`+`packages/` split you
may see referenced in older docs/commit messages — the repo was
reorganized into this backend/frontend grouping after Phase 7; see
IMPLEMENTATION_STATUS.md's Phase 7 section for the exact old→new path
mapping if you're cross-referencing something written before that):

```
backend/
  api/            NestJS 11 — the one backend API, versioned under /api/v1
  worker/         Plain Node + BullMQ — outbox relay, queues, background jobs
  e2e/            Playwright end-to-end specs (drives both frontend apps + the API)
  domain/         Framework-free domain rules: phone/Eitaa-id normalization, money, state machines
  contracts/      Zod schemas shared between the API and both frontend apps
  database/       Prisma schema, migrations, seed (the only place schema.prisma lives)
  auth/           Password hashing, RBAC/ABAC permission checker
  config/         Zod-validated environment loading (backend/config/src/env.schema.ts)
  observability/  Structured logger (pino) + correlation-id propagation
  localization/   Persian digit handling, Jalali (Solar Hijri) date conversion
  testing/        Shared test fixtures/helpers
  docs/           Architecture notes, runbooks, requirements traceability
  infra/          Deployment/infra-as-code, backup/restore + load-test scripts
  docker-compose.yml   Local Postgres/Redis/MinIO (run from backend/: `cd backend && docker compose up`)
  tsconfig.base.json   Shared compilerOptions every backend package's tsconfig.json extends
                       (frontend/ui also extends it, across the folder boundary — see below)
frontend/
  admin-web/      Next.js 16 App Router — Hatef internal administration workspace
  partner-web/    Next.js 16 App Router — channel partner workspace / PWA
  ui/             Shared RTL design system (Tailwind v4 tokens + React components)
```

Stays at the true repository root (see "Layout" reasoning above — these
either have a hard tool/platform requirement to be there, like `.github/`
and the root `package.json`/`pnpm-workspace.yaml`/`pnpm-lock.yaml`/
`turbo.json`, or are resolved by implicit ancestor-directory search that
both `backend/*` and `frontend/*` packages need to hit identically, like
`eslint.config.mjs`/`.prettierrc.json`/`.nvmrc`/`.env`/`.gitignore`):
`.git/`, `.github/`, `package.json`, `pnpm-workspace.yaml`,
`pnpm-lock.yaml`, `turbo.json`, `eslint.config.mjs`, `.prettierrc.json`,
`.env`/`.env.example`/`.env.staging.example`, `.gitignore`, `.nvmrc`.

`domain`, `contracts`, and `localization` live under `backend/` even though
both frontend apps also depend on them (see each app's own `package.json`)
— they're genuinely shared, and pnpm's `workspace:*` protocol resolves
packages by name via `pnpm-workspace.yaml`'s globs, not by physical
directory nesting, so their location doesn't affect how either frontend
app imports them. `ui` is the one package that's frontend-only (`backend/api`
and `backend/worker` never import it), hence it lives under `frontend/`.

## Module system

Everything is **CommonJS** — `tsconfig.base.json` sets
`module: CommonJS` / `moduleResolution: Node`, and no package sets
`"type": "module"`. This was a deliberate choice: NestJS's default tooling
(`nest build`/`nest start`) and BullMQ assume CJS, and mixing ESM workspace
packages with a CJS Nest app causes `ERR_REQUIRE_ESM` failures. Next.js apps
consume the same CJS packages fine — its bundler doesn't care. **Do not** add
`"type": "module"` to any package or reintroduce `.js`-suffixed relative
imports; both will break the build.

`frontend/admin-web` and `frontend/partner-web` have their own standalone
`tsconfig.json` (Next.js requires `moduleResolution: bundler`) that does not
extend `tsconfig.base.json` — this is intentional, not an oversight.

## Dependency versions

Package majors were chosen deliberately, not defaulted to "latest", because
several ecosystem tools jumped major versions recently and the safer/more
predictable line was picked where the newest major introduced high-risk
unknowns:

- **Prisma pinned to 6.19.3**, not 7.x — Prisma 7 changes config/generator
  conventions significantly; 6.x is the last line with the classic
  `schema.prisma`-only setup.
- **TypeScript 5.9.3**, not the new 7.x native (Go-ported) compiler — 5.x is
  what every other tool in this stack (`ts-node`/`tsx`, `@typescript-eslint`,
  vitest) is best-tested against.
- **ESLint 9.39.5** (flat config, `eslint.config.mjs` at repo root), not
  10.x.
- Everything else (Next 16, React 19, Tailwind v4, NestJS 11, Zod v4, vitest
  v4, bullmq) is pinned to current-latest at scaffold time.

If you bump any of these, re-verify `pnpm build && pnpm lint && pnpm
typecheck && pnpm test` across the whole workspace before committing — don't
assume API compatibility with what's written here.

### Next.js apps use `--webpack`, not Turbopack

Both `admin-web` and `partner-web` pass `--webpack` explicitly to `next dev`
and `next build` (see their `package.json` scripts). Turbopack (Next 16's
default bundler) panics in this environment on *any* CSS file that goes
through `@tailwindcss/postcss` — verified by reducing `globals.css` down to
a bare `@import "tailwindcss";` and still hitting
`TurbopackInternalError: Failed to write app endpoint /page` →
`evaluate_webpack_loader failed` → `creating new process` → `node process
exited before we could connect to it with exit code: 0`. This reproduces
with zero application code involved, so it isn't something in our CSS/JS —
it's Turbopack's PostCSS-loader subprocess failing to start, most likely
because the repo path contains a space (`hatef-new version`). Webpack builds
the exact same app cleanly. If this repo is ever moved to a space-free path,
it's worth retrying Turbopack (drop `--webpack`) since it's meaningfully
faster — but don't drop it speculatively without re-testing.

### `@hatef/ui` classes need an explicit `@source` in every consuming app

Tailwind v4's automatic content scanner only walks each app's own directory
tree; it does not follow the `node_modules` symlink into sibling workspace
packages. `@hatef/ui`'s components live in `frontend/ui/src`, so any utility
class used *only* inside a `@hatef/ui` component (not also written literally
somewhere in the app's own source) gets silently purged from the compiled
CSS — the class still ends up in the HTML, it just has no matching rule, so
the element renders unstyled with no build error. This bit `Badge`'s
non-default tones and `Button`'s variants on first build (only `Card`'s
classes survived, because `Card` happened to share a couple of class names
with `admin-web`'s own `page.tsx`). Both `frontend/admin-web/src/app/globals.css`
and `frontend/partner-web/src/app/globals.css` now declare
`@source "../../node_modules/@hatef/ui/src";` to fix this. Any new app that
consumes `@hatef/ui` needs the same line, and if `@hatef/ui`'s classes ever
seem to "not apply," check this before anything else.

## Environment

Root `.env` (gitignored; copy from `.env.example`) is the single source of
env vars for the whole monorepo. Every app/package script that needs it is
wrapped with `dotenv-cli` (`dotenv -e ../../.env -- <command>`) because
Next.js/Nest/tsx only auto-load `.env` from their own working directory, not
the monorepo root. If you add a new script that touches `process.env`, wrap
it the same way.

`@hatef/config`'s `loadEnv()` refuses to start in `NODE_ENV=production` with
known development secrets (default `SESSION_SECRET`/`OTP_HASH_PEPPER`, or
`SMS_PROVIDER=dev`) — see `backend/config/src/env.schema.ts`.

## Working conventions

- Each phase in the product spec (section 26) is a vertical slice: schema →
  migration → API → domain logic → admin UI → partner UI → permissions →
  audit → tests → docs. Don't build all screens before any backend, and
  don't build backend without the UI that proves it end-to-end.
- Money is always `bigint` Rial (`@hatef/domain`'s `RialAmount`), never
  `number`, never float. See `backend/domain/src/money.ts`.
- Every workflow (assessment, support request, obligation, ticket, task) is
  a `StateMachine` instance (`@hatef/domain`) with an explicit transition
  table — don't hand-roll status checks with if/else chains.
- Business data never lives only in browser state/localStorage — see
  section 1 of the product spec for the hard rule.
- Update `IMPLEMENTATION_STATUS.md` at the end of every phase (or every
  session, if a phase spans more than one) before stopping.

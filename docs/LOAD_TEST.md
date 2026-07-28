# Load Test

## Script

`infra/load-test/run.sh [target-url] [duration-seconds] [connections]` —
uses [autocannon](https://github.com/mcollina/autocannon) (via `npx`, not a
project dependency — an ops tool run on demand) against
`/api/v1/health/ready` by default, the one unauthenticated endpoint that
still exercises the full real dependency chain (Postgres + Redis
connectivity — see `backend/api/src/health/health.controller.ts`).

```bash
./infra/load-test/run.sh                                          # local default: 30s, 20 connections
./infra/load-test/run.sh https://api-staging.<domain>/api/v1/health/ready 60 50   # against staging
```

## Baseline result (this session, local dev machine)

20s, 20 concurrent connections, against a locally-running
`backend/api` (built, not `dev` mode) with the real Postgres/Redis from
`docker-compose.yml`:

| Metric | Value |
|---|---|
| Requests | 18,119 in 20.05s |
| Throughput | ~906 req/s average |
| Latency p50 | 20 ms |
| Latency p97.5 | 33 ms |
| Latency p99 | 37 ms |
| Latency max | 104 ms |
| Errors | 0 (18,119 / 18,119 returned `200`) |

This is a single-instance, single-machine baseline, not a production
capacity number — treat it as a regression signal (a future run coming in
significantly slower or with non-`200` responses is the thing to
investigate), not an absolute SLA.

## Extending this to authenticated/write endpoints

The script above deliberately stays unauthenticated to keep it a
zero-setup smoke test. A deeper load test against session-authenticated
endpoints (ticket creation, form submission, promotion requests) needs a
per-connection login step autocannon's plain CLI mode doesn't do — use its
[`requests` array with `setupRequest`
hook](https://github.com/mcollina/autocannon#autocannonopts-cb) to log in
once and attach the resulting session cookie + `X-CSRF-Token` header to
every subsequent request, or drive it through a small Node script using
autocannon's programmatic API. Not built out this session — the priority
was proving the harness and the one dependency-chain-exercising endpoint
work end-to-end; add specific authenticated scenarios as real performance
questions come up (e.g. before a marketing push expected to spike
onboarding traffic, load-test `POST /onboarding/start` +
`PATCH .../answers` specifically).

## When to run this

- Before a production release, against staging (not local dev) — see
  [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).
- After any change to hot-path middleware (auth guards, the global
  `ThrottlerGuard`, database connection pooling) to catch a regression
  before it reaches production.

Not currently run automatically in CI — CI's own runner is a shared,
noisy-neighbor environment, and a flaky latency assertion there would cost
more false-positive investigation time than it'd catch real regressions.

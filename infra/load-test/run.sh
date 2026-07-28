#!/usr/bin/env bash
# A load test against the API's readiness endpoint — the one endpoint that
# genuinely exercises the full dependency chain (Postgres + Redis
# connectivity, see apps/api/src/health/health.controller.ts) under
# concurrent load, without needing an authenticated session. Uses
# autocannon (via npx — not a project dependency; this is an ops tool run
# on demand, not part of any app's own build) rather than adding a new
# workspace package, since infra/ isn't part of pnpm-workspace.yaml.
#
# Usage:
#   ./infra/load-test/run.sh [target-url] [duration-seconds] [connections]
#
# Defaults to http://localhost:4000/health/ready, 30s, 20 connections —
# override for a real capacity test against staging, e.g.:
#   ./infra/load-test/run.sh https://api-staging.<domain>/api/v1/health/ready 60 50
set -euo pipefail

TARGET_URL="${1:-http://localhost:4000/health/ready}"
DURATION="${2:-30}"
CONNECTIONS="${3:-20}"

echo "==> Load testing $TARGET_URL (${DURATION}s, ${CONNECTIONS} connections)"
npx --yes autocannon --duration "$DURATION" --connections "$CONNECTIONS" --renderStatusCodes "$TARGET_URL"

echo ""
echo "==> See docs/LOAD_TEST.md for how to read these numbers and the"
echo "    thresholds to check against before signing off a release."

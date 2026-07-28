import path from "node:path";
import { defineConfig } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const PARTNER_WEB_URL = process.env.PARTNER_WEB_URL ?? "http://localhost:3001";
const PARTNER_WEB_PORT = new URL(PARTNER_WEB_URL).port || "3001";
const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL ?? "http://localhost:3000";
const ADMIN_WEB_PORT = new URL(ADMIN_WEB_URL).port || "3000";
const REPO_ROOT = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  // All spec files share one already-running api/admin-web/partner-web
  // instance (see webServer below) rather than per-worker isolated
  // servers, so several worker processes driving full Chromium sessions
  // against it concurrently causes real contention — verified locally: 4
  // workers intermittently times out waiting for post-OTP UI to render
  // (not a rate limit — Redis's otp:count:ip counter stayed in single
  // digits — just slow responses under load), while 1 worker passes
  // every spec reliably. Worth revisiting if per-worker server instances
  // (separate ports/DBs) are ever set up.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: PARTNER_WEB_URL,
    trace: "retain-on-failure",
  },
  // Assumes `pnpm build` already ran (see IMPLEMENTATION_STATUS.md verification
  // steps) — runs the built artifacts via `start`, not `dev`, so this doesn't
  // recompile on every run.
  webServer: [
    {
      // ADMIN_WEB_URL is passed through so the API's CORS allowlist matches
      // whichever port admin-web actually starts on (see IMPLEMENTATION_STATUS.md's
      // Windows port-exclusion note) — without it, admin-web specs would 403 on every request.
      command: "pnpm --filter @hatef/api start",
      url: `${API_URL}/health`,
      cwd: REPO_ROOT,
      env: { ADMIN_WEB_URL, PARTNER_WEB_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Invokes Next directly (rather than the fixed-port "start" script) so
      // PARTNER_WEB_URL alone controls the port — needed on machines where
      // the default 3001 falls in a transient Windows/Hyper-V dynamic port
      // exclusion range (see IMPLEMENTATION_STATUS.md).
      command: `pnpm --filter @hatef/partner-web exec next start --port ${PARTNER_WEB_PORT}`,
      url: PARTNER_WEB_URL,
      cwd: REPO_ROOT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @hatef/admin-web exec next start --port ${ADMIN_WEB_PORT}`,
      url: ADMIN_WEB_URL,
      cwd: REPO_ROOT,
      env: { API_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});

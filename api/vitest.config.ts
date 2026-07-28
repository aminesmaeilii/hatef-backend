import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // These are real integration tests (full Nest app boot + live Postgres +
    // bcrypt/TOTP), not fast unit tests. The default 5000ms is already
    // marginal with 5 phase suites; Phase 6 added a 6th, pushing total
    // concurrent DB/CPU load past it for the heavier multi-step tests.
    testTimeout: 30000,
  },
});

import path from "node:path";
import { config } from "dotenv";

// CI sets these as real job-level env vars already; only a local dev running
// `pnpm test` without having exported them needs the root .env loaded here.
if (!process.env.DATABASE_URL) {
  config({ path: path.resolve(__dirname, "../../.env") });
}

// Forced regardless of what a developer's local .env has set for their own
// interactive `pnpm dev` convenience — every integration test's own
// admin-login setup drives a real MFA verification (login -> mfa/verify),
// and would break in a confusing way (mfaToken undefined) if this leaked
// in from .env, rather than the loud, obvious failure it'd otherwise be.
process.env.FEATURE_SKIP_ADMIN_MFA_IN_DEV = "false";

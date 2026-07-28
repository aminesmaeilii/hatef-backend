import path from "node:path";
import { config } from "dotenv";

// CI sets these as real job-level env vars already; only a local dev running
// `pnpm test` without having exported them needs the root .env loaded here.
if (!process.env.DATABASE_URL) {
  config({ path: path.resolve(__dirname, "../../.env") });
}

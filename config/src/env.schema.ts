import { z } from "zod";

type EnvSource = NodeJS.ProcessEnv;

function booleanFromString(defaultValue: "true" | "false") {
  return z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");
}

function normalizeEnv(source: EnvSource): EnvSource {
  const normalized: EnvSource = { ...source };

  if (!normalized.REDIS_URL && normalized.REDIS_HOST) {
    const port = normalized.REDIS_PORT || "6379";
    const password = normalized.REDIS_PASSWORD ? `:${encodeURIComponent(normalized.REDIS_PASSWORD)}@` : "";
    normalized.REDIS_URL = `redis://${password}${normalized.REDIS_HOST}:${port}`;
  }

  if (!normalized.API_PORT && normalized.PORT) {
    normalized.API_PORT = normalized.PORT;
  }

  if (!normalized.WORKER_PORT && normalized.PORT) {
    normalized.WORKER_PORT = normalized.PORT;
  }

  if (!normalized.PARTNER_WEB_URL && normalized.ADMIN_WEB_URL) {
    normalized.PARTNER_WEB_URL = normalized.ADMIN_WEB_URL;
  }

  if (!normalized.STORAGE_ENDPOINT && normalized.STORAGE_API_ENDPOINT) {
    const endpoint = normalized.STORAGE_API_ENDPOINT;
    normalized.STORAGE_ENDPOINT = /^https?:\/\//.test(endpoint) ? endpoint : `https://${endpoint}`;
  }

  if (!normalized.STORAGE_PROVIDER && normalized.STORAGE_API_ENDPOINT) {
    normalized.STORAGE_PROVIDER = "s3";
  }

  if (!normalized.STORAGE_REGION && normalized.STORAGE_API_ENDPOINT) {
    normalized.STORAGE_REGION = "default";
  }

  if (!normalized.STORAGE_FORCE_PATH_STYLE && normalized.STORAGE_API_ENDPOINT) {
    normalized.STORAGE_FORCE_PATH_STYLE = "true";
  }

  return normalized;
}

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("Asia/Tehran"),

  API_PORT: z.coerce.number().int().positive().default(4000),
  ADMIN_WEB_PORT: z.coerce.number().int().positive().default(3000),
  PARTNER_WEB_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_PORT: z.coerce.number().int().positive().default(4100),

  API_URL: z.url(),
  ADMIN_WEB_URL: z.url(),
  PARTNER_WEB_URL: z.url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  STORAGE_PROVIDER: z.enum(["minio", "s3"]).default("minio"),
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_FORCE_PATH_STYLE: booleanFromString("true"),
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_COOKIE_NAME: z.string().default("hatef_session"),
  ADMIN_LOGIN_CODE: z.string().min(4).default("dev-admin-code"),
  OTP_HASH_PEPPER: z.string().min(8),
  OTP_EXPIRY_SECONDS: z.coerce.number().int().positive().default(120),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  MFA_ISSUER: z.string().default("Hatef"),

  SMS_PROVIDER: z.enum(["dev", "live"]).default("dev"),
  // MeliPayamak webservice credentials. SMS_PROVIDER_API_KEY is used in place
  // of the panel password when the account requires API-key authentication.
  SMS_PROVIDER_API_KEY: z.string().optional().default(""),
  SMS_PROVIDER_USERNAME: z.string().optional().default(""),
  SMS_PROVIDER_PASSWORD: z.string().optional().default(""),
  SMS_PROVIDER_SENDER: z.string().optional().default(""),
  // MeliPayamak BaseServiceNumber/bodyId used for the OTP-login pattern.
  SMS_TEMPLATE_OTP_ID: z.string().optional().default(""),

  ANTIVIRUS_PROVIDER: z.enum(["dev", "live"]).default("dev"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(25),
  MAX_FILES_PER_CHANNEL: z.coerce.number().int().positive().default(500),

  FEATURE_SMS_PROVIDER_LIVE: booleanFromString("false"),
  FEATURE_WEB_PUSH: booleanFromString("false"),
  FEATURE_SURVEYS: booleanFromString("true"),
  // Local convenience only — skips the TOTP/MFA step after a correct
  // internal email/password login. Guarded twice: refused in production
  // (see assertNotDevelopmentSecret below) and forced back to "false" in
  // every test run regardless of .env (see vitest.setup.ts) — every
  // integration test's own admin-login setup drives a real MFA
  // verification and would break silently if this leaked into test runs.
  FEATURE_SKIP_ADMIN_MFA_IN_DEV: booleanFromString("false"),

  WEB_PUSH_PUBLIC_KEY: z.string().optional().default(""),
  WEB_PUSH_PRIVATE_KEY: z.string().optional().default(""),
  WEB_PUSH_CONTACT_EMAIL: z.string().optional().default(""),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

export type Env = z.infer<typeof envSchema>;

const KNOWN_DEV_SECRETS = [
  "dev_only_session_secret_change_me_please_1234567890",
  "dev_only_otp_pepper_change_me_please",
];

/**
 * Parses and validates process.env, then applies production-only hard
 * guarantees that cannot be expressed as pure schema rules (cross-field
 * checks against NODE_ENV).
 */
export function loadEnv(source: EnvSource = process.env): Env {
  const parsed = envSchema.safeParse(normalizeEnv(source));

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production") {
    assertNotDevelopmentSecret(env);
  }

  return env;
}

function assertNotDevelopmentSecret(env: Env): void {
  const offenders: string[] = [];

  if (KNOWN_DEV_SECRETS.includes(env.SESSION_SECRET)) {
    offenders.push("SESSION_SECRET");
  }
  if (KNOWN_DEV_SECRETS.includes(env.OTP_HASH_PEPPER)) {
    offenders.push("OTP_HASH_PEPPER");
  }
  if (env.ADMIN_LOGIN_CODE === "dev-admin-code") {
    offenders.push("ADMIN_LOGIN_CODE");
  }
  if (env.SMS_PROVIDER === "dev" && env.FEATURE_SMS_PROVIDER_LIVE === false) {
    offenders.push("SMS_PROVIDER=dev is not allowed in production");
  }
  if (env.ANTIVIRUS_PROVIDER === "dev") {
    offenders.push("ANTIVIRUS_PROVIDER=dev is not allowed in production");
  }
  if (env.FEATURE_SKIP_ADMIN_MFA_IN_DEV) {
    offenders.push("FEATURE_SKIP_ADMIN_MFA_IN_DEV=true is not allowed in production");
  }

  if (offenders.length > 0) {
    throw new Error(
      `Refusing to start in production with development configuration: ${offenders.join(", ")}`,
    );
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.loadEnv = loadEnv;
const zod_1 = require("zod");
function booleanFromString(defaultValue) {
    return zod_1.z
        .enum(["true", "false"])
        .default(defaultValue)
        .transform((value) => value === "true");
}
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    APP_TIMEZONE: zod_1.z.string().default("Asia/Tehran"),
    API_PORT: zod_1.z.coerce.number().int().positive().default(4000),
    ADMIN_WEB_PORT: zod_1.z.coerce.number().int().positive().default(3000),
    PARTNER_WEB_PORT: zod_1.z.coerce.number().int().positive().default(3001),
    WORKER_PORT: zod_1.z.coerce.number().int().positive().default(4100),
    API_URL: zod_1.z.url(),
    ADMIN_WEB_URL: zod_1.z.url(),
    PARTNER_WEB_URL: zod_1.z.url(),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    REDIS_URL: zod_1.z.string().min(1, "REDIS_URL is required"),
    STORAGE_PROVIDER: zod_1.z.enum(["minio", "s3"]).default("minio"),
    STORAGE_ENDPOINT: zod_1.z.string().min(1),
    STORAGE_REGION: zod_1.z.string().min(1),
    STORAGE_ACCESS_KEY_ID: zod_1.z.string().min(1),
    STORAGE_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    STORAGE_BUCKET: zod_1.z.string().min(1),
    STORAGE_FORCE_PATH_STYLE: booleanFromString("true"),
    STORAGE_SIGNED_URL_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(300),
    SESSION_SECRET: zod_1.z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
    SESSION_COOKIE_NAME: zod_1.z.string().default("hatef_session"),
    OTP_HASH_PEPPER: zod_1.z.string().min(8),
    OTP_EXPIRY_SECONDS: zod_1.z.coerce.number().int().positive().default(120),
    OTP_RESEND_COOLDOWN_SECONDS: zod_1.z.coerce.number().int().positive().default(60),
    OTP_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(5),
    MFA_ISSUER: zod_1.z.string().default("Hatef"),
    SMS_PROVIDER: zod_1.z.enum(["dev", "live"]).default("dev"),
    // MeliPayamak webservice credentials. SMS_PROVIDER_API_KEY is used in place
    // of the panel password when the account requires API-key authentication.
    SMS_PROVIDER_API_KEY: zod_1.z.string().optional().default(""),
    SMS_PROVIDER_USERNAME: zod_1.z.string().optional().default(""),
    SMS_PROVIDER_PASSWORD: zod_1.z.string().optional().default(""),
    SMS_PROVIDER_SENDER: zod_1.z.string().optional().default(""),
    SMS_TEMPLATE_OTP_ID: zod_1.z.string().optional().default(""),
    ANTIVIRUS_PROVIDER: zod_1.z.enum(["dev", "live"]).default("dev"),
    MAX_UPLOAD_SIZE_MB: zod_1.z.coerce.number().int().positive().default(25),
    MAX_FILES_PER_CHANNEL: zod_1.z.coerce.number().int().positive().default(500),
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
    WEB_PUSH_PUBLIC_KEY: zod_1.z.string().optional().default(""),
    WEB_PUSH_PRIVATE_KEY: zod_1.z.string().optional().default(""),
    WEB_PUSH_CONTACT_EMAIL: zod_1.z.string().optional().default(""),
    LOG_LEVEL: zod_1.z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(300),
});
const KNOWN_DEV_SECRETS = [
    "dev_only_session_secret_change_me_please_1234567890",
    "dev_only_otp_pepper_change_me_please",
];
/**
 * Parses and validates process.env, then applies production-only hard
 * guarantees that cannot be expressed as pure schema rules (cross-field
 * checks against NODE_ENV).
 */
function loadEnv(source = process.env) {
    const parsed = exports.envSchema.safeParse(source);
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
function assertNotDevelopmentSecret(env) {
    const offenders = [];
    if (KNOWN_DEV_SECRETS.includes(env.SESSION_SECRET)) {
        offenders.push("SESSION_SECRET");
    }
    if (KNOWN_DEV_SECRETS.includes(env.OTP_HASH_PEPPER)) {
        offenders.push("OTP_HASH_PEPPER");
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
        throw new Error(`Refusing to start in production with development configuration: ${offenders.join(", ")}`);
    }
}

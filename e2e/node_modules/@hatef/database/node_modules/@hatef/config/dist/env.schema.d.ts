import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    APP_TIMEZONE: z.ZodDefault<z.ZodString>;
    API_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    ADMIN_WEB_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    PARTNER_WEB_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WORKER_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    API_URL: z.ZodURL;
    ADMIN_WEB_URL: z.ZodURL;
    PARTNER_WEB_URL: z.ZodURL;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    STORAGE_PROVIDER: z.ZodDefault<z.ZodEnum<{
        minio: "minio";
        s3: "s3";
    }>>;
    STORAGE_ENDPOINT: z.ZodString;
    STORAGE_REGION: z.ZodString;
    STORAGE_ACCESS_KEY_ID: z.ZodString;
    STORAGE_SECRET_ACCESS_KEY: z.ZodString;
    STORAGE_BUCKET: z.ZodString;
    STORAGE_FORCE_PATH_STYLE: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    STORAGE_SIGNED_URL_TTL_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SESSION_SECRET: z.ZodString;
    SESSION_COOKIE_NAME: z.ZodDefault<z.ZodString>;
    OTP_HASH_PEPPER: z.ZodString;
    OTP_EXPIRY_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    OTP_RESEND_COOLDOWN_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    OTP_MAX_ATTEMPTS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    MFA_ISSUER: z.ZodDefault<z.ZodString>;
    SMS_PROVIDER: z.ZodDefault<z.ZodEnum<{
        dev: "dev";
        live: "live";
    }>>;
    SMS_PROVIDER_API_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMS_PROVIDER_USERNAME: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMS_PROVIDER_PASSWORD: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMS_PROVIDER_SENDER: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMS_TEMPLATE_OTP_ID: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    ANTIVIRUS_PROVIDER: z.ZodDefault<z.ZodEnum<{
        dev: "dev";
        live: "live";
    }>>;
    MAX_UPLOAD_SIZE_MB: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    MAX_FILES_PER_CHANNEL: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    FEATURE_SMS_PROVIDER_LIVE: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    FEATURE_WEB_PUSH: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    FEATURE_SURVEYS: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    FEATURE_SKIP_ADMIN_MFA_IN_DEV: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    WEB_PUSH_PUBLIC_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    WEB_PUSH_PRIVATE_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    WEB_PUSH_CONTACT_EMAIL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        error: "error";
        fatal: "fatal";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
    }>>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
/**
 * Parses and validates process.env, then applies production-only hard
 * guarantees that cannot be expressed as pure schema rules (cross-field
 * checks against NODE_ENV).
 */
export declare function loadEnv(source?: NodeJS.ProcessEnv): Env;
//# sourceMappingURL=env.schema.d.ts.map
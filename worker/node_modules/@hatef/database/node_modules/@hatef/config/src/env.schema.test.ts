import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.schema";

const validBaseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  API_URL: "http://localhost:4000",
  ADMIN_WEB_URL: "http://localhost:3000",
  PARTNER_WEB_URL: "http://localhost:3001",
  DATABASE_URL: "postgresql://hatef:hatef@localhost:5432/hatef",
  REDIS_URL: "redis://localhost:6379",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_REGION: "us-east-1",
  STORAGE_ACCESS_KEY_ID: "key",
  STORAGE_SECRET_ACCESS_KEY: "secret",
  STORAGE_BUCKET: "bucket",
  SESSION_SECRET: "dev_only_session_secret_change_me_please_1234567890",
  OTP_HASH_PEPPER: "dev_only_otp_pepper_change_me_please",
};

describe("loadEnv", () => {
  it("parses a valid development environment", () => {
    const env = loadEnv(validBaseEnv);
    expect(env.NODE_ENV).toBe("development");
    expect(env.API_PORT).toBe(4000);
    expect(env.SMS_PROVIDER).toBe("dev");
  });

  it("throws when a required variable is missing", () => {
    const { DATABASE_URL: _DATABASE_URL, ...rest } = validBaseEnv;
    expect(() => loadEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it("refuses to start in production with development secrets", () => {
    expect(() =>
      loadEnv({
        ...validBaseEnv,
        NODE_ENV: "production",
      }),
    ).toThrow(/Refusing to start in production/);
  });

  it("allows production when secrets are overridden and SMS/antivirus providers are live", () => {
    const env = loadEnv({
      ...validBaseEnv,
      NODE_ENV: "production",
      SESSION_SECRET: "a-real-random-production-secret-value",
      OTP_HASH_PEPPER: "a-real-random-production-pepper",
      SMS_PROVIDER: "live",
      FEATURE_SMS_PROVIDER_LIVE: "true",
      ANTIVIRUS_PROVIDER: "live",
    });
    expect(env.NODE_ENV).toBe("production");
  });

  it("refuses to start in production with the fake antivirus provider", () => {
    expect(() =>
      loadEnv({
        ...validBaseEnv,
        NODE_ENV: "production",
        SESSION_SECRET: "a-real-random-production-secret-value",
        OTP_HASH_PEPPER: "a-real-random-production-pepper",
        SMS_PROVIDER: "live",
        FEATURE_SMS_PROVIDER_LIVE: "true",
        ANTIVIRUS_PROVIDER: "dev",
      }),
    ).toThrow(/ANTIVIRUS_PROVIDER=dev is not allowed in production/);
  });
});

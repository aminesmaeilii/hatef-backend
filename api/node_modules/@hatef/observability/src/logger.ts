import pino, { type Logger, type LoggerOptions } from "pino";

// Bare field names cover a log call's own top-level properties
// (`logger.info({ mobile }, ...)`); the `*.field` form covers the far more
// common shape in this codebase, a value logged one level down under a
// wrapper key (`logger.warn({ payload: event.payload }, ...)`).
const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "otp",
  "otpCode",
  "token",
  "csrfToken",
  "accessToken",
  "refreshToken",
  "sessionSecret",
  "otpHashPepper",
  "secretEncrypted",
  // PII — spec 24 "PII redaction": never let a channel/partner's contact
  // details or national identifiers reach log storage in the clear.
  "mobile",
  "mobileNumber",
  "phone",
  "phoneNumber",
  "email",
  "nationalCode",
  "nationalId",
];

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  ...SENSITIVE_FIELDS,
  ...SENSITIVE_FIELDS.map((field) => `*.${field}`),
];

export interface CreateLoggerOptions {
  serviceName: string;
  level?: LoggerOptions["level"];
  pretty?: boolean;
}

/** `destination` is test-only — lets logger.test.ts capture output without a transport/file descriptor. */
export function createLogger(options: CreateLoggerOptions, destination?: pino.DestinationStream): Logger {
  const { serviceName, level = process.env.LOG_LEVEL ?? "info", pretty = false } = options;

  const config: LoggerOptions = {
    name: serviceName,
    level,
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },
    base: { service: serviceName },
    transport: !destination && pretty
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
  };

  return destination ? pino(config, destination) : pino(config);
}

export type { Logger };

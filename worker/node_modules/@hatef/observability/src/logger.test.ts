import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

function captureLogLine(log: (logger: ReturnType<typeof createLogger>) => void): Record<string, unknown> {
  let raw = "";
  const stream = new Writable({
    write(chunk, _enc, callback) {
      raw += chunk.toString();
      callback();
    },
  });
  const logger = createLogger({ serviceName: "test" }, stream);
  log(logger);
  return JSON.parse(raw.trim().split("\n")[0]) as Record<string, unknown>;
}

describe("createLogger PII/secret redaction", () => {
  it("redacts secrets and PII fields, leaving safe fields intact", () => {
    const line = captureLogLine((logger) =>
      logger.info(
        {
          userId: "user-1",
          password: "hunter2",
          token: "abc123",
          csrfToken: "csrf-value",
          mobile: "09121234567",
          email: "partner@example.com",
          nationalCode: "0012345678",
        },
        "login attempt",
      ),
    );

    expect(line.userId).toBe("user-1");
    expect(line.password).toBe("[REDACTED]");
    expect(line.token).toBe("[REDACTED]");
    expect(line.csrfToken).toBe("[REDACTED]");
    expect(line.mobile).toBe("[REDACTED]");
    expect(line.email).toBe("[REDACTED]");
    expect(line.nationalCode).toBe("[REDACTED]");
  });
});

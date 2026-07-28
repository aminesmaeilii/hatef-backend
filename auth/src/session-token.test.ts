import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken } from "./session-token";

describe("session-token", () => {
  it("generates unique tokens", () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });

  it("hashes deterministically", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashSessionToken(generateSessionToken())).not.toBe(hashSessionToken(generateSessionToken()));
  });
});

import { describe, expect, it } from "vitest";
import { InvalidEitaaIdError, normalizeEitaaId } from "./eitaa";

describe("normalizeEitaaId", () => {
  it("normalizes a bare handle", () => {
    expect(normalizeEitaaId("HatefMedia")).toBe("hatefmedia");
  });

  it("normalizes an @mention", () => {
    expect(normalizeEitaaId("@HatefMedia")).toBe("hatefmedia");
  });

  it("normalizes a full URL", () => {
    expect(normalizeEitaaId("https://eitaa.com/HatefMedia/")).toBe("hatefmedia");
  });

  it("rejects an identifier that is too short", () => {
    expect(() => normalizeEitaaId("ab")).toThrow(InvalidEitaaIdError);
  });

  it("rejects invalid characters", () => {
    expect(() => normalizeEitaaId("has space")).toThrow(InvalidEitaaIdError);
  });
});

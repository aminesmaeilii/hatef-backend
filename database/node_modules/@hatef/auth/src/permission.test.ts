import { describe, expect, it } from "vitest";
import { ForbiddenPermissionError, PermissionChecker } from "./permission";

const matrix = {
  SUPER_ADMIN: ["channel:read", "channel:approve"],
  EVALUATOR: ["channel:read"],
  CHANNEL_OWNER: ["channel:read", "channel:manage-team"],
};

const checker = new PermissionChecker(matrix);

describe("PermissionChecker", () => {
  it("grants a global role assignment everywhere", () => {
    const assignments = [{ role: "SUPER_ADMIN" }];
    expect(checker.hasPermission(assignments, { permission: "channel:approve" })).toBe(true);
  });

  it("grants a resource-scoped assignment only for the matching resource", () => {
    const assignments = [{ role: "CHANNEL_OWNER", resourceType: "channel", resourceId: "channel-a" }];
    expect(
      checker.hasPermission(assignments, {
        permission: "channel:manage-team",
        resourceType: "channel",
        resourceId: "channel-a",
      }),
    ).toBe(true);
  });

  it("denies cross-channel access for a resource-scoped assignment", () => {
    const assignments = [{ role: "CHANNEL_OWNER", resourceType: "channel", resourceId: "channel-a" }];
    expect(
      checker.hasPermission(assignments, {
        permission: "channel:manage-team",
        resourceType: "channel",
        resourceId: "channel-b",
      }),
    ).toBe(false);
  });

  it("denies a permission no role in the matrix grants", () => {
    const assignments = [{ role: "EVALUATOR" }];
    expect(checker.hasPermission(assignments, { permission: "channel:approve" })).toBe(false);
  });

  it("assertPermission throws ForbiddenPermissionError when denied", () => {
    const assignments = [{ role: "EVALUATOR" }];
    expect(() => checker.assertPermission(assignments, { permission: "channel:approve" })).toThrow(
      ForbiddenPermissionError,
    );
  });
});

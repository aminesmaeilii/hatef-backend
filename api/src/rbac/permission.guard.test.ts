import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PermissionGuard } from "./permission.guard";
import type { PermissionsService } from "./permissions.service";
import type { RequirePermissionMetadata } from "./require-permission.decorator";

function fakeContext(params: {
  metadata?: RequirePermissionMetadata;
  actor?: { userId: string; roleAssignments: unknown[] };
  routeParams?: Record<string, string | string[]>;
}): ExecutionContext {
  const req = { actor: params.actor, params: params.routeParams ?? {} };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => (() => undefined),
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function fakeReflector(metadata?: RequirePermissionMetadata) {
  return { getAllAndOverride: vi.fn().mockReturnValue(metadata) } as unknown as import("@nestjs/core").Reflector;
}

describe("PermissionGuard", () => {
  it("allows the request through when no permission metadata is set", async () => {
    const permissions = { hasPermission: vi.fn() } as unknown as PermissionsService;
    const guard = new PermissionGuard(fakeReflector(undefined), permissions);

    await expect(guard.canActivate(fakeContext({}))).resolves.toBe(true);
    expect(permissions.hasPermission).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when permission metadata exists but there is no actor", async () => {
    const metadata: RequirePermissionMetadata = { permission: "channel:read" };
    const permissions = { hasPermission: vi.fn() } as unknown as PermissionsService;
    const guard = new PermissionGuard(fakeReflector(metadata), permissions);

    await expect(guard.canActivate(fakeContext({ metadata }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("allows the request when PermissionsService grants it", async () => {
    const metadata: RequirePermissionMetadata = { permission: "channel:read" };
    const permissions = { hasPermission: vi.fn().mockResolvedValue(true) } as unknown as PermissionsService;
    const guard = new PermissionGuard(fakeReflector(metadata), permissions);
    const actor = { userId: "u1", roleAssignments: [] };

    await expect(guard.canActivate(fakeContext({ metadata, actor }))).resolves.toBe(true);
  });

  it("throws Forbidden when PermissionsService denies it", async () => {
    const metadata: RequirePermissionMetadata = { permission: "channel:read" };
    const permissions = { hasPermission: vi.fn().mockResolvedValue(false) } as unknown as PermissionsService;
    const guard = new PermissionGuard(fakeReflector(metadata), permissions);
    const actor = { userId: "u1", roleAssignments: [] };

    await expect(guard.canActivate(fakeContext({ metadata, actor }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("resolves the scoped resourceId from the named route param", async () => {
    const metadata: RequirePermissionMetadata = {
      permission: "channel:read",
      resourceType: "channel",
      resourceIdParam: "channelId",
    };
    const hasPermission = vi.fn().mockResolvedValue(true);
    const permissions = { hasPermission } as unknown as PermissionsService;
    const guard = new PermissionGuard(fakeReflector(metadata), permissions);
    const actor = { userId: "u1", roleAssignments: [] };

    await guard.canActivate(fakeContext({ metadata, actor, routeParams: { channelId: "channel-a" } }));

    expect(hasPermission).toHaveBeenCalledWith(actor.roleAssignments, {
      permission: "channel:read",
      resourceType: "channel",
      resourceId: "channel-a",
    });
  });
});

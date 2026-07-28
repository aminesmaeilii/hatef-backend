import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PermissionsService } from "./permissions.service";
import { REQUIRE_PERMISSION_METADATA, type RequirePermissionMetadata } from "./require-permission.decorator";

/** Must run after SessionAuthGuard (needs req.actor already populated). */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Method-level metadata wins; falls back to class-level so a controller
    // can apply @RequirePermission() once for every route it defines.
    const metadata = this.reflector.getAllAndOverride<RequirePermissionMetadata | undefined>(
      REQUIRE_PERMISSION_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.actor) {
      throw new UnauthorizedException("Session required");
    }

    const rawResourceId = metadata.resourceIdParam ? req.params[metadata.resourceIdParam] : undefined;
    const resourceId = Array.isArray(rawResourceId) ? rawResourceId[0] : rawResourceId;

    const allowed = await this.permissions.hasPermission(req.actor.roleAssignments, {
      permission: metadata.permission,
      resourceType: metadata.resourceType,
      resourceId,
    });

    if (!allowed) {
      throw new ForbiddenException("دسترسی لازم برای انجام این عملیات را ندارید.");
    }

    return true;
  }
}

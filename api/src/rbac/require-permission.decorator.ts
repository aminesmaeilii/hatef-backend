import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@hatef/auth";

export interface RequirePermissionOptions {
  /** ABAC resource type this permission is scoped to, e.g. "channel". */
  resourceType?: string;
  /** Route param name to read the resourceId from, e.g. "channelId". */
  resourceIdParam?: string;
}

export const REQUIRE_PERMISSION_METADATA = "require_permission";

export interface RequirePermissionMetadata extends RequirePermissionOptions {
  permission: PermissionKey;
}

export const RequirePermission = (permission: PermissionKey, options?: RequirePermissionOptions) =>
  SetMetadata<string, RequirePermissionMetadata>(REQUIRE_PERMISSION_METADATA, { permission, ...options });

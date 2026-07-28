/**
 * RBAC + resource-scoped ABAC. A user can hold several role assignments,
 * each optionally scoped to a resource (e.g. a specific channel). A global
 * assignment (no resourceType/resourceId) grants the permission everywhere.
 */
export interface RoleAssignment {
  role: string;
  resourceType?: string;
  resourceId?: string;
}

export type PermissionMatrix = Record<string, readonly string[]>;

export interface PermissionCheck {
  permission: string;
  resourceType?: string;
  resourceId?: string;
}

export class PermissionChecker {
  constructor(private readonly matrix: PermissionMatrix) {}

  private rolesGrantingPermission(permission: string): string[] {
    return Object.entries(this.matrix)
      .filter(([, permissions]) => permissions.includes(permission))
      .map(([role]) => role);
  }

  hasPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): boolean {
    const grantingRoles = new Set(this.rolesGrantingPermission(check.permission));
    if (grantingRoles.size === 0) return false;

    return assignments.some((assignment) => {
      if (!grantingRoles.has(assignment.role)) return false;

      // A global assignment (no resource scope) grants the permission everywhere.
      if (!assignment.resourceType) return true;

      // A resource-scoped assignment only grants the permission for that exact resource.
      return (
        assignment.resourceType === check.resourceType && assignment.resourceId === check.resourceId
      );
    });
  }

  assertPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): void {
    if (!this.hasPermission(assignments, check)) {
      throw new ForbiddenPermissionError(check.permission, check.resourceType, check.resourceId);
    }
  }
}

export class ForbiddenPermissionError extends Error {
  constructor(
    public readonly permission: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string,
  ) {
    super(
      `Missing permission "${permission}"` +
        (resourceType ? ` on ${resourceType}:${resourceId}` : ""),
    );
    this.name = "ForbiddenPermissionError";
  }
}

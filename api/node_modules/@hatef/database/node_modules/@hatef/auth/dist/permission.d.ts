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
export declare class PermissionChecker {
    private readonly matrix;
    constructor(matrix: PermissionMatrix);
    private rolesGrantingPermission;
    hasPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): boolean;
    assertPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): void;
}
export declare class ForbiddenPermissionError extends Error {
    readonly permission: string;
    readonly resourceType?: string | undefined;
    readonly resourceId?: string | undefined;
    constructor(permission: string, resourceType?: string | undefined, resourceId?: string | undefined);
}
//# sourceMappingURL=permission.d.ts.map
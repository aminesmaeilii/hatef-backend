"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenPermissionError = exports.PermissionChecker = void 0;
class PermissionChecker {
    matrix;
    constructor(matrix) {
        this.matrix = matrix;
    }
    rolesGrantingPermission(permission) {
        return Object.entries(this.matrix)
            .filter(([, permissions]) => permissions.includes(permission))
            .map(([role]) => role);
    }
    hasPermission(assignments, check) {
        const grantingRoles = new Set(this.rolesGrantingPermission(check.permission));
        if (grantingRoles.size === 0)
            return false;
        return assignments.some((assignment) => {
            if (!grantingRoles.has(assignment.role))
                return false;
            // A global assignment (no resource scope) grants the permission everywhere.
            if (!assignment.resourceType)
                return true;
            // A resource-scoped assignment only grants the permission for that exact resource.
            return (assignment.resourceType === check.resourceType && assignment.resourceId === check.resourceId);
        });
    }
    assertPermission(assignments, check) {
        if (!this.hasPermission(assignments, check)) {
            throw new ForbiddenPermissionError(check.permission, check.resourceType, check.resourceId);
        }
    }
}
exports.PermissionChecker = PermissionChecker;
class ForbiddenPermissionError extends Error {
    permission;
    resourceType;
    resourceId;
    constructor(permission, resourceType, resourceId) {
        super(`Missing permission "${permission}"` +
            (resourceType ? ` on ${resourceType}:${resourceId}` : ""));
        this.permission = permission;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.name = "ForbiddenPermissionError";
    }
}
exports.ForbiddenPermissionError = ForbiddenPermissionError;

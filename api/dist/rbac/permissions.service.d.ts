import { type PermissionCheck, type RoleAssignment } from "@hatef/auth";
import { PrismaService } from "../prisma/prisma.service";
/**
 * Loads the Role -> Permission matrix from the database (cached briefly —
 * it changes rarely) and delegates the actual RBAC/ABAC decision to
 * backend/auth's framework-free PermissionChecker.
 */
export declare class PermissionsService {
    private readonly prisma;
    private cachedMatrix;
    private cachedAt;
    constructor(prisma: PrismaService);
    hasPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): Promise<boolean>;
    invalidateCache(): Promise<void>;
    private getMatrix;
}
//# sourceMappingURL=permissions.service.d.ts.map
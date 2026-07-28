import { Injectable } from "@nestjs/common";
import { PermissionChecker, type PermissionCheck, type PermissionMatrix, type RoleAssignment } from "@hatef/auth";
import { PrismaService } from "../prisma/prisma.service";

const MATRIX_CACHE_TTL_MS = 60_000;

/**
 * Loads the Role -> Permission matrix from the database (cached briefly —
 * it changes rarely) and delegates the actual RBAC/ABAC decision to
 * backend/auth's framework-free PermissionChecker.
 */
@Injectable()
export class PermissionsService {
  private cachedMatrix: PermissionMatrix | null = null;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async hasPermission(assignments: readonly RoleAssignment[], check: PermissionCheck): Promise<boolean> {
    const matrix = await this.getMatrix();
    return new PermissionChecker(matrix).hasPermission(assignments, check);
  }

  async invalidateCache(): Promise<void> {
    this.cachedMatrix = null;
  }

  private async getMatrix(): Promise<PermissionMatrix> {
    if (this.cachedMatrix && Date.now() - this.cachedAt < MATRIX_CACHE_TTL_MS) {
      return this.cachedMatrix;
    }

    const roles = await this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });

    const matrix: PermissionMatrix = {};
    for (const role of roles) {
      matrix[role.key] = role.rolePermissions.map((rp) => rp.permission.key);
    }

    this.cachedMatrix = matrix;
    this.cachedAt = Date.now();
    return matrix;
  }
}

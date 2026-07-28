import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AuditLogEntry, CursorPaginationQuery } from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";

const DEFAULT_LIMIT = 20;

@Controller("audit-logs")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  async list(
    @Query() query: Partial<CursorPaginationQuery> & { entityType?: string; entityId?: string },
  ): Promise<{ items: AuditLogEntry[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), 100);

    const rows = await this.prisma.auditLog.findMany({
      take: limit + 1,
      where: {
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
      },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        actorType: row.actorType,
        actorLabel: row.actorLabel,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: row.metadata,
        correlationId: row.correlationId,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }
}

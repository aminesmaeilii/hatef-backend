import type { AuditLogEntry, CursorPaginationQuery } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuditLogController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(query: Partial<CursorPaginationQuery> & {
        entityType?: string;
        entityId?: string;
    }): Promise<{
        items: AuditLogEntry[];
        nextCursor: string | null;
    }>;
}
//# sourceMappingURL=audit-log.controller.d.ts.map
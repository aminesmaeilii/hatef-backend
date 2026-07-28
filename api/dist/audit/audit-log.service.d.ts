import type { Prisma } from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
export interface RecordAuditEventInput {
    actorId?: string | null;
    actorType: string;
    actorLabel?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
    correlationId?: string;
    ipAddress?: string | null;
}
export declare class AuditLogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    record(input: RecordAuditEventInput): Promise<void>;
}
//# sourceMappingURL=audit-log.service.d.ts.map
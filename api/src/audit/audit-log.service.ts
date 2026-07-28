import { Injectable } from "@nestjs/common";
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

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditEventInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorType: input.actorType,
        actorLabel: input.actorLabel ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before,
        after: input.after,
        metadata: input.metadata,
        correlationId: input.correlationId,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }
}

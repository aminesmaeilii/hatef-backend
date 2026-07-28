import { z } from "zod";

export const auditLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorType: z.string(),
  actorLabel: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.unknown().nullable(),
  correlationId: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

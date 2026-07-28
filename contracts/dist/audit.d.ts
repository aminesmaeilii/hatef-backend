import { z } from "zod";
export declare const auditLogEntrySchema: z.ZodObject<{
    id: z.ZodString;
    actorId: z.ZodNullable<z.ZodString>;
    actorType: z.ZodString;
    actorLabel: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodUnknown>;
    correlationId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
//# sourceMappingURL=audit.d.ts.map
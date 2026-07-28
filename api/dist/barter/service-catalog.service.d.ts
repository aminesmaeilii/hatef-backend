import type { CreateServiceCatalogItem, CreateServiceCatalogVersion, ServiceCatalogItem } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
export declare class ServiceCatalogService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    /** Same "container + immutable-once-published version" split as PromotionType (spec 16.2 "active version"). */
    create(input: CreateServiceCatalogItem, actor: RequestActor): Promise<ServiceCatalogItem>;
    /** A new version replaces which one is "active" without ever editing the old row (same discipline as FormsService.publish()). */
    addVersion(itemId: string, input: CreateServiceCatalogVersion): Promise<ServiceCatalogItem>;
    list(): Promise<ServiceCatalogItem[]>;
    getOne(itemId: string): Promise<ServiceCatalogItem>;
    getActiveVersionOrThrow(itemId: string): Promise<{
        status: import("@hatef/database").$Enums.ServiceCatalogVersionStatus;
        id: string;
        createdAt: Date;
        versionNumber: number;
        publishedAt: Date | null;
        unit: string;
        valuationMethod: string;
        defaultAcceptanceCriteria: string | null;
        defaultEvidence: string | null;
        priceGuidanceRial: bigint | null;
        serviceCatalogItemId: string;
    }>;
}
//# sourceMappingURL=service-catalog.service.d.ts.map
import { BadRequestException, Injectable } from "@nestjs/common";
import { serializeRial } from "@hatef/domain";
import type { CreateServiceCatalogItem, CreateServiceCatalogVersion, ServiceCatalogItem, ServiceCatalogVersion } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";

@Injectable()
export class ServiceCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Same "container + immutable-once-published version" split as PromotionType (spec 16.2 "active version"). */
  async create(input: CreateServiceCatalogItem, actor: RequestActor): Promise<ServiceCatalogItem> {
    const item = await this.prisma.serviceCatalogItem.create({
      data: {
        key: input.key,
        name: input.name,
        serviceType: input.serviceType,
        description: input.description,
        versions: {
          create: {
            versionNumber: 1,
            status: "PUBLISHED",
            unit: input.unit,
            valuationMethod: input.valuationMethod,
            defaultAcceptanceCriteria: input.defaultAcceptanceCriteria,
            defaultEvidence: input.defaultEvidence,
            priceGuidanceRial: input.priceGuidanceRial ? BigInt(input.priceGuidanceRial) : undefined,
            publishedAt: new Date(),
          },
        },
      },
      include: { versions: true },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "service-catalog-item.created",
      entityType: "service_catalog_item",
      entityId: item.id,
    });

    return toDto(item);
  }

  /** A new version replaces which one is "active" without ever editing the old row (same discipline as FormsService.publish()). */
  async addVersion(itemId: string, input: CreateServiceCatalogVersion): Promise<ServiceCatalogItem> {
    const item = await this.prisma.serviceCatalogItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    const nextVersionNumber = (item.versions[0]?.versionNumber ?? 0) + 1;
    if (item.versions[0]?.status === "PUBLISHED") {
      await this.prisma.serviceCatalogVersion.update({ where: { id: item.versions[0].id }, data: { status: "ARCHIVED" } });
    }
    await this.prisma.serviceCatalogVersion.create({
      data: {
        serviceCatalogItemId: itemId,
        versionNumber: nextVersionNumber,
        status: "PUBLISHED",
        unit: input.unit,
        valuationMethod: input.valuationMethod,
        defaultAcceptanceCriteria: input.defaultAcceptanceCriteria,
        defaultEvidence: input.defaultEvidence,
        priceGuidanceRial: input.priceGuidanceRial ? BigInt(input.priceGuidanceRial) : undefined,
        publishedAt: new Date(),
      },
    });
    return this.getOne(itemId);
  }

  async list(): Promise<ServiceCatalogItem[]> {
    const items = await this.prisma.serviceCatalogItem.findMany({
      include: { versions: { where: { status: "PUBLISHED" }, orderBy: { versionNumber: "desc" }, take: 1 } },
      orderBy: { createdAt: "asc" },
    });
    return items.map(toDto);
  }

  async getOne(itemId: string): Promise<ServiceCatalogItem> {
    const item = await this.prisma.serviceCatalogItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { versions: { where: { status: "PUBLISHED" }, orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    return toDto(item);
  }

  async getActiveVersionOrThrow(itemId: string) {
    const version = await this.prisma.serviceCatalogVersion.findFirst({
      where: { serviceCatalogItemId: itemId, status: "PUBLISHED" },
      orderBy: { versionNumber: "desc" },
    });
    if (!version) {
      throw new BadRequestException("این خدمت متقابل نسخه فعالی ندارد.");
    }
    return version;
  }
}

type ItemWithVersions = {
  id: string;
  key: string;
  name: string;
  serviceType: string;
  description: string | null;
  versions: {
    id: string;
    versionNumber: number;
    status: string;
    unit: string;
    valuationMethod: string;
    defaultAcceptanceCriteria: string | null;
    defaultEvidence: string | null;
    priceGuidanceRial: bigint | null;
    publishedAt: Date | null;
  }[];
};

function toDto(item: ItemWithVersions): ServiceCatalogItem {
  const v = item.versions[0];
  return {
    id: item.id,
    key: item.key,
    name: item.name,
    serviceType: item.serviceType as ServiceCatalogItem["serviceType"],
    description: item.description,
    activeVersion: v
      ? {
          id: v.id,
          versionNumber: v.versionNumber,
          status: v.status as ServiceCatalogVersion["status"],
          unit: v.unit,
          valuationMethod: v.valuationMethod,
          defaultAcceptanceCriteria: v.defaultAcceptanceCriteria,
          defaultEvidence: v.defaultEvidence,
          priceGuidanceRial: v.priceGuidanceRial !== null ? serializeRial(v.priceGuidanceRial) : null,
          publishedAt: v.publishedAt?.toISOString() ?? null,
        }
      : null,
  };
}

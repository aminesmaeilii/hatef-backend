"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCatalogService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
let ServiceCatalogService = class ServiceCatalogService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    /** Same "container + immutable-once-published version" split as PromotionType (spec 16.2 "active version"). */
    async create(input, actor) {
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
    async addVersion(itemId, input) {
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
    async list() {
        const items = await this.prisma.serviceCatalogItem.findMany({
            include: { versions: { where: { status: "PUBLISHED" }, orderBy: { versionNumber: "desc" }, take: 1 } },
            orderBy: { createdAt: "asc" },
        });
        return items.map(toDto);
    }
    async getOne(itemId) {
        const item = await this.prisma.serviceCatalogItem.findUniqueOrThrow({
            where: { id: itemId },
            include: { versions: { where: { status: "PUBLISHED" }, orderBy: { versionNumber: "desc" }, take: 1 } },
        });
        return toDto(item);
    }
    async getActiveVersionOrThrow(itemId) {
        const version = await this.prisma.serviceCatalogVersion.findFirst({
            where: { serviceCatalogItemId: itemId, status: "PUBLISHED" },
            orderBy: { versionNumber: "desc" },
        });
        if (!version) {
            throw new common_1.BadRequestException("این خدمت متقابل نسخه فعالی ندارد.");
        }
        return version;
    }
};
exports.ServiceCatalogService = ServiceCatalogService;
exports.ServiceCatalogService = ServiceCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], ServiceCatalogService);
function toDto(item) {
    const v = item.versions[0];
    return {
        id: item.id,
        key: item.key,
        name: item.name,
        serviceType: item.serviceType,
        description: item.description,
        activeVersion: v
            ? {
                id: v.id,
                versionNumber: v.versionNumber,
                status: v.status,
                unit: v.unit,
                valuationMethod: v.valuationMethod,
                defaultAcceptanceCriteria: v.defaultAcceptanceCriteria,
                defaultEvidence: v.defaultEvidence,
                priceGuidanceRial: v.priceGuidanceRial !== null ? (0, domain_1.serializeRial)(v.priceGuidanceRial) : null,
                publishedAt: v.publishedAt?.toISOString() ?? null,
            }
            : null,
    };
}

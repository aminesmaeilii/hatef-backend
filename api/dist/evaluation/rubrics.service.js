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
exports.RubricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RubricsService = class RubricsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        const latest = await this.prisma.evaluationRubric.findFirst({
            where: { key: input.key },
            orderBy: { versionNumber: "desc" },
        });
        const rubric = await this.prisma.evaluationRubric.create({
            data: {
                key: input.key,
                versionNumber: (latest?.versionNumber ?? 0) + 1,
                title: input.title,
                criteria: input.criteria,
                status: "DRAFT",
            },
        });
        return this.toDto(rubric);
    }
    async publish(rubricId) {
        const rubric = await this.prisma.evaluationRubric.findUniqueOrThrow({ where: { id: rubricId } });
        await this.prisma.$transaction([
            this.prisma.evaluationRubric.updateMany({
                where: { key: rubric.key, status: "PUBLISHED" },
                data: { status: "ARCHIVED" },
            }),
            this.prisma.evaluationRubric.update({
                where: { id: rubricId },
                data: { status: "PUBLISHED", publishedAt: new Date() },
            }),
        ]);
        return this.toDto({ ...rubric, status: "PUBLISHED" });
    }
    async listPublished() {
        const rubrics = await this.prisma.evaluationRubric.findMany({ where: { status: "PUBLISHED" } });
        return rubrics.map((r) => this.toDto(r));
    }
    async getPublishedByKey(key) {
        const rubric = await this.prisma.evaluationRubric.findFirst({ where: { key, status: "PUBLISHED" } });
        if (!rubric)
            throw new common_1.NotFoundException("سیاهه ارزیابی منتشرشده‌ای یافت نشد.");
        return this.toDto(rubric);
    }
    toDto(rubric) {
        return {
            id: rubric.id,
            key: rubric.key,
            versionNumber: rubric.versionNumber,
            title: rubric.title,
            criteria: rubric.criteria,
            status: rubric.status,
        };
    }
};
exports.RubricsService = RubricsService;
exports.RubricsService = RubricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RubricsService);

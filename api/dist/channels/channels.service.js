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
exports.ChannelsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
let ChannelsService = class ChannelsService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async create(input, actor) {
        const channel = await this.prisma.channel.create({
            data: { title: input.title, eitaaId: (0, domain_1.normalizeEitaaId)(input.eitaaId) },
        });
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: "channel.created",
            entityType: "channel",
            entityId: channel.id,
        });
        return toChannelDto(channel);
    }
    async listAll() {
        const channels = await this.prisma.channel.findMany({ orderBy: { createdAt: "desc" } });
        return channels.map(toChannelDto);
    }
    async getOne(channelId) {
        const channel = await this.prisma.channel.findUniqueOrThrow({ where: { id: channelId } });
        return toChannelDto(channel);
    }
    async listMemberships(channelId) {
        const memberships = await this.prisma.channelMembership.findMany({
            where: { channelId },
            include: { user: { select: { displayName: true } } },
            orderBy: { createdAt: "asc" },
        });
        return memberships.map((m) => ({
            id: m.id,
            userId: m.userId,
            channelId: m.channelId,
            role: m.role,
            status: m.status,
            userDisplayName: m.user.displayName,
        }));
    }
    async addMembership(channelId, input, actor) {
        const mobile = (0, domain_1.normalizeIranianMobile)(input.mobile);
        const role = await this.prisma.role.findUniqueOrThrow({ where: { key: input.role } });
        const contact = await this.prisma.userContact.findUnique({
            where: { type_value: { type: "MOBILE", value: mobile } },
        });
        const userId = contact
            ? contact.userId
            : (await this.prisma.user.create({
                data: { displayName: mobile, contacts: { create: { type: "MOBILE", value: mobile, isPrimary: true } } },
            })).id;
        const [membership] = await this.prisma.$transaction([
            this.prisma.channelMembership.upsert({
                where: { userId_channelId: { userId, channelId } },
                create: { userId, channelId, role: input.role, status: "ACTIVE" },
                update: { role: input.role, status: "ACTIVE" },
            }),
            this.prisma.roleAssignment.upsert({
                where: {
                    userId_roleId_resourceType_resourceId: {
                        userId,
                        roleId: role.id,
                        resourceType: "channel",
                        resourceId: channelId,
                    },
                },
                create: { userId, roleId: role.id, resourceType: "channel", resourceId: channelId },
                update: {},
            }),
        ]);
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: "channel.membership.added",
            entityType: "channel",
            entityId: channelId,
            metadata: { userId, role: input.role },
        });
        return {
            id: membership.id,
            userId: membership.userId,
            channelId: membership.channelId,
            role: membership.role,
            status: membership.status,
        };
    }
};
exports.ChannelsService = ChannelsService;
exports.ChannelsService = ChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], ChannelsService);
function toChannelDto(channel) {
    return {
        id: channel.id,
        title: channel.title,
        eitaaId: channel.eitaaId,
        status: channel.status,
        createdAt: channel.createdAt.toISOString(),
    };
}

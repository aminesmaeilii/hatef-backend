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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
let NotificationsService = class NotificationsService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async notify(input) {
        const primaryDedupeKey = `${input.dedupeKey}:IN_APP`;
        const existing = await this.prisma.notificationDelivery.findUnique({ where: { dedupeKey: primaryDedupeKey } });
        if (existing)
            return; // this exact business event was already notified — retry-safe no-op.
        const requestedChannels = input.channels ?? ["IN_APP"];
        const mobile = requestedChannels.includes("SMS")
            ? await this.prisma.userContact.findFirst({ where: { userId: input.userId, type: "MOBILE" } })
            : null;
        const channels = requestedChannels.filter((c) => c !== "SMS" || mobile);
        if (channels.length === 0)
            return;
        const notification = await this.prisma.notification.create({
            data: {
                userId: input.userId,
                eventType: input.eventType,
                title: input.title,
                body: input.body,
                deepLink: input.deepLink,
                linkedEntityType: input.linkedEntityType,
                linkedEntityId: input.linkedEntityId,
                mandatory: input.mandatory ?? false,
            },
        });
        const [preferences, quietHours] = await Promise.all([
            this.prisma.notificationPreference.findMany({ where: { userId: input.userId, eventType: input.eventType } }),
            this.prisma.notificationQuietHours.findUnique({ where: { userId: input.userId } }),
        ]);
        const nowHour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: this.config.env.APP_TIMEZONE }).format(new Date()));
        for (const channel of channels) {
            const dedupeKey = `${input.dedupeKey}:${channel}`;
            const preference = preferences.find((p) => p.channel === channel);
            if (!input.mandatory && preference && !preference.enabled) {
                await this.prisma.notificationDelivery.create({ data: { notificationId: notification.id, channel, status: "SKIPPED_PREFERENCE", dedupeKey } });
                continue;
            }
            if (!input.mandatory && quietHours && (0, domain_1.isWithinQuietHours)(nowHour, quietHours)) {
                await this.prisma.notificationDelivery.create({ data: { notificationId: notification.id, channel, status: "SKIPPED_QUIET_HOURS", dedupeKey } });
                continue;
            }
            const delivery = await this.prisma.notificationDelivery.create({
                data: { notificationId: notification.id, channel, status: "PENDING", dedupeKey },
            });
            await this.prisma.outboxEvent.create({
                data: {
                    eventType: "notification.deliver",
                    payload: { notificationDeliveryId: delivery.id },
                    correlationId: dedupeKey,
                },
            });
        }
    }
    /** Convenience for the many triggers whose recipient is "whoever owns this channel" rather than a specific already-known userId. A no-op if the channel has no active owner. */
    async notifyChannelOwner(channelId, input) {
        const owner = await this.prisma.channelMembership.findFirst({
            where: { channelId, role: "CHANNEL_OWNER", status: "ACTIVE" },
            orderBy: { createdAt: "asc" },
        });
        if (!owner)
            return;
        await this.notify({ ...input, userId: owner.userId });
    }
    async listForUser(userId, unreadOnly) {
        const notifications = await this.prisma.notification.findMany({
            where: { userId, readAt: unreadOnly ? null : undefined },
            include: { deliveries: true },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return notifications.map(toNotificationDto);
    }
    async markRead(notificationId, userId) {
        await this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
    }
    async markAllRead(userId) {
        await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    }
    async setPreference(userId, input) {
        await this.prisma.notificationPreference.upsert({
            where: { userId_eventType_channel: { userId, eventType: input.eventType, channel: input.channel } },
            update: { enabled: input.enabled },
            create: { userId, eventType: input.eventType, channel: input.channel, enabled: input.enabled },
        });
    }
    async setQuietHours(userId, input) {
        await this.prisma.notificationQuietHours.upsert({
            where: { userId },
            update: { startHour: input.startHour, endHour: input.endHour },
            create: { userId, startHour: input.startHour, endHour: input.endHour },
        });
    }
    async getQuietHours(userId) {
        const row = await this.prisma.notificationQuietHours.findUnique({ where: { userId } });
        return row ? { startHour: row.startHour, endHour: row.endHour } : null;
    }
    async createTemplate(input) {
        const latest = await this.prisma.notificationTemplate.findFirst({
            where: { key: input.key, channel: input.channel },
            orderBy: { versionNumber: "desc" },
        });
        if (latest?.status === "PUBLISHED") {
            await this.prisma.notificationTemplate.update({ where: { id: latest.id }, data: { status: "ARCHIVED" } });
        }
        const created = await this.prisma.notificationTemplate.create({
            data: {
                key: input.key,
                channel: input.channel,
                versionNumber: (latest?.versionNumber ?? 0) + 1,
                title: input.title,
                body: input.body,
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
        return toTemplateDto(created);
    }
    async listTemplates() {
        const rows = await this.prisma.notificationTemplate.findMany({ where: { status: "PUBLISHED" }, orderBy: { key: "asc" } });
        return rows.map(toTemplateDto);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService])
], NotificationsService);
function toNotificationDto(n) {
    return {
        id: n.id,
        eventType: n.eventType,
        title: n.title,
        body: n.body,
        deepLink: n.deepLink,
        linkedEntityType: n.linkedEntityType,
        linkedEntityId: n.linkedEntityId,
        mandatory: n.mandatory,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        deliveries: n.deliveries.map((d) => ({
            id: d.id,
            channel: d.channel,
            status: d.status,
            attempts: d.attempts,
            lastError: d.lastError,
            sentAt: d.sentAt?.toISOString() ?? null,
        })),
    };
}
function toTemplateDto(t) {
    return {
        id: t.id,
        key: t.key,
        versionNumber: t.versionNumber,
        channel: t.channel,
        title: t.title,
        body: t.body,
        status: t.status,
        publishedAt: t.publishedAt?.toISOString() ?? null,
    };
}

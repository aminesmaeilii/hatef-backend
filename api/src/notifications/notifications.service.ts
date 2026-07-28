import { Injectable } from "@nestjs/common";
import { isWithinQuietHours } from "@hatef/domain";
import type {
  CreateNotificationTemplate,
  NotificationChannelTypeKey,
  NotificationDto,
  NotificationQuietHours,
  NotificationTemplate,
  SetNotificationPreference,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";

export interface NotifyInput {
  userId: string;
  eventType: string;
  /** Caller-supplied business-event idempotency key (e.g. `support-request:<id>:submitted`) — makes the whole notify() call retry-safe, spec 19 "deduplication". */
  dedupeKey: string;
  title: string;
  body: string;
  deepLink?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  /** Bypasses quiet hours and per-event preference-off (spec 19 "mandatory security events"). */
  mandatory?: boolean;
  channels?: NotificationChannelTypeKey[];
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async notify(input: NotifyInput): Promise<void> {
    const primaryDedupeKey = `${input.dedupeKey}:IN_APP`;
    const existing = await this.prisma.notificationDelivery.findUnique({ where: { dedupeKey: primaryDedupeKey } });
    if (existing) return; // this exact business event was already notified — retry-safe no-op.

    const requestedChannels = input.channels ?? ["IN_APP"];
    const mobile = requestedChannels.includes("SMS")
      ? await this.prisma.userContact.findFirst({ where: { userId: input.userId, type: "MOBILE" } })
      : null;
    const channels = requestedChannels.filter((c) => c !== "SMS" || mobile);
    if (channels.length === 0) return;

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

    const nowHour = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: this.config.env.APP_TIMEZONE }).format(new Date()),
    );

    for (const channel of channels) {
      const dedupeKey = `${input.dedupeKey}:${channel}`;
      const preference = preferences.find((p) => p.channel === channel);

      if (!input.mandatory && preference && !preference.enabled) {
        await this.prisma.notificationDelivery.create({ data: { notificationId: notification.id, channel, status: "SKIPPED_PREFERENCE", dedupeKey } });
        continue;
      }
      if (!input.mandatory && quietHours && isWithinQuietHours(nowHour, quietHours)) {
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
  async notifyChannelOwner(channelId: string, input: Omit<NotifyInput, "userId">): Promise<void> {
    const owner = await this.prisma.channelMembership.findFirst({
      where: { channelId, role: "CHANNEL_OWNER", status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    if (!owner) return;
    await this.notify({ ...input, userId: owner.userId });
  }

  async listForUser(userId: string, unreadOnly: boolean): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, readAt: unreadOnly ? null : undefined },
      include: { deliveries: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return notifications.map(toNotificationDto);
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  async setPreference(userId: string, input: SetNotificationPreference): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_eventType_channel: { userId, eventType: input.eventType, channel: input.channel } },
      update: { enabled: input.enabled },
      create: { userId, eventType: input.eventType, channel: input.channel, enabled: input.enabled },
    });
  }

  async setQuietHours(userId: string, input: NotificationQuietHours): Promise<void> {
    await this.prisma.notificationQuietHours.upsert({
      where: { userId },
      update: { startHour: input.startHour, endHour: input.endHour },
      create: { userId, startHour: input.startHour, endHour: input.endHour },
    });
  }

  async getQuietHours(userId: string): Promise<NotificationQuietHours | null> {
    const row = await this.prisma.notificationQuietHours.findUnique({ where: { userId } });
    return row ? { startHour: row.startHour, endHour: row.endHour } : null;
  }

  async createTemplate(input: CreateNotificationTemplate): Promise<NotificationTemplate> {
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

  async listTemplates(): Promise<NotificationTemplate[]> {
    const rows = await this.prisma.notificationTemplate.findMany({ where: { status: "PUBLISHED" }, orderBy: { key: "asc" } });
    return rows.map(toTemplateDto);
  }
}

function toNotificationDto(n: {
  id: string;
  eventType: string;
  title: string;
  body: string;
  deepLink: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  mandatory: boolean;
  readAt: Date | null;
  createdAt: Date;
  deliveries: { id: string; channel: string; status: string; attempts: number; lastError: string | null; sentAt: Date | null }[];
}): NotificationDto {
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
      channel: d.channel as NotificationChannelTypeKey,
      status: d.status as NotificationDto["deliveries"][number]["status"],
      attempts: d.attempts,
      lastError: d.lastError,
      sentAt: d.sentAt?.toISOString() ?? null,
    })),
  };
}

function toTemplateDto(t: {
  id: string;
  key: string;
  versionNumber: number;
  channel: string;
  title: string;
  body: string;
  status: string;
  publishedAt: Date | null;
}): NotificationTemplate {
  return {
    id: t.id,
    key: t.key,
    versionNumber: t.versionNumber,
    channel: t.channel as NotificationChannelTypeKey,
    title: t.title,
    body: t.body,
    status: t.status as NotificationTemplate["status"],
    publishedAt: t.publishedAt?.toISOString() ?? null,
  };
}

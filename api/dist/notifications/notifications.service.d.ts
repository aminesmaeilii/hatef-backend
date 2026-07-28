import type { CreateNotificationTemplate, NotificationChannelTypeKey, NotificationDto, NotificationQuietHours, NotificationTemplate, SetNotificationPreference } from "@hatef/contracts";
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
export declare class NotificationsService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: AppConfigService);
    notify(input: NotifyInput): Promise<void>;
    /** Convenience for the many triggers whose recipient is "whoever owns this channel" rather than a specific already-known userId. A no-op if the channel has no active owner. */
    notifyChannelOwner(channelId: string, input: Omit<NotifyInput, "userId">): Promise<void>;
    listForUser(userId: string, unreadOnly: boolean): Promise<NotificationDto[]>;
    markRead(notificationId: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    setPreference(userId: string, input: SetNotificationPreference): Promise<void>;
    setQuietHours(userId: string, input: NotificationQuietHours): Promise<void>;
    getQuietHours(userId: string): Promise<NotificationQuietHours | null>;
    createTemplate(input: CreateNotificationTemplate): Promise<NotificationTemplate>;
    listTemplates(): Promise<NotificationTemplate[]>;
}
//# sourceMappingURL=notifications.service.d.ts.map
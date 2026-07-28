import { type CreateNotificationTemplate, type NotificationQuietHours, type SetNotificationPreference } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { NotificationsService } from "./notifications.service";
/** Self-only — every route reads/writes strictly the caller's own inbox/preferences, enforced by filtering on `actor.userId`, never by ABAC resource scoping (same "own data" shape as SESSION_READ_OWN). */
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(actor: RequestActor, unreadOnly?: string): Promise<{
        id: string;
        eventType: string;
        title: string;
        body: string;
        deepLink: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        mandatory: boolean;
        readAt: string | null;
        createdAt: string;
        deliveries: {
            id: string;
            channel: "EMAIL" | "IN_APP" | "SMS" | "PUSH";
            status: "PENDING" | "FAILED" | "SENT" | "DEAD_LETTER" | "SKIPPED_QUIET_HOURS" | "SKIPPED_PREFERENCE";
            attempts: number;
            lastError: string | null;
            sentAt: string | null;
        }[];
    }[]>;
    markRead(notificationId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    markAllRead(actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    setPreference(body: SetNotificationPreference, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    getQuietHours(actor: RequestActor): Promise<{
        startHour: number;
        endHour: number;
    } | null>;
    setQuietHours(body: NotificationQuietHours, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
}
/** Admin-only template authoring. */
export declare class NotificationTemplatesController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(): Promise<{
        id: string;
        key: string;
        versionNumber: number;
        channel: "EMAIL" | "IN_APP" | "SMS" | "PUSH";
        title: string;
        body: string;
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        publishedAt: string | null;
    }[]>;
    create(body: CreateNotificationTemplate): Promise<{
        id: string;
        key: string;
        versionNumber: number;
        channel: "EMAIL" | "IN_APP" | "SMS" | "PUSH";
        title: string;
        body: string;
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        publishedAt: string | null;
    }>;
}
//# sourceMappingURL=notifications.controller.d.ts.map
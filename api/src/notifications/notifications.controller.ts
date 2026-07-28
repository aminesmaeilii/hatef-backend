import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createNotificationTemplateSchema,
  notificationQuietHoursSchema,
  setNotificationPreferenceSchema,
  type CreateNotificationTemplate,
  type NotificationQuietHours,
  type SetNotificationPreference,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { NotificationsService } from "./notifications.service";

/** Self-only — every route reads/writes strictly the caller's own inbox/preferences, enforced by filtering on `actor.userId`, never by ABAC resource scoping (same "own data" shape as SESSION_READ_OWN). */
@Controller("notifications")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async list(@CurrentActor() actor: RequestActor, @Query("unreadOnly") unreadOnly?: string) {
    return this.notifications.listForUser(actor.userId, unreadOnly === "true");
  }

  @Post(":notificationId/read")
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async markRead(@Param("notificationId") notificationId: string, @CurrentActor() actor: RequestActor) {
    await this.notifications.markRead(notificationId, actor.userId);
    return { ok: true };
  }

  @Post("read-all")
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async markAllRead(@CurrentActor() actor: RequestActor) {
    await this.notifications.markAllRead(actor.userId);
    return { ok: true };
  }

  @Patch("preferences")
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async setPreference(
    @Body(new ZodValidationPipe(setNotificationPreferenceSchema)) body: SetNotificationPreference,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.notifications.setPreference(actor.userId, body);
    return { ok: true };
  }

  @Get("quiet-hours")
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async getQuietHours(@CurrentActor() actor: RequestActor) {
    return this.notifications.getQuietHours(actor.userId);
  }

  @Patch("quiet-hours")
  @RequirePermission(PERMISSIONS.NOTIFICATION_READ_OWN)
  async setQuietHours(
    @Body(new ZodValidationPipe(notificationQuietHoursSchema)) body: NotificationQuietHours,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.notifications.setQuietHours(actor.userId, body);
    return { ok: true };
  }
}

/** Admin-only template authoring. */
@Controller("notification-templates")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class NotificationTemplatesController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE)
  async list() {
    return this.notifications.listTemplates();
  }

  @Post()
  @RequirePermission(PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE)
  async create(@Body(new ZodValidationPipe(createNotificationTemplateSchema)) body: CreateNotificationTemplate) {
    return this.notifications.createTemplate(body);
  }
}

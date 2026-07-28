import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  createCalendarEventSchema,
  createDateNoteSchema,
  type CreateCalendarEvent,
  type CreateDateNote,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { CalendarService } from "./calendar.service";

function parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
  if (!from || !to) {
    throw new BadRequestException("بازه زمانی (from و to) الزامی است.");
  }
  return { from: new Date(from), to: new Date(to) };
}

@Controller("calendar")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("feed")
  @RequirePermission(PERMISSIONS.CALENDAR_READ)
  async getFeed(@Query("from") from?: string, @Query("to") to?: string, @Query("channelId") channelId?: string) {
    const range = parseDateRange(from, to);
    return this.calendar.getFeed(range.from, range.to, channelId);
  }

  @Get("date-notes")
  @RequirePermission(PERMISSIONS.CALENDAR_READ)
  async listDateNotes(@Query("from") from?: string, @Query("to") to?: string, @Query("channelId") channelId?: string) {
    const range = parseDateRange(from, to);
    return this.calendar.listDateNotes(range.from, range.to, channelId);
  }

  @Post("date-notes")
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  async createDateNote(@Body(new ZodValidationPipe(createDateNoteSchema)) body: CreateDateNote, @CurrentActor() actor: RequestActor) {
    return this.calendar.createDateNote(body, actor);
  }

  @Delete("date-notes/:id")
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  async deleteDateNote(@Param("id") id: string) {
    await this.calendar.deleteDateNote(id);
    return { ok: true };
  }

  @Post("events")
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  async createEvent(@Body(new ZodValidationPipe(createCalendarEventSchema)) body: CreateCalendarEvent, @CurrentActor() actor: RequestActor) {
    return this.calendar.createEvent(body, actor);
  }

  @Delete("events/:id")
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  async deleteEvent(@Param("id") id: string) {
    await this.calendar.deleteEvent(id);
    return { ok: true };
  }
}

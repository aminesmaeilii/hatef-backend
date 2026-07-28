import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  addTicketInternalNoteSchema,
  addTicketMessageSchema,
  assignTicketSchema,
  createTicketSchema,
  ticketStatusSchema,
  transitionTicketSchema,
  type AddTicketInternalNote,
  type AddTicketMessage,
  type AssignTicket,
  type CreateTicket,
  type TicketStatusKey,
  type TransitionTicket,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { TicketsService } from "./tickets.service";

/** Admin/internal operational queue + workflow actions, including the one path allowed to write/read internal notes. */
@Controller("tickets")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class TicketsOpsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TICKET_MANAGE)
  async create(@Body(new ZodValidationPipe(createTicketSchema)) body: CreateTicket, @CurrentActor() actor: RequestActor) {
    return this.tickets.create(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TICKET_READ)
  async list(@Query("channelId") channelId?: string, @Query("status") status?: string, @Query("assigneeId") assigneeId?: string) {
    const parsedStatus = status ? ticketStatusSchema.parse(status) : undefined;
    return this.tickets.list({ channelId, status: parsedStatus as TicketStatusKey | undefined, assigneeId });
  }

  @Get(":ticketId")
  @RequirePermission(PERMISSIONS.TICKET_READ)
  async getOne(@Param("ticketId") ticketId: string) {
    return this.tickets.getAdminDetail(ticketId);
  }

  @Post(":ticketId/messages")
  @RequirePermission(PERMISSIONS.TICKET_MANAGE)
  async addMessage(
    @Param("ticketId") ticketId: string,
    @Body(new ZodValidationPipe(addTicketMessageSchema)) body: AddTicketMessage,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.addMessage(ticketId, body, actor);
  }

  @Post(":ticketId/internal-notes")
  @RequirePermission(PERMISSIONS.TICKET_MANAGE)
  async addInternalNote(
    @Param("ticketId") ticketId: string,
    @Body(new ZodValidationPipe(addTicketInternalNoteSchema)) body: AddTicketInternalNote,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.addInternalNote(ticketId, body, actor);
  }

  @Post(":ticketId/assign")
  @RequirePermission(PERMISSIONS.TICKET_MANAGE)
  async assign(
    @Param("ticketId") ticketId: string,
    @Body(new ZodValidationPipe(assignTicketSchema)) body: AssignTicket,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.assign(ticketId, body.assigneeId, actor);
  }

  @Post(":ticketId/transition")
  @RequirePermission(PERMISSIONS.TICKET_MANAGE)
  async transition(
    @Param("ticketId") ticketId: string,
    @Body(new ZodValidationPipe(transitionTicketSchema)) body: TransitionTicket,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.transition(ticketId, body.toStatus, body.note, actor);
  }
}

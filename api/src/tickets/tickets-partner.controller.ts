import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  addTicketMessageSchema,
  createTicketSchema,
  type AddTicketMessage,
  type CreateTicket,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { TicketsService } from "./tickets.service";

const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" } as const;

/** Partner-facing — same channel-nested ABAC shape as SupportRequestsController. `getDetail`/`addMessage` never surface internal notes (spec 18's own exit proof). */
@Controller("channels/:channelId/tickets")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class TicketsPartnerController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TICKET_MANAGE, CHANNEL_SCOPE)
  async create(
    @Param("channelId") channelId: string,
    @Body(new ZodValidationPipe(createTicketSchema)) body: CreateTicket,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.create(body, actor, channelId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TICKET_READ, CHANNEL_SCOPE)
  async list(@Param("channelId") channelId: string) {
    return this.tickets.list({ channelId });
  }

  @Get(":ticketId")
  @RequirePermission(PERMISSIONS.TICKET_READ, CHANNEL_SCOPE)
  async getOne(@Param("ticketId") ticketId: string) {
    return this.tickets.getDetail(ticketId);
  }

  @Post(":ticketId/messages")
  @RequirePermission(PERMISSIONS.TICKET_MANAGE, CHANNEL_SCOPE)
  async addMessage(
    @Param("ticketId") ticketId: string,
    @Body(new ZodValidationPipe(addTicketMessageSchema)) body: AddTicketMessage,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tickets.addMessage(ticketId, body, actor);
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  cancelRequestSchema,
  createSupportRequestSchema,
  respondToQuoteSchema,
  updateSupportRequestSchema,
  type CancelRequest,
  type CreateSupportRequest,
  type RespondToQuote,
  type UpdateSupportRequest,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { SupportRequestsService } from "./support-requests.service";

const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" } as const;

/** Partner-facing — channel-nested, same ABAC-scoping shape as Phase 2's FormSubmissionsController. */
@Controller("channels/:channelId/support-requests")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class SupportRequestsController {
  constructor(private readonly supportRequests: SupportRequestsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async create(
    @Param("channelId") channelId: string,
    @Body(new ZodValidationPipe(createSupportRequestSchema)) body: CreateSupportRequest,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.create(channelId, body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE)
  async listMine(@Param("channelId") channelId: string) {
    return this.supportRequests.listMine(channelId);
  }

  @Get(":requestId")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE)
  async getOne(@Param("channelId") channelId: string, @Param("requestId") requestId: string) {
    return this.supportRequests.getOne(channelId, requestId);
  }

  @Patch(":requestId")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async update(
    @Param("channelId") channelId: string,
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(updateSupportRequestSchema)) body: UpdateSupportRequest,
  ) {
    return this.supportRequests.update(channelId, requestId, body);
  }

  @Post(":requestId/submit")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async submit(@Param("channelId") channelId: string, @Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    await this.supportRequests.submit(channelId, requestId, actor);
    return { ok: true };
  }

  @Get(":requestId/progress")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE)
  async getProgress(@Param("channelId") channelId: string, @Param("requestId") requestId: string) {
    return this.supportRequests.getProgress(channelId, requestId);
  }

  @Get(":requestId/revisions")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE)
  async getRevisions(@Param("channelId") channelId: string, @Param("requestId") requestId: string) {
    return this.supportRequests.getRevisions(channelId, requestId);
  }

  @Post(":requestId/cancel-request")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async cancelRequest(
    @Param("channelId") channelId: string,
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(cancelRequestSchema)) body: CancelRequest,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.cancelRequest(channelId, requestId, body.reason, actor);
    return { ok: true };
  }

  @Post(":requestId/respond-to-quote")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async respondToQuote(
    @Param("channelId") channelId: string,
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(respondToQuoteSchema)) body: RespondToQuote,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.respondToQuote(channelId, requestId, body, actor);
    return { ok: true };
  }

  @Post(":requestId/confirm")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE)
  async confirm(@Param("channelId") channelId: string, @Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    return this.supportRequests.confirm(channelId, requestId, actor);
  }
}

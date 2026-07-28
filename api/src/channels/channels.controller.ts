import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  addMembershipSchema,
  createChannelSchema,
  type AddMembership,
  type Channel,
  type CreateChannel,
  type Membership,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { ChannelsService } from "./channels.service";

@Controller("channels")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.CHANNEL_CREATE)
  async create(
    @Body(new ZodValidationPipe(createChannelSchema)) body: CreateChannel,
    @CurrentActor() actor: RequestActor,
  ): Promise<Channel> {
    return this.channels.create(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.CHANNEL_READ)
  async listAll(): Promise<Channel[]> {
    return this.channels.listAll();
  }

  @Get(":channelId")
  @RequirePermission(PERMISSIONS.CHANNEL_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async getOne(@Param("channelId") channelId: string): Promise<Channel> {
    return this.channels.getOne(channelId);
  }

  @Get(":channelId/memberships")
  @RequirePermission(PERMISSIONS.CHANNEL_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async listMemberships(@Param("channelId") channelId: string) {
    return this.channels.listMemberships(channelId);
  }

  @Post(":channelId/memberships")
  @RequirePermission(PERMISSIONS.CHANNEL_MEMBERSHIP_MANAGE, { resourceType: "channel", resourceIdParam: "channelId" })
  async addMembership(
    @Param("channelId") channelId: string,
    @Body(new ZodValidationPipe(addMembershipSchema)) body: AddMembership,
    @CurrentActor() actor: RequestActor,
  ): Promise<Membership> {
    return this.channels.addMembership(channelId, body, actor);
  }
}

import { Injectable } from "@nestjs/common";
import type { AddMembership, Channel, CreateChannel, Membership } from "@hatef/contracts";
import { normalizeEitaaId, normalizeIranianMobile } from "@hatef/domain";
import type { Channel as PrismaChannel } from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { FilesService } from "../files/files.service";

const ONBOARDING_FORM_KEY = "channel-onboarding";
const CHANNEL_PROFILE_IMAGE_FIELD_KEY = "channel_profile_image";

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly files: FilesService,
  ) {}

  async create(input: CreateChannel, actor: RequestActor): Promise<Channel> {
    const channel = await this.prisma.channel.create({
      data: { title: input.title, eitaaId: normalizeEitaaId(input.eitaaId) },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "channel.created",
      entityType: "channel",
      entityId: channel.id,
    });

    return this.toChannelDto(channel);
  }

  async listAll(): Promise<Channel[]> {
    const channels = await this.prisma.channel.findMany({ orderBy: { createdAt: "desc" } });
    return Promise.all(channels.map((channel) => this.toChannelDto(channel)));
  }

  async getOne(channelId: string): Promise<Channel> {
    const channel = await this.prisma.channel.findUniqueOrThrow({ where: { id: channelId } });
    return this.toChannelDto(channel);
  }

  async listMemberships(channelId: string): Promise<(Membership & { userDisplayName: string })[]> {
    const memberships = await this.prisma.channelMembership.findMany({
      where: { channelId },
      include: { user: { select: { displayName: true } } },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      channelId: m.channelId,
      role: m.role,
      status: m.status,
      userDisplayName: m.user.displayName,
    }));
  }

  async addMembership(channelId: string, input: AddMembership, actor: RequestActor): Promise<Membership> {
    const mobile = normalizeIranianMobile(input.mobile);
    const role = await this.prisma.role.findUniqueOrThrow({ where: { key: input.role } });

    const contact = await this.prisma.userContact.findUnique({
      where: { type_value: { type: "MOBILE", value: mobile } },
    });
    const userId = contact
      ? contact.userId
      : (
          await this.prisma.user.create({
            data: { displayName: mobile, contacts: { create: { type: "MOBILE", value: mobile, isPrimary: true } } },
          })
        ).id;

    const [membership] = await this.prisma.$transaction([
      this.prisma.channelMembership.upsert({
        where: { userId_channelId: { userId, channelId } },
        create: { userId, channelId, role: input.role, status: "ACTIVE" },
        update: { role: input.role, status: "ACTIVE" },
      }),
      this.prisma.roleAssignment.upsert({
        where: {
          userId_roleId_resourceType_resourceId: {
            userId,
            roleId: role.id,
            resourceType: "channel",
            resourceId: channelId,
          },
        },
        create: { userId, roleId: role.id, resourceType: "channel", resourceId: channelId },
        update: {},
      }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "channel.membership.added",
      entityType: "channel",
      entityId: channelId,
      metadata: { userId, role: input.role },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      channelId: membership.channelId,
      role: membership.role,
      status: membership.status,
    };
  }
  private async toChannelDto(channel: PrismaChannel): Promise<Channel> {
    return {
      id: channel.id,
      title: channel.title,
      eitaaId: channel.eitaaId,
      status: channel.status,
      createdAt: channel.createdAt.toISOString(),
      profileImageUrl: await this.getProfileImageUrl(channel.id),
    };
  }

  private async getProfileImageUrl(channelId: string): Promise<string | null> {
    const answer = await this.prisma.formAnswer.findFirst({
      where: {
        formSubmission: { channelId, formVersion: { form: { key: ONBOARDING_FORM_KEY } } },
        formField: { key: CHANNEL_PROFILE_IMAGE_FIELD_KEY },
      },
      orderBy: { updatedAt: "desc" },
    });
    const fileId = (answer?.value as { fileId?: unknown } | null)?.fileId;
    if (typeof fileId !== "string") return null;

    try {
      return await this.files.getCleanDownloadUrl(channelId, fileId);
    } catch {
      return null;
    }
  }
}

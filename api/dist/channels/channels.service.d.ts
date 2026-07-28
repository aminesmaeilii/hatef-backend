import type { AddMembership, Channel, CreateChannel, Membership } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
export declare class ChannelsService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    create(input: CreateChannel, actor: RequestActor): Promise<Channel>;
    listAll(): Promise<Channel[]>;
    getOne(channelId: string): Promise<Channel>;
    listMemberships(channelId: string): Promise<(Membership & {
        userDisplayName: string;
    })[]>;
    addMembership(channelId: string, input: AddMembership, actor: RequestActor): Promise<Membership>;
}
//# sourceMappingURL=channels.service.d.ts.map
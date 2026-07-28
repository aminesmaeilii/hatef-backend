import { type AddMembership, type Channel, type CreateChannel, type Membership } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { ChannelsService } from "./channels.service";
export declare class ChannelsController {
    private readonly channels;
    constructor(channels: ChannelsService);
    create(body: CreateChannel, actor: RequestActor): Promise<Channel>;
    listAll(): Promise<Channel[]>;
    getOne(channelId: string): Promise<Channel>;
    listMemberships(channelId: string): Promise<({
        id: string;
        userId: string;
        channelId: string;
        role: "CHANNEL_OWNER" | "CHANNEL_ADMIN" | "CHANNEL_FINANCE_VIEWER" | "CHANNEL_TEAM_MEMBER";
        status: "ACTIVE" | "REVOKED";
    } & {
        userDisplayName: string;
    })[]>;
    addMembership(channelId: string, body: AddMembership, actor: RequestActor): Promise<Membership>;
}
//# sourceMappingURL=channels.controller.d.ts.map
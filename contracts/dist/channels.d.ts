import { z } from "zod";
export declare const channelSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    eitaaId: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
    }>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Channel = z.infer<typeof channelSchema>;
export declare const createChannelSchema: z.ZodObject<{
    title: z.ZodString;
    eitaaId: z.ZodString;
}, z.core.$strip>;
export type CreateChannel = z.infer<typeof createChannelSchema>;
export declare const channelRoleSchema: z.ZodEnum<{
    CHANNEL_OWNER: "CHANNEL_OWNER";
    CHANNEL_ADMIN: "CHANNEL_ADMIN";
    CHANNEL_FINANCE_VIEWER: "CHANNEL_FINANCE_VIEWER";
    CHANNEL_TEAM_MEMBER: "CHANNEL_TEAM_MEMBER";
}>;
export type ChannelRoleKey = z.infer<typeof channelRoleSchema>;
export declare const membershipSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    channelId: z.ZodString;
    role: z.ZodEnum<{
        CHANNEL_OWNER: "CHANNEL_OWNER";
        CHANNEL_ADMIN: "CHANNEL_ADMIN";
        CHANNEL_FINANCE_VIEWER: "CHANNEL_FINANCE_VIEWER";
        CHANNEL_TEAM_MEMBER: "CHANNEL_TEAM_MEMBER";
    }>;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        REVOKED: "REVOKED";
    }>;
}, z.core.$strip>;
export type Membership = z.infer<typeof membershipSchema>;
export declare const addMembershipSchema: z.ZodObject<{
    mobile: z.ZodString;
    role: z.ZodEnum<{
        CHANNEL_OWNER: "CHANNEL_OWNER";
        CHANNEL_ADMIN: "CHANNEL_ADMIN";
        CHANNEL_FINANCE_VIEWER: "CHANNEL_FINANCE_VIEWER";
        CHANNEL_TEAM_MEMBER: "CHANNEL_TEAM_MEMBER";
    }>;
}, z.core.$strip>;
export type AddMembership = z.infer<typeof addMembershipSchema>;
//# sourceMappingURL=channels.d.ts.map
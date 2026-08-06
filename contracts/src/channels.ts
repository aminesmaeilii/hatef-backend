import { z } from "zod";

export const channelSchema = z.object({
  id: z.string(),
  title: z.string(),
  eitaaId: z.string(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
  createdAt: z.iso.datetime(),
  profileImageUrl: z.string().nullable(),
});
export type Channel = z.infer<typeof channelSchema>;

export const createChannelSchema = z.object({
  title: z.string().min(1),
  eitaaId: z.string().min(1),
});
export type CreateChannel = z.infer<typeof createChannelSchema>;

export const channelRoleSchema = z.enum([
  "CHANNEL_OWNER",
  "CHANNEL_ADMIN",
  "CHANNEL_FINANCE_VIEWER",
  "CHANNEL_TEAM_MEMBER",
]);
export type ChannelRoleKey = z.infer<typeof channelRoleSchema>;

export const membershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  channelId: z.string(),
  role: channelRoleSchema,
  status: z.enum(["ACTIVE", "REVOKED"]),
});
export type Membership = z.infer<typeof membershipSchema>;

export const addMembershipSchema = z.object({
  mobile: z.string().min(1),
  role: channelRoleSchema,
});
export type AddMembership = z.infer<typeof addMembershipSchema>;

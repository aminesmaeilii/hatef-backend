"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMembershipSchema = exports.membershipSchema = exports.channelRoleSchema = exports.createChannelSchema = exports.channelSchema = void 0;
const zod_1 = require("zod");
exports.channelSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    eitaaId: zod_1.z.string(),
    status: zod_1.z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
    createdAt: zod_1.z.iso.datetime(),
});
exports.createChannelSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    eitaaId: zod_1.z.string().min(1),
});
exports.channelRoleSchema = zod_1.z.enum([
    "CHANNEL_OWNER",
    "CHANNEL_ADMIN",
    "CHANNEL_FINANCE_VIEWER",
    "CHANNEL_TEAM_MEMBER",
]);
exports.membershipSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    channelId: zod_1.z.string(),
    role: exports.channelRoleSchema,
    status: zod_1.z.enum(["ACTIVE", "REVOKED"]),
});
exports.addMembershipSchema = zod_1.z.object({
    mobile: zod_1.z.string().min(1),
    role: exports.channelRoleSchema,
});

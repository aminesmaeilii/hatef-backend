"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meResponseSchema = exports.workspaceContextSchema = exports.sessionListItemSchema = exports.stepUpSchema = exports.mfaEnrollConfirmResponseSchema = exports.mfaEnrollConfirmSchema = exports.mfaEnrollResponseSchema = exports.mfaVerifySchema = exports.internalLoginResponseSchema = exports.internalLoginSchema = exports.authSessionResponseSchema = exports.sessionUserSchema = exports.otpVerifySchema = exports.otpRequestResponseSchema = exports.otpRequestSchema = void 0;
const zod_1 = require("zod");
exports.otpRequestSchema = zod_1.z.object({
    mobile: zod_1.z.string().min(1),
});
exports.otpRequestResponseSchema = zod_1.z.object({
    resendAvailableInSeconds: zod_1.z.number().int().nonnegative(),
    // Only ever populated outside production — lets local/dev/test automation
    // complete the OTP flow without scraping the dev SMS provider's console log.
    devCode: zod_1.z.string().optional(),
});
exports.otpVerifySchema = zod_1.z.object({
    mobile: zod_1.z.string().min(1),
    code: zod_1.z.string().min(4).max(8),
});
exports.sessionUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    displayName: zod_1.z.string(),
    email: zod_1.z.string().nullable(),
});
exports.authSessionResponseSchema = zod_1.z.object({
    user: exports.sessionUserSchema,
    csrfToken: zod_1.z.string(),
});
exports.internalLoginSchema = zod_1.z.object({
    mobile: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.internalLoginResponseSchema = zod_1.z.discriminatedUnion("status", [
    zod_1.z.object({ status: zod_1.z.literal("mfa_required"), mfaToken: zod_1.z.string() }),
    zod_1.z.object({ status: zod_1.z.literal("ok"), user: exports.sessionUserSchema, csrfToken: zod_1.z.string() }),
]);
exports.mfaVerifySchema = zod_1.z.object({
    mfaToken: zod_1.z.string().min(1),
    code: zod_1.z.string().min(4).max(24),
});
exports.mfaEnrollResponseSchema = zod_1.z.object({
    secret: zod_1.z.string(),
    otpAuthUri: zod_1.z.string(),
    qrCodeDataUrl: zod_1.z.string(),
});
exports.mfaEnrollConfirmSchema = zod_1.z.object({
    code: zod_1.z.string().min(6).max(6),
});
exports.mfaEnrollConfirmResponseSchema = zod_1.z.object({
    recoveryCodes: zod_1.z.array(zod_1.z.string()),
});
exports.stepUpSchema = zod_1.z.object({
    password: zod_1.z.string().optional(),
    code: zod_1.z.string().optional(),
});
exports.sessionListItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userAgent: zod_1.z.string().nullable(),
    ipAddress: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    lastSeenAt: zod_1.z.iso.datetime(),
    expiresAt: zod_1.z.iso.datetime(),
    current: zod_1.z.boolean(),
});
exports.workspaceContextSchema = zod_1.z.object({
    type: zod_1.z.enum(["internal", "channel"]),
    label: zod_1.z.string(),
    channelId: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
});
exports.meResponseSchema = zod_1.z.object({
    user: exports.sessionUserSchema,
    contexts: zod_1.z.array(exports.workspaceContextSchema),
});

import { z } from "zod";

export const otpRequestSchema = z.object({
  mobile: z.string().min(1),
});
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpRequestResponseSchema = z.object({
  resendAvailableInSeconds: z.number().int().nonnegative(),
  // Only ever populated outside production — lets local/dev/test automation
  // complete the OTP flow without scraping the dev SMS provider's console log.
  devCode: z.string().optional(),
});
export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

export const otpVerifySchema = z.object({
  mobile: z.string().min(1),
  code: z.string().min(4).max(8),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const authSessionResponseSchema = z.object({
  user: sessionUserSchema,
  csrfToken: z.string(),
});
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;

export const internalLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type InternalLogin = z.infer<typeof internalLoginSchema>;

export const adminCodeLoginSchema = z.object({
  code: z.string().min(4).max(64),
});
export type AdminCodeLogin = z.infer<typeof adminCodeLoginSchema>;

export const internalLoginResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("mfa_required"), mfaToken: z.string() }),
  z.object({ status: z.literal("ok"), user: sessionUserSchema, csrfToken: z.string() }),
]);
export type InternalLoginResponse = z.infer<typeof internalLoginResponseSchema>;

export const partnerTrackingLoginSchema = z.object({
  trackingCode: z.string().min(1).max(128),
});
export type PartnerTrackingLogin = z.infer<typeof partnerTrackingLoginSchema>;

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().min(4).max(24),
});
export type MfaVerify = z.infer<typeof mfaVerifySchema>;

export const mfaEnrollResponseSchema = z.object({
  secret: z.string(),
  otpAuthUri: z.string(),
  qrCodeDataUrl: z.string(),
});
export type MfaEnrollResponse = z.infer<typeof mfaEnrollResponseSchema>;

export const mfaEnrollConfirmSchema = z.object({
  code: z.string().min(6).max(6),
});
export type MfaEnrollConfirm = z.infer<typeof mfaEnrollConfirmSchema>;

export const mfaEnrollConfirmResponseSchema = z.object({
  recoveryCodes: z.array(z.string()),
});
export type MfaEnrollConfirmResponse = z.infer<typeof mfaEnrollConfirmResponseSchema>;

export const stepUpSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});
export type StepUp = z.infer<typeof stepUpSchema>;

export const sessionListItemSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  current: z.boolean(),
});
export type SessionListItem = z.infer<typeof sessionListItemSchema>;

export const workspaceContextSchema = z.object({
  type: z.enum(["internal", "channel"]),
  label: z.string(),
  channelId: z.string().optional(),
  role: z.string().optional(),
});
export type WorkspaceContext = z.infer<typeof workspaceContextSchema>;

export const meResponseSchema = z.object({
  user: sessionUserSchema,
  contexts: z.array(workspaceContextSchema),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

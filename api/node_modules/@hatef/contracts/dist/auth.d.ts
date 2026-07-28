import { z } from "zod";
export declare const otpRequestSchema: z.ZodObject<{
    mobile: z.ZodString;
}, z.core.$strip>;
export type OtpRequest = z.infer<typeof otpRequestSchema>;
export declare const otpRequestResponseSchema: z.ZodObject<{
    resendAvailableInSeconds: z.ZodNumber;
    devCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;
export declare const otpVerifySchema: z.ZodObject<{
    mobile: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export type OtpVerify = z.infer<typeof otpVerifySchema>;
export declare const sessionUserSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export declare const authSessionResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    csrfToken: z.ZodString;
}, z.core.$strip>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export declare const internalLoginSchema: z.ZodObject<{
    mobile: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type InternalLogin = z.infer<typeof internalLoginSchema>;
export declare const internalLoginResponseSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    status: z.ZodLiteral<"mfa_required">;
    mfaToken: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    status: z.ZodLiteral<"ok">;
    user: z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    csrfToken: z.ZodString;
}, z.core.$strip>], "status">;
export type InternalLoginResponse = z.infer<typeof internalLoginResponseSchema>;
export declare const mfaVerifySchema: z.ZodObject<{
    mfaToken: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export type MfaVerify = z.infer<typeof mfaVerifySchema>;
export declare const mfaEnrollResponseSchema: z.ZodObject<{
    secret: z.ZodString;
    otpAuthUri: z.ZodString;
    qrCodeDataUrl: z.ZodString;
}, z.core.$strip>;
export type MfaEnrollResponse = z.infer<typeof mfaEnrollResponseSchema>;
export declare const mfaEnrollConfirmSchema: z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>;
export type MfaEnrollConfirm = z.infer<typeof mfaEnrollConfirmSchema>;
export declare const mfaEnrollConfirmResponseSchema: z.ZodObject<{
    recoveryCodes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type MfaEnrollConfirmResponse = z.infer<typeof mfaEnrollConfirmResponseSchema>;
export declare const stepUpSchema: z.ZodObject<{
    password: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type StepUp = z.infer<typeof stepUpSchema>;
export declare const sessionListItemSchema: z.ZodObject<{
    id: z.ZodString;
    userAgent: z.ZodNullable<z.ZodString>;
    ipAddress: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    lastSeenAt: z.ZodISODateTime;
    expiresAt: z.ZodISODateTime;
    current: z.ZodBoolean;
}, z.core.$strip>;
export type SessionListItem = z.infer<typeof sessionListItemSchema>;
export declare const workspaceContextSchema: z.ZodObject<{
    type: z.ZodEnum<{
        internal: "internal";
        channel: "channel";
    }>;
    label: z.ZodString;
    channelId: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type WorkspaceContext = z.infer<typeof workspaceContextSchema>;
export declare const meResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    contexts: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            internal: "internal";
            channel: "channel";
        }>;
        label: z.ZodString;
        channelId: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MeResponse = z.infer<typeof meResponseSchema>;
//# sourceMappingURL=auth.d.ts.map
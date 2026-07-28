import type { Env } from "@hatef/config";
export interface SendSmsParams {
    mobile: string;
    templateId: string;
    params: Record<string, string>;
}
export interface SendSmsResult {
    providerMessageId: string;
}
/**
 * The worker process has no Nest DI container, so it can't reuse
 * backend/api's SmsModule directly — this mirrors that module's dev/live
 * provider logic exactly (same env vars, same ملی‌پیامک webservice shape as
 * backend/api/src/sms/live-sms.provider.ts) as a plain function instead.
 * Never logs the message body, only the template id, same discipline as
 * DevSmsProvider/LiveSmsProvider.
 */
export declare function sendSms(env: Env, params: SendSmsParams): Promise<SendSmsResult>;
//# sourceMappingURL=sms-sender.d.ts.map
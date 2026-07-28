import type { SendSmsParams, SendSmsResult, SmsProvider } from "./sms-provider.interface";
/**
 * Local-development provider. Writes straight to stdout via `console.log`,
 * deliberately bypassing the pino/observability logger (and therefore the
 * audit log) so OTP codes never enter structured logs or the audit trail —
 * this is a developer convenience channel, not application telemetry.
 */
export declare class DevSmsProvider implements SmsProvider {
    send(params: SendSmsParams): Promise<SendSmsResult>;
}
//# sourceMappingURL=dev-sms.provider.d.ts.map
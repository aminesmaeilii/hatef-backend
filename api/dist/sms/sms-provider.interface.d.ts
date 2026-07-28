export interface SendSmsParams {
    mobile: string;
    templateId: string;
    params: Record<string, string>;
}
export interface SendSmsResult {
    providerMessageId: string;
}
export declare const SMS_PROVIDER: unique symbol;
export interface SmsProvider {
    send(params: SendSmsParams): Promise<SendSmsResult>;
}
//# sourceMappingURL=sms-provider.interface.d.ts.map
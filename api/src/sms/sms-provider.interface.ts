export interface SendSmsParams {
  mobile: string;
  templateId: string;
  params: Record<string, string>;
}

export interface SendSmsResult {
  providerMessageId: string;
}

export const SMS_PROVIDER = Symbol("SMS_PROVIDER");

export interface SmsProvider {
  send(params: SendSmsParams): Promise<SendSmsResult>;
}

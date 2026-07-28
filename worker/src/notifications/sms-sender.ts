import { randomUUID } from "node:crypto";
import type { Env } from "@hatef/config";

export interface SendSmsParams {
  mobile: string;
  templateId: string;
  params: Record<string, string>;
}

export interface SendSmsResult {
  providerMessageId: string;
}

const MELIPAYAMAK_SEND_URL = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
const MELIPAYAMAK_OTP_URL = "https://rest.payamak-panel.com/api/SendSMS/SendOtp";

interface MelipayamakSendResponse {
  Value: string;
  RetStatus: number;
  StrRetStatus: string;
}

/**
 * The worker process has no Nest DI container, so it can't reuse
 * backend/api's SmsModule directly — this mirrors that module's dev/live
 * provider logic exactly (same env vars, same ملی‌پیامک webservice shape as
 * backend/api/src/sms/live-sms.provider.ts) as a plain function instead.
 * Never logs the message body, only the template id, same discipline as
 * DevSmsProvider/LiveSmsProvider.
 */
export async function sendSms(env: Env, params: SendSmsParams): Promise<SendSmsResult> {
  if (env.SMS_PROVIDER !== "live" || !env.FEATURE_SMS_PROVIDER_LIVE) {
    const providerMessageId = `dev_${randomUUID()}`;
    console.log(`[dev-sms] template=${params.templateId} to=${params.mobile} params=${JSON.stringify(params.params)}`);
    return { providerMessageId };
  }

  const password = env.SMS_PROVIDER_API_KEY || env.SMS_PROVIDER_PASSWORD;
  if (!env.SMS_PROVIDER_USERNAME || !password || !env.SMS_PROVIDER_SENDER) {
    throw new Error("SMS_PROVIDER_USERNAME/API_KEY_OR_PASSWORD/SENDER is not configured for the live SMS provider");
  }

  try {
    return await dispatch(params, env.SMS_PROVIDER_USERNAME, password, env.SMS_PROVIDER_SENDER);
  } catch {
    return dispatch(params, env.SMS_PROVIDER_USERNAME, password, env.SMS_PROVIDER_SENDER);
  }
}

async function dispatch(
  params: SendSmsParams,
  username: string,
  password: string,
  sender: string,
): Promise<SendSmsResult> {
  if (params.params.code) {
    return dispatchOtp(params, username, password, sender);
  }

  const response = await fetch(MELIPAYAMAK_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      to: params.mobile,
      from: sender,
      text: params.params.body ?? params.params.code ?? Object.values(params.params).join(" "),
      isflash: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`SMS provider responded with HTTP ${response.status}`);
  }
  const body = (await response.json()) as MelipayamakSendResponse;
  if (body.RetStatus !== 1) {
    throw new Error(`SMS provider rejected the message (${body.StrRetStatus ?? body.RetStatus})`);
  }
  return { providerMessageId: body.Value };
}

async function dispatchOtp(
  params: SendSmsParams,
  username: string,
  password: string,
  sender: string,
): Promise<SendSmsResult> {
  const code = params.params.code;
  if (!code) {
    throw new Error("OTP code is required for the live SMS OTP provider");
  }

  const response = await fetch(MELIPAYAMAK_OTP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username,
      password,
      to: params.mobile,
      from: sender,
      code,
    }),
  });
  if (!response.ok) {
    throw new Error(`SMS provider responded with HTTP ${response.status}`);
  }
  const providerMessageId = (await response.text()).trim().replace(/^"|"$/g, "");
  if (!/^\d+$/.test(providerMessageId)) {
    throw new Error(`SMS provider rejected the OTP message (${providerMessageId})`);
  }
  return { providerMessageId };
}

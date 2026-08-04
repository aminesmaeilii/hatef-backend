import { Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import type { SendSmsParams, SendSmsResult, SmsProvider } from "./sms-provider.interface";

const MELIPAYAMAK_SEND_URL = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
const MELIPAYAMAK_BASE_SERVICE_URL = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";

interface MelipayamakSendResponse {
  Value: string;
  RetStatus: number;
  StrRetStatus: string;
}

/**
 * ملی‌پیامک (melipayamak.com) webservice adapter. Structure only — no
 * account exists yet, so SMS_PROVIDER_USERNAME/PASSWORD/SENDER are blank and
 * SmsModule keeps DevSmsProvider wired in until FEATURE_SMS_PROVIDER_LIVE is
 * turned on with real credentials. RetStatus 1 means delivered to the
 * gateway queue; any other value is treated as a failure (see their API
 * docs' status-code table) and retried once before giving up. Never logs
 * the message text itself, only the template id and provider response.
 */
@Injectable()
export class LiveSmsProvider implements SmsProvider {
  private readonly logger = new Logger(LiveSmsProvider.name);

  constructor(private readonly config: AppConfigService) {}

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    const {
      SMS_PROVIDER_API_KEY,
      SMS_PROVIDER_USERNAME,
      SMS_PROVIDER_PASSWORD,
      SMS_PROVIDER_SENDER,
      SMS_TEMPLATE_OTP_ID,
    } = this.config.env;
    const password = SMS_PROVIDER_API_KEY || SMS_PROVIDER_PASSWORD;
    if (!SMS_PROVIDER_USERNAME || !password || !SMS_PROVIDER_SENDER) {
      throw new Error("SMS_PROVIDER_USERNAME/API_KEY_OR_PASSWORD/SENDER is not configured for the live SMS provider");
    }

    try {
      return await this.dispatch(params, SMS_PROVIDER_USERNAME, password, SMS_PROVIDER_SENDER, SMS_TEMPLATE_OTP_ID);
    } catch {
      this.logger.warn(`Live SMS dispatch failed, retrying once (template=${params.templateId})`);
      return this.dispatch(params, SMS_PROVIDER_USERNAME, password, SMS_PROVIDER_SENDER, SMS_TEMPLATE_OTP_ID);
    }
  }

  private async dispatch(
    params: SendSmsParams,
    username: string,
    password: string,
    sender: string,
    otpBodyId: string,
  ): Promise<SendSmsResult> {
    if (params.params.code) {
      return dispatchOtp(params, username, password, sender, otpBodyId);
    }

    const response = await fetch(MELIPAYAMAK_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams({
        username,
        password,
        to: params.mobile,
        from: sender,
        text: renderTemplate(params),
        isFlash: "false",
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
}

/** Notification-driven sends already carry ready-to-show text in `params.body`; OTP is the one templateId with no such field. */
function renderTemplate(params: SendSmsParams): string {
  return params.params.body ?? params.params.code ?? Object.values(params.params).join(" ");
}

async function dispatchOtp(
  params: SendSmsParams,
  username: string,
  password: string,
  sender: string,
  otpBodyId: string,
): Promise<SendSmsResult> {
  const code = params.params.code;
  if (!code) {
    throw new Error("OTP code is required for the live SMS OTP provider");
  }

  if (otpBodyId) {
    return dispatchBaseServiceOtp(params.mobile, code, username, password, otpBodyId);
  }

  const response = await fetch(MELIPAYAMAK_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({
      username,
      password,
      to: params.mobile,
      from: sender,
      text: code,
      isFlash: "false",
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

async function dispatchBaseServiceOtp(
  mobile: string,
  code: string,
  username: string,
  password: string,
  bodyId: string,
): Promise<SendSmsResult> {
  const response = await fetch(MELIPAYAMAK_BASE_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({
      username,
      password,
      text: code,
      to: mobile,
      bodyId,
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

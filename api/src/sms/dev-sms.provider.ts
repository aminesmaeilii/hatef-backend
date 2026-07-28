import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { SendSmsParams, SendSmsResult, SmsProvider } from "./sms-provider.interface";

/**
 * Local-development provider. Writes straight to stdout via `console.log`,
 * deliberately bypassing the pino/observability logger (and therefore the
 * audit log) so OTP codes never enter structured logs or the audit trail —
 * this is a developer convenience channel, not application telemetry.
 */
@Injectable()
export class DevSmsProvider implements SmsProvider {
  async send(params: SendSmsParams): Promise<SendSmsResult> {
    const providerMessageId = `dev_${randomUUID()}`;
    console.log(
      `[dev-sms] template=${params.templateId} to=${params.mobile} params=${JSON.stringify(params.params)}`,
    );
    return { providerMessageId };
  }
}

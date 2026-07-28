import { AppConfigService } from "../config/app-config.service";
import type { SendSmsParams, SendSmsResult, SmsProvider } from "./sms-provider.interface";
/**
 * ملی‌پیامک (melipayamak.com) webservice adapter. Structure only — no
 * account exists yet, so SMS_PROVIDER_USERNAME/PASSWORD/SENDER are blank and
 * SmsModule keeps DevSmsProvider wired in until FEATURE_SMS_PROVIDER_LIVE is
 * turned on with real credentials. RetStatus 1 means delivered to the
 * gateway queue; any other value is treated as a failure (see their API
 * docs' status-code table) and retried once before giving up. Never logs
 * the message text itself, only the template id and provider response.
 */
export declare class LiveSmsProvider implements SmsProvider {
    private readonly config;
    private readonly logger;
    constructor(config: AppConfigService);
    send(params: SendSmsParams): Promise<SendSmsResult>;
    private dispatch;
}
//# sourceMappingURL=live-sms.provider.d.ts.map
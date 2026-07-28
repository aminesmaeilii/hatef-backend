"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
const node_crypto_1 = require("node:crypto");
const MELIPAYAMAK_SEND_URL = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
/**
 * The worker process has no Nest DI container, so it can't reuse
 * backend/api's SmsModule directly — this mirrors that module's dev/live
 * provider logic exactly (same env vars, same ملی‌پیامک webservice shape as
 * backend/api/src/sms/live-sms.provider.ts) as a plain function instead.
 * Never logs the message body, only the template id, same discipline as
 * DevSmsProvider/LiveSmsProvider.
 */
async function sendSms(env, params) {
    if (env.SMS_PROVIDER !== "live" || !env.FEATURE_SMS_PROVIDER_LIVE) {
        const providerMessageId = `dev_${(0, node_crypto_1.randomUUID)()}`;
        console.log(`[dev-sms] template=${params.templateId} to=${params.mobile} params=${JSON.stringify(params.params)}`);
        return { providerMessageId };
    }
    if (!env.SMS_PROVIDER_USERNAME || !env.SMS_PROVIDER_PASSWORD || !env.SMS_PROVIDER_SENDER) {
        throw new Error("SMS_PROVIDER_USERNAME/PASSWORD/SENDER is not configured for the live SMS provider");
    }
    try {
        return await dispatch(params, env.SMS_PROVIDER_USERNAME, env.SMS_PROVIDER_PASSWORD, env.SMS_PROVIDER_SENDER);
    }
    catch {
        return dispatch(params, env.SMS_PROVIDER_USERNAME, env.SMS_PROVIDER_PASSWORD, env.SMS_PROVIDER_SENDER);
    }
}
async function dispatch(params, username, password, sender) {
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
    const body = (await response.json());
    if (body.RetStatus !== 1) {
        throw new Error(`SMS provider rejected the message (${body.StrRetStatus ?? body.RetStatus})`);
    }
    return { providerMessageId: body.Value };
}

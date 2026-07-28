"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LiveSmsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSmsProvider = void 0;
const common_1 = require("@nestjs/common");
const app_config_service_1 = require("../config/app-config.service");
const MELIPAYAMAK_SEND_URL = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
const MELIPAYAMAK_OTP_URL = "https://rest.payamak-panel.com/api/SendSMS/SendOtp";
/**
 * ملی‌پیامک (melipayamak.com) webservice adapter. Structure only — no
 * account exists yet, so SMS_PROVIDER_USERNAME/PASSWORD/SENDER are blank and
 * SmsModule keeps DevSmsProvider wired in until FEATURE_SMS_PROVIDER_LIVE is
 * turned on with real credentials. RetStatus 1 means delivered to the
 * gateway queue; any other value is treated as a failure (see their API
 * docs' status-code table) and retried once before giving up. Never logs
 * the message text itself, only the template id and provider response.
 */
let LiveSmsProvider = LiveSmsProvider_1 = class LiveSmsProvider {
    config;
    logger = new common_1.Logger(LiveSmsProvider_1.name);
    constructor(config) {
        this.config = config;
    }
    async send(params) {
        const { SMS_PROVIDER_API_KEY, SMS_PROVIDER_USERNAME, SMS_PROVIDER_PASSWORD, SMS_PROVIDER_SENDER } = this.config.env;
        const password = SMS_PROVIDER_API_KEY || SMS_PROVIDER_PASSWORD;
        if (!SMS_PROVIDER_USERNAME || !password || !SMS_PROVIDER_SENDER) {
            throw new Error("SMS_PROVIDER_USERNAME/API_KEY_OR_PASSWORD/SENDER is not configured for the live SMS provider");
        }
        try {
            return await this.dispatch(params, SMS_PROVIDER_USERNAME, password, SMS_PROVIDER_SENDER);
        }
        catch {
            this.logger.warn(`Live SMS dispatch failed, retrying once (template=${params.templateId})`);
            return this.dispatch(params, SMS_PROVIDER_USERNAME, password, SMS_PROVIDER_SENDER);
        }
    }
    async dispatch(params, username, password, sender) {
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
                text: renderTemplate(params),
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
};
exports.LiveSmsProvider = LiveSmsProvider;
exports.LiveSmsProvider = LiveSmsProvider = LiveSmsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_config_service_1.AppConfigService])
], LiveSmsProvider);
/** Notification-driven sends already carry ready-to-show text in `params.body`; OTP is the one templateId with no such field. */
function renderTemplate(params) {
    return params.params.body ?? params.params.code ?? Object.values(params.params).join(" ");
}
async function dispatchOtp(params, username, password, sender) {
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

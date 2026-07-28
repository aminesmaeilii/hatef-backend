"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevSmsProvider = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
/**
 * Local-development provider. Writes straight to stdout via `console.log`,
 * deliberately bypassing the pino/observability logger (and therefore the
 * audit log) so OTP codes never enter structured logs or the audit trail —
 * this is a developer convenience channel, not application telemetry.
 */
let DevSmsProvider = class DevSmsProvider {
    async send(params) {
        const providerMessageId = `dev_${(0, node_crypto_1.randomUUID)()}`;
        console.log(`[dev-sms] template=${params.templateId} to=${params.mobile} params=${JSON.stringify(params.params)}`);
        return { providerMessageId };
    }
};
exports.DevSmsProvider = DevSmsProvider;
exports.DevSmsProvider = DevSmsProvider = __decorate([
    (0, common_1.Injectable)()
], DevSmsProvider);

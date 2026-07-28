"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsModule = void 0;
const common_1 = require("@nestjs/common");
const app_config_service_1 = require("../config/app-config.service");
const sms_provider_interface_1 = require("./sms-provider.interface");
const dev_sms_provider_1 = require("./dev-sms.provider");
const live_sms_provider_1 = require("./live-sms.provider");
// AppConfigService is provided by the @Global() AppConfigModule imported
// once in AppModule.
let SmsModule = class SmsModule {
};
exports.SmsModule = SmsModule;
exports.SmsModule = SmsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            dev_sms_provider_1.DevSmsProvider,
            live_sms_provider_1.LiveSmsProvider,
            {
                provide: sms_provider_interface_1.SMS_PROVIDER,
                useFactory: (config, dev, live) => config.env.SMS_PROVIDER === "live" && config.env.FEATURE_SMS_PROVIDER_LIVE ? live : dev,
                inject: [app_config_service_1.AppConfigService, dev_sms_provider_1.DevSmsProvider, live_sms_provider_1.LiveSmsProvider],
            },
        ],
        exports: [sms_provider_interface_1.SMS_PROVIDER],
    })
], SmsModule);

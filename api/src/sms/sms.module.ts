import { Module } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { SMS_PROVIDER } from "./sms-provider.interface";
import { DevSmsProvider } from "./dev-sms.provider";
import { LiveSmsProvider } from "./live-sms.provider";

// AppConfigService is provided by the @Global() AppConfigModule imported
// once in AppModule.
@Module({
  providers: [
    DevSmsProvider,
    LiveSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (config: AppConfigService, dev: DevSmsProvider, live: LiveSmsProvider) =>
        config.env.SMS_PROVIDER === "live" && config.env.FEATURE_SMS_PROVIDER_LIVE ? live : dev,
      inject: [AppConfigService, DevSmsProvider, LiveSmsProvider],
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}

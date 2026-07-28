import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { SessionAuthGuard } from "./session-auth.guard";

// PrismaService/AppConfigService are provided by @Global() modules imported
// once in AppModule — no need to re-import PrismaModule/AppConfigModule here.
@Module({
  providers: [SessionService, SessionAuthGuard],
  exports: [SessionService, SessionAuthGuard],
})
export class SessionModule {}

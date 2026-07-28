import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { LedgerModule } from "../ledger/ledger.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";
import { SettlementsService } from "./settlements.service";
import { SettlementsController, ChannelSettlementsController } from "./settlements.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, LedgerModule, NotificationsModule, AuthModule],
  controllers: [SettlementsController, ChannelSettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}

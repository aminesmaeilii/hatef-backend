import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TicketsService } from "./tickets.service";
import { TicketsOpsController } from "./tickets-ops.controller";
import { TicketsPartnerController } from "./tickets-partner.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, NotificationsModule],
  controllers: [TicketsOpsController, TicketsPartnerController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}

import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { CalendarService } from "./calendar.service";
import { CalendarController } from "./calendar.controller";
import { CapacityResourcesController } from "./capacity-resources.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule],
  controllers: [CalendarController, CapacityResourcesController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

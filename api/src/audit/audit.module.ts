import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditLogService } from "./audit-log.service";
import { AuditLogController } from "./audit-log.controller";

@Module({
  imports: [SessionModule, RbacModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}

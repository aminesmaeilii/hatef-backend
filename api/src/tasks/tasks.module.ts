import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

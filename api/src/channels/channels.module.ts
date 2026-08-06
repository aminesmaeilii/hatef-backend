import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { FilesModule } from "../files/files.module";
import { ChannelsService } from "./channels.service";
import { ChannelsController } from "./channels.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, FilesModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}

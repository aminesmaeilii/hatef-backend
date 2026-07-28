import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { NotificationsService } from "./notifications.service";
import { NotificationsController, NotificationTemplatesController } from "./notifications.controller";

@Module({
  imports: [SessionModule, RbacModule],
  controllers: [NotificationsController, NotificationTemplatesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

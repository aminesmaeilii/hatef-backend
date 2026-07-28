import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { LedgerModule } from "../ledger/ledger.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";
import { PromotionTypesService } from "./promotion-types.service";
import { PromotionTypesController } from "./promotion-types.controller";
import { PublishedPromotionTypesController } from "./published-promotion-types.controller";
import { SupportRequestsService } from "./support-requests.service";
import { SupportRequestsController } from "./support-requests.controller";
import { SupportRequestOpsController } from "./support-request-ops.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, LedgerModule, NotificationsModule, AuthModule],
  controllers: [
    PromotionTypesController,
    PublishedPromotionTypesController,
    SupportRequestsController,
    SupportRequestOpsController,
  ],
  providers: [PromotionTypesService, SupportRequestsService],
  exports: [SupportRequestsService],
})
export class PromotionsModule {}

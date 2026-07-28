import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { LedgerModule } from "../ledger/ledger.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ServiceCatalogService } from "./service-catalog.service";
import { ServiceCatalogController } from "./service-catalog.controller";
import { ObligationsService } from "./obligations.service";
import { ObligationsOpsController } from "./obligations-ops.controller";
import { ObligationsPartnerController, RateCardPartnerController, RateCardOpsController } from "./obligations-partner.controller";
import { RateCardsService } from "./rate-cards.service";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, LedgerModule, NotificationsModule],
  controllers: [
    ServiceCatalogController,
    ObligationsOpsController,
    ObligationsPartnerController,
    RateCardPartnerController,
    RateCardOpsController,
  ],
  providers: [ServiceCatalogService, ObligationsService, RateCardsService],
  exports: [ServiceCatalogService, ObligationsService, RateCardsService],
})
export class BarterModule {}

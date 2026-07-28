import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { LedgerService } from "./ledger.service";
import { FinancialApprovalService } from "./financial-approval.service";
import { LedgerController, ChannelLedgerController } from "./ledger.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule],
  controllers: [LedgerController, ChannelLedgerController],
  providers: [LedgerService, FinancialApprovalService],
  exports: [LedgerService, FinancialApprovalService],
})
export class LedgerModule {}

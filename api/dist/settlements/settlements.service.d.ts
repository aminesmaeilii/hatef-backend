import type { CreateSettlement, DecideFinancialApproval, Settlement } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
export declare class SettlementsService {
    private readonly prisma;
    private readonly ledger;
    private readonly notifications;
    private readonly auditLog;
    constructor(prisma: PrismaService, ledger: LedgerService, notifications: NotificationsService, auditLog: AuditLogService);
    /** Available-to-settle value for one obligation: total accepted (from DeliverableReview rows) minus already settled. */
    private getAvailableTargets;
    create(input: CreateSettlement, actor: RequestActor): Promise<Settlement>;
    /** Manual settlement always requires dual approval (spec 16.5) — this just opens the gate. */
    submitForApproval(settlementId: string, actor: RequestActor): Promise<Settlement>;
    decideApproval(settlementId: string, input: DecideFinancialApproval, actor: RequestActor): Promise<Settlement>;
    getOne(settlementId: string): Promise<Settlement>;
    listForChannel(channelId: string): Promise<Settlement[]>;
}
//# sourceMappingURL=settlements.service.d.ts.map
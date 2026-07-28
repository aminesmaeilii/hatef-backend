import type { CreateObligation, CreateObligationProposal, Deliverable, Dispute, Obligation, ObligationDetail, RaiseDispute, RespondToObligationProposal, ResolveObligationDispute, ReviewDeliverable, SubmitDeliverable } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ServiceCatalogService } from "./service-catalog.service";
export declare class ObligationsService {
    private readonly prisma;
    private readonly ledger;
    private readonly serviceCatalog;
    private readonly notifications;
    private readonly auditLog;
    constructor(prisma: PrismaService, ledger: LedgerService, serviceCatalog: ServiceCatalogService, notifications: NotificationsService, auditLog: AuditLogService);
    propose(input: CreateObligation, actor: RequestActor): Promise<Obligation>;
    list(filters: {
        channelId?: string;
        status?: string;
    }): Promise<Obligation[]>;
    getDetail(obligationId: string): Promise<ObligationDetail>;
    /** A counter-proposal — either side can send one while still PROPOSED/NEGOTIATING (spec 16.3 "negotiate"). */
    counterPropose(obligationId: string, input: CreateObligationProposal, actor: RequestActor): Promise<Obligation>;
    respondToProposal(obligationId: string, input: RespondToObligationProposal, actor: RequestActor): Promise<Obligation>;
    submitDeliverable(obligationId: string, input: SubmitDeliverable, actor: RequestActor): Promise<Deliverable>;
    listDeliverables(obligationId: string): Promise<Deliverable[]>;
    /**
     * Reviewer action (spec 16.4). ACCEPT_FULL/ACCEPT_PARTIAL post a real
     * SERVICE_ACCEPTED LedgerEntry pair immediately — accepted value becomes a
     * ledger fact the moment it's accepted, not deferred until settlement.
     */
    reviewDeliverable(deliverableId: string, input: ReviewDeliverable, actor: RequestActor): Promise<Deliverable>;
    raiseDispute(obligationId: string, input: RaiseDispute, actor: RequestActor): Promise<Dispute>;
    /** RESOLVED_REVERSED triggers a real ledger reversal of the disputed acceptance posting — never a silent balance edit (spec 16.5). */
    resolveDispute(disputeId: string, input: ResolveObligationDispute, actor: RequestActor): Promise<Dispute>;
    transition(obligationId: string, toStatus: Obligation["status"], note: string | undefined, actor: RequestActor): Promise<Obligation>;
    private assertTransition;
}
//# sourceMappingURL=obligations.service.d.ts.map
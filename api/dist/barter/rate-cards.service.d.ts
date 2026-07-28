import type { CreateRateCardItem, RateCard, ReviewRateCardItem } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
export declare class RateCardsService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    /** Every version is kept — old versions are never deleted (spec 17, same immutable-history discipline as every other *Version model). */
    private getOrCreateDraft;
    addItem(channelId: string, input: CreateRateCardItem, actor: RequestActor): Promise<RateCard>;
    /** "The declared rate is not automatically approved" (spec 17) — submitting just moves the card into the admin review queue. */
    submit(channelId: string, actor: RequestActor): Promise<RateCard>;
    getCurrent(channelId: string): Promise<RateCard>;
    listSubmitted(): Promise<RateCard[]>;
    /** Admin can review/comment/approve/negotiate/archive per-item (spec 17) — a card can be part-approved, part-negotiating. */
    reviewItem(itemId: string, input: ReviewRateCardItem, actor: RequestActor): Promise<void>;
}
//# sourceMappingURL=rate-cards.service.d.ts.map
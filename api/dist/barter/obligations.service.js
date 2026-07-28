"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObligationsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const ledger_service_1 = require("../ledger/ledger.service");
const notifications_service_1 = require("../notifications/notifications.service");
const service_catalog_service_1 = require("./service-catalog.service");
const obligation_state_machine_1 = require("./obligation-state-machine");
let ObligationsService = class ObligationsService {
    prisma;
    ledger;
    serviceCatalog;
    notifications;
    auditLog;
    constructor(prisma, ledger, serviceCatalog, notifications, auditLog) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.serviceCatalog = serviceCatalog;
        this.notifications = notifications;
        this.auditLog = auditLog;
    }
    async propose(input, actor) {
        const activeVersion = await this.serviceCatalog.getActiveVersionOrThrow(input.serviceCatalogItemId);
        const created = await this.prisma.serviceObligation.create({
            data: {
                channelId: input.channelId,
                supportRequestId: input.supportRequestId,
                serviceCatalogItemId: input.serviceCatalogItemId,
                serviceCatalogVersionId: activeVersion.id,
                brief: input.brief,
                output: input.output,
                acceptanceCriteria: input.acceptanceCriteria ?? activeVersion.defaultAcceptanceCriteria,
                valueRial: BigInt(input.valueRial),
                startAt: input.startAt ? new Date(input.startAt) : undefined,
                deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
                responsibleChannelMemberId: input.responsibleChannelMemberId,
                responsibleHatefEmployeeId: input.responsibleHatefEmployeeId,
                terms: input.terms,
                createdById: actor.userId,
                proposals: {
                    create: { versionNumber: 1, proposedById: actor.userId, valueRial: BigInt(input.valueRial), brief: input.brief },
                },
                statusEvents: { create: { toStatus: "PROPOSED", createdBy: actor.userId } },
            },
            include: { serviceCatalogItem: true, channel: true },
        });
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: "obligation.proposed",
            entityType: "service_obligation",
            entityId: created.id,
        });
        await this.notifications.notifyChannelOwner(created.channelId, {
            eventType: "obligation.proposed",
            dedupeKey: `obligation:${created.id}:proposed`,
            title: "پیشنهاد تعهد خدمت متقابل جدید",
            body: input.brief,
            deepLink: `/obligations/${created.id}`,
            linkedEntityType: "service_obligation",
            linkedEntityId: created.id,
            channels: ["IN_APP", "SMS"],
        });
        return toObligationDto(created);
    }
    async list(filters) {
        const rows = await this.prisma.serviceObligation.findMany({
            where: { channelId: filters.channelId, status: filters.status },
            include: { serviceCatalogItem: true, channel: true },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toObligationDto);
    }
    async getDetail(obligationId) {
        const row = await this.prisma.serviceObligation.findUniqueOrThrow({
            where: { id: obligationId },
            include: {
                serviceCatalogItem: true,
                channel: true,
                proposals: { orderBy: { versionNumber: "asc" } },
                statusEvents: { orderBy: { createdAt: "asc" } },
            },
        });
        return {
            ...toObligationDto(row),
            proposals: row.proposals.map((p) => ({
                id: p.id,
                versionNumber: p.versionNumber,
                proposedById: p.proposedById,
                status: p.status,
                valueRial: (0, domain_1.serializeRial)(p.valueRial),
                brief: p.brief,
                deadlineAt: p.deadlineAt?.toISOString() ?? null,
                note: p.note,
                createdAt: p.createdAt.toISOString(),
            })),
            statusEvents: row.statusEvents.map((e) => ({
                id: e.id,
                fromStatus: e.fromStatus,
                toStatus: e.toStatus,
                note: e.note,
                createdAt: e.createdAt.toISOString(),
            })),
        };
    }
    /** A counter-proposal — either side can send one while still PROPOSED/NEGOTIATING (spec 16.3 "negotiate"). */
    async counterPropose(obligationId, input, actor) {
        const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
        this.assertTransition(obligation.status, "NEGOTIATING");
        const last = await this.prisma.obligationProposal.findFirst({ where: { obligationId }, orderBy: { versionNumber: "desc" } });
        await this.prisma.$transaction([
            ...(last && last.status === "PROPOSED"
                ? [this.prisma.obligationProposal.update({ where: { id: last.id }, data: { status: "COUNTERED" } })]
                : []),
            this.prisma.obligationProposal.create({
                data: {
                    obligationId,
                    versionNumber: (last?.versionNumber ?? 0) + 1,
                    proposedById: actor.userId,
                    valueRial: BigInt(input.valueRial),
                    brief: input.brief,
                    deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
                    note: input.note,
                },
            }),
        ]);
        return this.transition(obligationId, "NEGOTIATING", "پیشنهاد جدید ثبت شد.", actor);
    }
    async respondToProposal(obligationId, input, actor) {
        const latest = await this.prisma.obligationProposal.findFirst({ where: { obligationId }, orderBy: { versionNumber: "desc" } });
        if (!latest)
            throw new common_1.NotFoundException("پیشنهادی برای این تعهد یافت نشد.");
        if (input.action === "ACCEPT") {
            await this.prisma.$transaction([
                this.prisma.obligationProposal.update({ where: { id: latest.id }, data: { status: "ACCEPTED", respondedAt: new Date() } }),
                this.prisma.serviceObligation.update({ where: { id: obligationId }, data: { valueRial: latest.valueRial } }),
            ]);
            return this.transition(obligationId, "ACCEPTED", input.note, actor);
        }
        await this.prisma.obligationProposal.update({ where: { id: latest.id }, data: { status: "REJECTED", respondedAt: new Date() } });
        return this.transition(obligationId, "CANCELLED", input.note ?? "پیشنهاد رد شد.", actor);
    }
    async submitDeliverable(obligationId, input, actor) {
        const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
        if (!["ACCEPTED", "SCHEDULED", "IN_PROGRESS", "NEEDS_REVISION"].includes(obligation.status)) {
            throw new common_1.BadRequestException("در این وضعیت امکان ثبت خروجی وجود ندارد.");
        }
        const deliverable = await this.prisma.deliverable.create({
            data: {
                obligationId,
                submittedById: actor.userId,
                description: input.description,
                links: input.links,
                reachOrViews: input.reachOrViews,
                deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : new Date(),
                attachments: { create: input.fileIds.map((fileAssetId) => ({ fileAssetId })) },
            },
            include: { attachments: true, reviews: true },
        });
        if (obligation.status !== "SUBMITTED") {
            await this.transition(obligationId, "SUBMITTED", "خروجی جدید ثبت شد.", actor);
        }
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: "deliverable.submitted",
            entityType: "deliverable",
            entityId: deliverable.id,
            metadata: { obligationId },
        });
        return toDeliverableDto(deliverable);
    }
    async listDeliverables(obligationId) {
        const rows = await this.prisma.deliverable.findMany({
            where: { obligationId },
            include: { attachments: true, reviews: { orderBy: { createdAt: "asc" } } },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toDeliverableDto);
    }
    /**
     * Reviewer action (spec 16.4). ACCEPT_FULL/ACCEPT_PARTIAL post a real
     * SERVICE_ACCEPTED LedgerEntry pair immediately — accepted value becomes a
     * ledger fact the moment it's accepted, not deferred until settlement.
     */
    async reviewDeliverable(deliverableId, input, actor) {
        const deliverable = await this.prisma.deliverable.findUniqueOrThrow({
            where: { id: deliverableId },
            include: { obligation: true },
        });
        let acceptedValueRial = null;
        let remainingValueRial = null;
        let nextDeliverableStatus;
        let nextObligationStatus = null;
        switch (input.decision) {
            case "ACCEPT_FULL": {
                const result = (0, domain_1.computePartialAcceptance)({ deliverableValueRial: deliverable.obligation.valueRial, acceptedValueRial: deliverable.obligation.valueRial });
                acceptedValueRial = result.acceptedValueRial;
                remainingValueRial = result.remainingValueRial;
                nextDeliverableStatus = "ACCEPTED";
                nextObligationStatus = "APPROVED";
                break;
            }
            case "ACCEPT_PARTIAL": {
                if (!input.acceptedValueRial)
                    throw new common_1.BadRequestException("مبلغ پذیرفته‌شده الزامی است.");
                try {
                    const result = (0, domain_1.computePartialAcceptance)({
                        deliverableValueRial: deliverable.obligation.valueRial,
                        acceptedValueRial: BigInt(input.acceptedValueRial),
                    });
                    acceptedValueRial = result.acceptedValueRial;
                    remainingValueRial = result.remainingValueRial;
                }
                catch (error) {
                    if (error instanceof domain_1.InvalidPartialAcceptanceError)
                        throw new common_1.BadRequestException(error.message);
                    throw error;
                }
                nextDeliverableStatus = "PARTIALLY_ACCEPTED";
                nextObligationStatus = "PARTIALLY_APPROVED";
                break;
            }
            case "REQUEST_REVISION":
                nextDeliverableStatus = "NEEDS_REVISION";
                nextObligationStatus = "NEEDS_REVISION";
                break;
            case "REJECT":
                nextDeliverableStatus = "REJECTED";
                nextObligationStatus = "NEEDS_REVISION";
                break;
            case "DISPUTE":
                nextDeliverableStatus = "DISPUTED";
                nextObligationStatus = "DISPUTED";
                break;
        }
        await this.prisma.$transaction([
            this.prisma.deliverableReview.create({
                data: {
                    deliverableId,
                    reviewerId: actor.userId,
                    decision: input.decision,
                    acceptedValueRial: acceptedValueRial ?? undefined,
                    remainingValueRial: remainingValueRial ?? undefined,
                    note: input.note,
                },
            }),
            this.prisma.deliverable.update({ where: { id: deliverableId }, data: { status: nextDeliverableStatus } }),
        ]);
        if (input.decision === "DISPUTE") {
            await this.prisma.dispute.create({
                data: { obligationId: deliverable.obligationId, deliverableId, raisedById: actor.userId, reason: input.note ?? "اختلاف در بازبینی خروجی" },
            });
        }
        if (nextObligationStatus) {
            await this.transition(deliverable.obligationId, nextObligationStatus, input.note, actor);
        }
        if (acceptedValueRial && acceptedValueRial > 0n) {
            await this.ledger.post({
                transactionType: "SERVICE_ACCEPTED",
                idempotencyKey: `deliverable-review:${deliverableId}`,
                sourceType: "deliverable",
                sourceId: deliverableId,
                description: "پذیرش ارزش خروجی خدمت متقابل",
                createdBy: actor.userId,
                entries: [
                    {
                        channelId: deliverable.obligation.channelId,
                        accountType: "CHANNEL_SERVICE_DELIVERED",
                        direction: "DEBIT",
                        amountRial: acceptedValueRial,
                    },
                    {
                        channelId: deliverable.obligation.channelId,
                        accountType: "CHANNEL_SERVICE_OBLIGATION",
                        direction: "CREDIT",
                        amountRial: acceptedValueRial,
                    },
                ],
            });
        }
        const updated = await this.prisma.deliverable.findUniqueOrThrow({
            where: { id: deliverableId },
            include: { attachments: true, reviews: { orderBy: { createdAt: "asc" } } },
        });
        await this.notifications.notify({
            userId: deliverable.submittedById,
            eventType: "deliverable.reviewed",
            dedupeKey: `deliverable:${deliverableId}:review:${updated.reviews.at(-1)?.id}`,
            title: "بازبینی خروجی تعهد خدمت متقابل",
            body: input.note ?? `نتیجه بازبینی: ${input.decision}`,
            deepLink: `/obligations/${deliverable.obligationId}`,
            linkedEntityType: "deliverable",
            linkedEntityId: deliverableId,
            channels: ["IN_APP", "SMS"],
        });
        return toDeliverableDto(updated);
    }
    async raiseDispute(obligationId, input, actor) {
        const dispute = await this.prisma.dispute.create({
            data: { obligationId, deliverableId: input.deliverableId, raisedById: actor.userId, reason: input.reason },
        });
        await this.transition(obligationId, "DISPUTED", input.reason, actor);
        return toDisputeDto(dispute);
    }
    /** RESOLVED_REVERSED triggers a real ledger reversal of the disputed acceptance posting — never a silent balance edit (spec 16.5). */
    async resolveDispute(disputeId, input, actor) {
        const dispute = await this.prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } });
        if (dispute.status !== "OPEN") {
            throw new common_1.BadRequestException("این اختلاف قبلاً حل شده است.");
        }
        if (input.outcome === "REVERSE" && dispute.deliverableId) {
            const original = await this.prisma.ledgerTransaction.findUnique({
                where: { idempotencyKey: `deliverable-review:${dispute.deliverableId}` },
            });
            if (original) {
                await this.ledger.reverse(original.id, input.note, actor.userId);
            }
        }
        const updated = await this.prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: input.outcome === "REVERSE" ? "RESOLVED_REVERSED" : "RESOLVED_UPHELD",
                resolutionNote: input.note,
                resolvedById: actor.userId,
                resolvedAt: new Date(),
            },
        });
        const nextStatus = input.outcome === "REVERSE" ? "NEEDS_REVISION" : "APPROVED";
        await this.transition(dispute.obligationId, nextStatus, input.note, actor);
        return toDisputeDto(updated);
    }
    async transition(obligationId, toStatus, note, actor) {
        const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
        this.assertTransition(obligation.status, toStatus);
        const [, , updated] = await this.prisma.$transaction([
            this.prisma.serviceObligation.update({ where: { id: obligationId }, data: { status: toStatus } }),
            this.prisma.obligationStatusEvent.create({
                data: { obligationId, fromStatus: obligation.status, toStatus, note, createdBy: actor.userId },
            }),
            this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId }, include: { serviceCatalogItem: true, channel: true } }),
        ]);
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: "obligation.transitioned",
            entityType: "service_obligation",
            entityId: obligationId,
            metadata: { from: obligation.status, to: toStatus },
        });
        return toObligationDto(updated);
    }
    assertTransition(from, to) {
        try {
            obligation_state_machine_1.obligationStateMachine.assertTransition(from, to);
        }
        catch (error) {
            if (error instanceof domain_1.IllegalStateTransitionError) {
                throw new common_1.BadRequestException(`تغییر وضعیت از «${from}» به «${to}» مجاز نیست.`);
            }
            throw error;
        }
    }
};
exports.ObligationsService = ObligationsService;
exports.ObligationsService = ObligationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        service_catalog_service_1.ServiceCatalogService,
        notifications_service_1.NotificationsService,
        audit_log_service_1.AuditLogService])
], ObligationsService);
function toObligationDto(o) {
    return {
        id: o.id,
        channelId: o.channelId,
        channelTitle: o.channel.title,
        supportRequestId: o.supportRequestId,
        serviceCatalogItemId: o.serviceCatalogItemId,
        serviceCatalogItemName: o.serviceCatalogItem.name,
        status: o.status,
        brief: o.brief,
        output: o.output,
        acceptanceCriteria: o.acceptanceCriteria,
        valueRial: (0, domain_1.serializeRial)(o.valueRial),
        settledValueRial: (0, domain_1.serializeRial)(o.settledValueRial),
        startAt: o.startAt?.toISOString() ?? null,
        deadlineAt: o.deadlineAt?.toISOString() ?? null,
        responsibleChannelMemberId: o.responsibleChannelMemberId,
        responsibleHatefEmployeeId: o.responsibleHatefEmployeeId,
        terms: o.terms,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
    };
}
function toDeliverableDto(d) {
    return {
        id: d.id,
        obligationId: d.obligationId,
        submittedById: d.submittedById,
        status: d.status,
        description: d.description,
        links: d.links ?? [],
        reachOrViews: d.reachOrViews,
        deliveredAt: d.deliveredAt?.toISOString() ?? null,
        fileIds: d.attachments.map((a) => a.fileAssetId),
        reviews: d.reviews.map((r) => ({
            id: r.id,
            reviewerId: r.reviewerId,
            decision: r.decision,
            acceptedValueRial: r.acceptedValueRial !== null ? (0, domain_1.serializeRial)(r.acceptedValueRial) : null,
            remainingValueRial: r.remainingValueRial !== null ? (0, domain_1.serializeRial)(r.remainingValueRial) : null,
            note: r.note,
            createdAt: r.createdAt.toISOString(),
        })),
        createdAt: d.createdAt.toISOString(),
    };
}
function toDisputeDto(d) {
    return {
        id: d.id,
        obligationId: d.obligationId,
        deliverableId: d.deliverableId,
        raisedById: d.raisedById,
        reason: d.reason,
        status: d.status,
        resolutionNote: d.resolutionNote,
        resolvedById: d.resolvedById,
        resolvedAt: d.resolvedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
    };
}
